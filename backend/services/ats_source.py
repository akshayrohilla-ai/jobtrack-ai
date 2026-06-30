"""
ATS source — "direct from company career pages" job layer.

Fetches live openings from the curated companies in `ats_companies.py` via their
ATS public APIs (Greenhouse / Lever / Ashby), normalizes them to the shared job-card
shape, and lets us search across them. Every `apply_url` is the company's OWN
career-page application link — the differentiator. [[project-job-search]]

Architecture (v1): a periodic refresh (`refresh_cache`) fetches all boards in
parallel and stores them as ONE blob in `job_search_cache` under key "ats:all".
A search loads that blob once and filters in memory (India-first ordering). No new
table, no per-search fan-out. On a cold cache it refreshes inline as a fallback.
"""
import re
import time
import asyncio
import difflib
import datetime
from collections import Counter

import httpx

from services.ats_companies import ATS_COMPANIES
from services.supabase_client import get_supabase

CACHE_TABLE = "job_search_cache"
CACHE_KEY = "ats:all"
REFRESH_TTL_SECONDS = 24 * 3600
RECENCY_DAYS = {"24h": 1, "week": 7, "month": 30, "any": None}
RESULT_LIMIT = 30

INDIAN_CITIES = {
    "bengaluru", "bangalore", "mumbai", "pune", "hyderabad", "chennai",
    "delhi", "gurgaon", "gurugram", "noida", "kolkata", "ahmedabad",
}


# ---- per-ATS normalizers -> shared card shape ----

def _norm_gh(j, name):
    return {
        "id": f"gh-{j.get('id')}", "title": (j.get("title") or "").strip(),
        "company": name, "location": ((j.get("location") or {}).get("name") or "").strip(),
        "posted_date": (j.get("updated_at") or "")[:10], "salary": None,
        "source": name, "direct": True, "apply_url": j.get("absolute_url", ""), "snippet": "",
    }


def _norm_lever(j, name):
    cats = j.get("categories") or {}
    posted = ""
    ts = j.get("createdAt")
    if ts:
        try:
            posted = datetime.datetime.utcfromtimestamp(ts / 1000).strftime("%Y-%m-%d")
        except Exception:
            posted = ""
    return {
        "id": f"lv-{j.get('id')}", "title": (j.get("text") or "").strip(),
        "company": name, "location": (cats.get("location") or "").strip(),
        "posted_date": posted, "salary": None,
        "source": name, "direct": True,
        "apply_url": j.get("hostedUrl") or j.get("applyUrl") or "", "snippet": "",
    }


def _norm_ashby(j, name):
    return {
        "id": f"as-{j.get('id')}", "title": (j.get("title") or "").strip(),
        "company": name, "location": (j.get("location") or "").strip(),
        "posted_date": (j.get("publishedAt") or "")[:10], "salary": None,
        "source": name, "direct": True,
        "apply_url": j.get("jobUrl") or j.get("applyUrl") or "", "snippet": "",
    }


_ENDPOINTS = {
    "greenhouse": ("https://boards-api.greenhouse.io/v1/boards/{t}/jobs?content=false", "jobs", _norm_gh),
    "lever":      ("https://api.lever.co/v0/postings/{t}?mode=json",                    "_list", _norm_lever),
    "ashby":      ("https://api.ashbyhq.com/posting-api/job-board/{t}",                 "jobs", _norm_ashby),
}


async def _fetch_one(client, company):
    ats, token, name = company["ats"], company["token"], company["name"]
    url_tmpl, shape, norm = _ENDPOINTS[ats]
    try:
        r = await client.get(url_tmpl.format(t=token))
        r.raise_for_status()
        data = r.json()
        rows = data if shape == "_list" else (data.get("jobs", []) or [])
        return [norm(j, name) for j in rows if (j.get("title") or j.get("text"))]
    except Exception as e:
        print(f"[ats] {name} ({ats}) fetch failed: {e}", flush=True)
        return []


async def fetch_all():
    """Fetch + normalize every curated board in parallel. No DB access (pure)."""
    async with httpx.AsyncClient(timeout=15, headers={"User-Agent": "jobtrack/1.0"}) as client:
        results = await asyncio.gather(*[_fetch_one(client, c) for c in ATS_COMPANIES])
    return [j for sub in results for j in sub]


# ---- search / filter (pure) ----

def _tokens(s):
    return [t for t in re.split(r"[^a-z0-9]+", (s or "").lower()) if t]


_FOREIGN = (" us", "u.s", "usa", "united states", "uk", "united kingdom", "canada",
            "france", "germany", "europe", "emea", "latam", "brazil", "australia",
            "singapore", "japan", "china", "mexico", "ireland", "poland", "spain",
            "netherlands", "philippines", "indonesia")


def _location_ok(jl):
    """India-eligible? India / an Indian city, OR a remote role not tied to a foreign
    region ('Remote' and 'Remote - India' count; 'Remote - US' / 'Remote EMEA' don't)."""
    if ("india" in jl) or any(c in jl for c in INDIAN_CITIES):
        return True
    if "remote" in jl:
        return not any(f in jl for f in _FOREIGN)
    return False


def _correct_tokens(tokens, vocab):
    """Typo tolerance: map each query token to the nearest title word in the corpus
    (so 'projet'/'enginer' still match). Short tokens and exact hits pass through."""
    out = []
    for t in tokens:
        if len(t) <= 2 or t in vocab:
            out.append(t)
        else:
            m = difflib.get_close_matches(t, vocab, n=1, cutoff=0.8)
            out.append(m[0] if m else t)
    return out


def _filter(jobs, query, location, recency="any"):
    q_tokens = _tokens(query)
    if q_tokens:
        # Correct against COMMON title words only (>=3 occurrences) so typos/foreign
        # noise tokens ("enginer", "produit") don't pollute the spell dictionary.
        counts = Counter(t for j in jobs for t in _tokens(j["title"]))
        vocab = {w for w, c in counts.items() if c >= 3}
        q_tokens = _correct_tokens(q_tokens, vocab)
    loc = (location or "").lower().strip()
    anywhere = loc in ("any location", "anywhere", "any", "all", "all locations", "")
    days = RECENCY_DAYS.get(recency)
    cutoff = None
    if days:
        cutoff = (datetime.datetime.now(datetime.timezone.utc).date()
                  - datetime.timedelta(days=days)).isoformat()
    out = []
    for j in jobs:
        title = j["title"].lower()
        if q_tokens and not all(t in title for t in q_tokens):
            continue
        # Recency: drop anything older than the cutoff (and undated jobs when filtering).
        if cutoff and (not j["posted_date"] or j["posted_date"] < cutoff):
            continue
        jl = j["location"].lower()
        if anywhere:
            if not _location_ok(jl):          # "Any location" = anywhere in India (+ remote-eligible)
                continue
            city_match = False
        else:
            if loc in jl:
                city_match = True
            elif _location_ok(jl):            # India-wide or India-eligible remote
                city_match = False
            else:
                continue
        out.append((j, city_match))
    # Exact-city matches first, then most-recently-posted.
    out.sort(key=lambda x: (x[1], x[0]["posted_date"]), reverse=True)
    return [j for j, _ in out]


# ---- cache layer ----

def _store(jobs):
    try:
        sb = get_supabase()
        now = datetime.datetime.now(datetime.timezone.utc)
        sb.table(CACHE_TABLE).upsert({
            "cache_key": CACHE_KEY,
            "payload": jobs,
            "expires_at": (now + datetime.timedelta(seconds=REFRESH_TTL_SECONDS)).isoformat(),
            "created_at": now.isoformat(),
        }).execute()
    except Exception as e:
        print(f"[ats] cache store failed: {e}", flush=True)


# In-process cache so we don't re-read/parse the multi-MB blob from Supabase on
# every search (Render runs WEB_CONCURRENCY=1). Refreshed at most hourly per process.
_MEM = {"jobs": None, "ts": 0.0}
MEM_TTL_SECONDS = 3600


def _load_blob():
    """Read the cached job blob from Supabase. Returns the list or None if missing/stale."""
    try:
        sb = get_supabase()
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        res = (
            sb.table(CACHE_TABLE).select("payload")
            .eq("cache_key", CACHE_KEY).gt("expires_at", now_iso).limit(1).execute()
        )
        if res.data:
            return res.data[0]["payload"]
    except Exception as e:
        print(f"[ats] cache load failed: {e}", flush=True)
    return None


async def _load_all():
    """Return the full job list — from memory if warm, else the Supabase blob, else
    a live fetch (cold start). Keeps per-search latency near-zero once warm."""
    now = time.time()
    if _MEM["jobs"] is not None and (now - _MEM["ts"]) < MEM_TTL_SECONDS:
        return _MEM["jobs"]
    jobs = _load_blob()
    if jobs is None:
        jobs = await fetch_all()   # cold: nothing cached yet
        _store(jobs)
    _MEM["jobs"], _MEM["ts"] = jobs, now
    return jobs


async def refresh_cache():
    """Fetch all boards, overwrite the Supabase blob, and warm the in-process cache."""
    jobs = await fetch_all()
    _store(jobs)
    _MEM["jobs"], _MEM["ts"] = jobs, time.time()
    return len(jobs)


async def search(query, location, recency="any"):
    """Search the curated career-page jobs. Returns up to RESULT_LIMIT normalized cards."""
    jobs = await _load_all()
    return _filter(jobs, query, location, recency)[:RESULT_LIMIT]
