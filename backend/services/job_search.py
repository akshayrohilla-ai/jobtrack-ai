"""
Job search service — fetches real job postings from Adzuna (free aggregator,
India), normalizes them to a common card shape, and caches results in Supabase
with a TTL so the free-tier API budget stretches across users.

Design notes:
- Adzuna covers ONE country per request; we use India ("in"). Locations Adzuna
  can't serve (UAE/Dubai) return None so the router falls back to LinkedIn links.
- "anywhere" omits the location filter => nationwide search (the new default).
- The cache is keyed by the NORMALIZED search (query+location+seniority+recency),
  so identical searches within the TTL window cost zero API calls. Each miss also
  opportunistically purges expired rows, keeping the table permanently bounded.
- Returns None to signal "use the LinkedIn deep-link fallback" (provider not
  configured, unsupported location, or an upstream error). [[project-job-search]]
"""
import os
import re
import hashlib
from datetime import datetime, timezone, timedelta

import httpx

from services.supabase_client import get_supabase

ADZUNA_BASE = "https://api.adzuna.com/v1/api/jobs"
ADZUNA_COUNTRY = "in"          # India — Adzuna is per-country
CACHE_TABLE = "job_search_cache"
CACHE_TTL_SECONDS = 12 * 3600  # 12h — fresh enough for postings, gentle on the API budget

# City label (lowercased) -> Adzuna `where` value. "anywhere" => no filter (nationwide).
ADZUNA_LOCATIONS = {
    "anywhere":  None,
    "pune":      "Pune",
    "bangalore": "Bengaluru",
    "hyderabad": "Hyderabad",
    "mumbai":    "Mumbai",
    "gurgaon":   "Gurugram",
    "chennai":   "Chennai",
    "delhi":     "Delhi",
}

# Locations outside Adzuna's India coverage -> caller uses the LinkedIn fallback.
NON_ADZUNA_LOCATIONS = {"uae", "dubai"}

RECENCY_DAYS = {"24h": 1, "week": 7, "month": 30, "any": None}
SENIORITY_KEYWORDS = {"senior": "senior", "mid": "", "any": ""}

_TAG_RE = re.compile(r"<[^>]+>")


def normalize_location(label: str) -> str:
    """Map a frontend location label to an internal location key."""
    loc = (label or "").lower().strip()
    if loc in ("any location", "anywhere", "any", "all", "all locations", ""):
        return "anywhere"
    return loc


def _cache_key(query: str, location: str, seniority: str, recency: str) -> str:
    raw = f"adzuna|{query.strip().lower()}|{location}|{seniority}|{recency}"
    return hashlib.sha256(raw.encode()).hexdigest()


def _get_cached(key: str):
    """Return cached payload (a list of normalized jobs) or None. Purges expired rows."""
    try:
        sb = get_supabase()
        now_iso = datetime.now(timezone.utc).isoformat()
        # Opportunistic cleanup so the cache table never grows unbounded.
        sb.table(CACHE_TABLE).delete().lt("expires_at", now_iso).execute()
        res = (
            sb.table(CACHE_TABLE)
            .select("payload")
            .eq("cache_key", key)
            .gt("expires_at", now_iso)
            .limit(1)
            .execute()
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
    lo, hi = j.get("salary_min"), j.get("salary_max")
    if not lo and not hi:
        return None
    fmt = lambda v: f"₹{int(v):,}"  # ₹ with thousands separators
    if lo and hi and int(lo) != int(hi):
        return f"{fmt(lo)}–{fmt(hi)}"  # en-dash range
    return fmt(lo or hi)


def _normalize(j: dict) -> dict:
    desc = _TAG_RE.sub("", j.get("description", "") or "").strip()
    return {
        "id": str(j.get("id") or ""),
        "title": (j.get("title") or "").strip(),
        "company": ((j.get("company") or {}).get("display_name") or "").strip(),
        "location": ((j.get("location") or {}).get("display_name") or "").strip(),
        "posted_date": (j.get("created") or "")[:10],
        "salary": _salary(j),
        "source": "Adzuna",
        "apply_url": j.get("redirect_url", ""),
        "snippet": desc[:240],
    }


async def _fetch_adzuna(query: str, location_key: str, seniority: str, recency: str):
    """Call Adzuna. Returns a list of normalized jobs, or None if not configured."""
    app_id = os.getenv("ADZUNA_APP_ID")
    app_key = os.getenv("ADZUNA_APP_KEY")
    if not app_id or not app_key:
        return None  # not configured -> signal fallback

    what = query.strip()
    kw = SENIORITY_KEYWORDS.get(seniority, "")
    if kw and not what.lower().startswith(kw):  # Adzuna has no seniority field; fold into keywords
        what = f"{kw} {what}"

    params = {
        "app_id": app_id,
        "app_key": app_key,
        "what": what,
        "results_per_page": 20,
        "sort_by": "date",
    }
    where = ADZUNA_LOCATIONS.get(location_key)
    if where:
        params["where"] = where
    days = RECENCY_DAYS.get(recency)
    if days:
        params["max_days_old"] = days

    url = f"{ADZUNA_BASE}/{ADZUNA_COUNTRY}/search/1"
    async with httpx.AsyncClient(timeout=12) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

    return [_normalize(j) for j in data.get("results", []) if j.get("title")]


async def search(query: str, location: str, seniority: str, recency: str):
    """
    Returns a list of normalized job cards, or None to signal the caller should
    use the LinkedIn deep-link fallback (unsupported location, not configured,
    or upstream error).
    """
    location_key = normalize_location(location)
    if location_key in NON_ADZUNA_LOCATIONS:
        return None  # outside Adzuna India coverage

    key = _cache_key(query, location_key, seniority, recency)
    cached = _get_cached(key)
    if cached is not None:
        return cached

    try:
        jobs = await _fetch_adzuna(query, location_key, seniority, recency)
    except Exception as e:
        print(f"[job_search] adzuna fetch failed: {e}", flush=True)
        return None

    if jobs is None:
        return None  # not configured
    _set_cache(key, jobs)
    return jobs
