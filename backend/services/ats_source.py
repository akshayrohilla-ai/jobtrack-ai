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
import asyncio
import datetime

import httpx

from services.ats_companies import ATS_COMPANIES
from services.supabase_client import get_supabase

CACHE_TABLE = "job_search_cache"
CACHE_KEY = "ats:all"
REFRESH_TTL_SECONDS = 24 * 3600

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


def _india_relevant(jl):
    # India-first product: a location counts only if it names India or an Indian
    # city. Bare "Remote" (often US/EU-only) is intentionally excluded.
    return ("india" in jl) or any(c in jl for c in INDIAN_CITIES)


def _filter(jobs, query, location):
    q_tokens = _tokens(query)
    loc = (location or "").lower().strip()
    anywhere = loc in ("any location", "anywhere", "any", "all", "all locations", "")
    out = []
    for j in jobs:
        title = j["title"].lower()
        if q_tokens and not all(t in title for t in q_tokens):
            continue
        jl = j["location"].lower()
        if anywhere:
            if not _india_relevant(jl):       # "Any location" = anywhere in India
                continue
            city_match = False
        else:
            if loc not in jl and "india" not in jl:   # the chosen city, or India-wide
                continue
            city_match = loc in jl
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


async def _load_all():
    """Load the cached blob; refresh inline if missing/stale (cold-cache fallback)."""
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
    jobs = await fetch_all()
    _store(jobs)
    return jobs


async def refresh_cache():
    """Fetch all boards and overwrite the cache blob. Returns the job count."""
    jobs = await fetch_all()
    _store(jobs)
    return len(jobs)


async def search(query, location):
    """Search the curated career-page jobs. Returns normalized cards (may be empty)."""
    jobs = await _load_all()
    return _filter(jobs, query, location)
