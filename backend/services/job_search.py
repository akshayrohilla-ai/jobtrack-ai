"""
Aggregator job source — JSearch (RapidAPI / Google for Jobs).

Fetches broad job listings, normalizes them to the shared card shape, and caches
results in Supabase (12h TTL) so the free-tier budget (200/mo) stretches across
users. JSearch aggregates Google for Jobs, so results often carry a DIRECT company
apply link (via `apply_options[].is_direct`) rather than a board redirect — we
prefer that link. Returns None to signal the caller should use the LinkedIn
deep-link fallback (not configured, or upstream error). [[project-job-search]]
"""
import os
import re
import hashlib
from datetime import datetime, timezone, timedelta

import httpx

from services.supabase_client import get_supabase

JSEARCH_HOST = "jsearch.p.rapidapi.com"
JSEARCH_URL = f"https://{JSEARCH_HOST}/search"
CACHE_TABLE = "job_search_cache"
CACHE_TTL_SECONDS = 12 * 3600

DATE_POSTED = {"24h": "today", "week": "week", "month": "month", "any": "all"}
GULF = {"uae", "dubai"}

_TAG_RE = re.compile(r"<[^>]+>")


def normalize_location(label: str) -> str:
    """Map a frontend location label to an internal location key."""
    loc = (label or "").lower().strip()
    if loc in ("any location", "anywhere", "any", "all", "all locations", ""):
        return "anywhere"
    return loc


def _cache_key(query: str, location: str, seniority: str, recency: str) -> str:
    raw = f"jsearch|{query.strip().lower()}|{location}|{seniority}|{recency}"
    return hashlib.sha256(raw.encode()).hexdigest()


def _get_cached(key: str):
    try:
        sb = get_supabase()
        now_iso = datetime.now(timezone.utc).isoformat()
        sb.table(CACHE_TABLE).delete().lt("expires_at", now_iso).execute()  # purge expired
        res = (
            sb.table(CACHE_TABLE).select("payload")
            .eq("cache_key", key).gt("expires_at", now_iso).limit(1).execute()
        )
        if res.data:
            return res.data[0]["payload"]
    except Exception as e:
        print(f"[job_search] cache read failed: {e}", flush=True)
    return None


def _set_cache(key: str, payload) -> None:
    try:
        sb = get_supabase()
        now = datetime.now(timezone.utc)
        sb.table(CACHE_TABLE).upsert({
            "cache_key": key,
            "payload": payload,
            "expires_at": (now + timedelta(seconds=CACHE_TTL_SECONDS)).isoformat(),
            "created_at": now.isoformat(),
        }).execute()
    except Exception as e:
        print(f"[job_search] cache write failed: {e}", flush=True)


def _salary(j: dict):
    lo, hi = j.get("job_min_salary"), j.get("job_max_salary")
    if not lo and not hi:
        return None
    cur = j.get("job_salary_currency") or "INR"
    sym = {"INR": "₹", "USD": "$", "AED": "AED ", "GBP": "£", "EUR": "€"}.get(cur, cur + " ")
    fmt = lambda v: f"{sym}{int(v):,}"
    if lo and hi and int(lo) != int(hi):
        return f"{fmt(lo)}–{fmt(hi)}"
    return fmt(lo or hi)


def _normalize(j: dict) -> dict:
    # Prefer the direct company apply link when JSearch exposes one.
    apply_url = j.get("job_apply_link", "")
    source = j.get("job_publisher") or "JSearch"
    for opt in (j.get("apply_options") or []):
        if opt.get("is_direct"):
            apply_url = opt.get("apply_link") or apply_url
            source = opt.get("publisher") or source
            break
    loc = ", ".join(p for p in [j.get("job_city"), j.get("job_state"), j.get("job_country")] if p)
    desc = _TAG_RE.sub("", j.get("job_description", "") or "").strip()
    return {
        "id": str(j.get("job_id") or ""),
        "title": (j.get("job_title") or "").strip(),
        "company": (j.get("employer_name") or "").strip(),
        "location": loc,
        "posted_date": (j.get("job_posted_at_datetime_utc") or "")[:10],
        "salary": _salary(j),
        "source": source,
        "direct": False,
        "apply_url": apply_url,
        "snippet": desc[:240],
    }


async def _fetch_jsearch(query: str, location: str, seniority: str, recency: str):
    key = os.getenv("JSEARCH_API_KEY")
    if not key:
        return None  # not configured -> signal fallback

    loc_key = normalize_location(location)
    role = query.strip()
    if seniority == "senior" and not role.lower().startswith("senior"):
        role = f"senior {role}"

    if loc_key == "anywhere":
        where, country = "India", "in"
    elif loc_key in GULF:
        where, country = ("Dubai, UAE" if loc_key == "dubai" else "UAE"), "ae"
    else:
        where, country = f"{location}, India", "in"

    params = {
        "query": f"{role} in {where}",
        "page": "1",
        "num_pages": "1",
        "country": country,
        "date_posted": DATE_POSTED.get(recency, "all"),
    }
    headers = {"X-RapidAPI-Key": key, "X-RapidAPI-Host": JSEARCH_HOST}
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(JSEARCH_URL, params=params, headers=headers)
        resp.raise_for_status()
        data = resp.json()

    return [_normalize(j) for j in (data.get("data") or []) if j.get("job_title")]


async def search(query: str, location: str, seniority: str, recency: str):
    """Returns a list of normalized aggregator cards, or None to use the fallback."""
    loc_key = normalize_location(location)
    key = _cache_key(query, loc_key, seniority, recency)
    cached = _get_cached(key)
    if cached is not None:
        return cached
    try:
        jobs = await _fetch_jsearch(query, location, seniority, recency)
    except Exception as e:
        print(f"[job_search] jsearch fetch failed: {e}", flush=True)
        return None
    if jobs is None:
        return None
    _set_cache(key, jobs)
    return jobs
