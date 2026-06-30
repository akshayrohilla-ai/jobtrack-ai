import os
import re
from urllib.parse import quote, quote_plus

from fastapi import APIRouter, Query, Request, HTTPException
from slowapi import Limiter
from middleware.ratelimit import user_or_ip
from middleware.auth import get_current_user
from services import job_search, ats_source

router = APIRouter()
limiter = Limiter(key_func=user_or_ip)

LOCATION_MAP = {
    "anywhere": "India",
    "pune": "Pune%2C+Maharashtra%2C+India",
    "bangalore": "Bengaluru%2C+Karnataka%2C+India",
    "hyderabad": "Hyderabad%2C+Telangana%2C+India",
    "mumbai": "Mumbai%2C+Maharashtra%2C+India",
    "gurgaon": "Gurugram%2C+Haryana%2C+India",
    "chennai": "Chennai%2C+Tamil+Nadu%2C+India",
    "delhi": "New+Delhi%2C+Delhi%2C+India",
    "uae": "United+Arab+Emirates",
    "dubai": "Dubai%2C+United+Arab+Emirates",
}

RECENCY_MAP = {
    "24h":   ("f_TPR=r86400",   "Last 24 hours"),
    "week":  ("f_TPR=r604800",  "Last 7 days"),
    "month": ("f_TPR=r2592000", "Last 30 days"),
    "any":   ("",               "Any time"),
}

SENIORITY_MAP = {
    "senior": "f_E=4",
    "mid":    "f_E=3",
    "any":    "",
}

# Recency in days, for portals that filter by "posted within N days".
PORTAL_RECENCY_DAYS = {"24h": 1, "week": 7, "month": 30, "any": None}
# Naukri filters by a single minimum-years-of-experience number.
NAUKRI_EXP = {"senior": 7, "mid": 3, "any": None}


def _indeed_url(query: str, location: str, seniority: str, recency: str) -> str:
    """Indeed India search deep-link (relevance-sorted by default)."""
    parts = [f"q={quote_plus(query.strip())}"]
    if job_search.normalize_location(location) != "anywhere":
        parts.append(f"l={quote_plus(location)}")
    days = PORTAL_RECENCY_DAYS.get(recency)
    if days:
        parts.append(f"fromage={days}")
    return "https://in.indeed.com/jobs?" + "&".join(parts)


def _naukri_url(query: str, location: str, seniority: str, recency: str) -> str:
    """Naukri search deep-link — {keyword}-jobs[-in-{city}] with k/experience/jobAge params."""
    kw = query.strip()
    kw_slug = re.sub(r"[^a-z0-9]+", "-", kw.lower()).strip("-") or "jobs"
    path = f"{kw_slug}-jobs"
    if job_search.normalize_location(location) != "anywhere":
        city_slug = re.sub(r"[^a-z0-9]+", "-", location.lower()).strip("-")
        if city_slug:
            path += f"-in-{city_slug}"
    params = [f"k={quote(kw)}"]
    exp = NAUKRI_EXP.get(seniority)
    if exp is not None:
        params.append(f"experience={exp}")
    age = PORTAL_RECENCY_DAYS.get(recency)
    if age:
        params.append(f"jobAge={age}")
    return f"https://www.naukri.com/{path}?" + "&".join(params)


def _linkedin_fallback(query: str, location: str, seniority: str, recency: str) -> dict:
    """Build the LinkedIn deep-link payload. Used as the always-free fallback when
    the live provider is unavailable, out of budget, or doesn't cover the location."""
    loc_key = job_search.normalize_location(location)
    li_location = LOCATION_MAP.get(loc_key, location.replace(" ", "+"))

    # Strip leading seniority words from the query to avoid doubling.
    clean_query = query.strip()
    for prefix in ["Senior ", "Lead ", "Staff ", "Principal "]:
        if clean_query.lower().startswith(prefix.lower()):
            clean_query = clean_query[len(prefix):]
            break

    encoded_query = query.strip().replace(" ", "+")
    encoded_clean = clean_query.replace(" ", "+")

    filters = []
    seniority_filter = SENIORITY_MAP.get(seniority, "")
    if seniority_filter:
        filters.append(seniority_filter)

    recency_filter, recency_label = RECENCY_MAP.get(recency, RECENCY_MAP["week"])
    if recency_filter:
        filters.append(recency_filter)

    filter_str = "&" + "&".join(filters) if filters else ""
    loc_label = "Anywhere in India" if loc_key == "anywhere" else location

    def url(kw: str) -> str:
        return f"https://www.linkedin.com/jobs/search/?keywords={kw}&location={li_location}&count=25{filter_str}"

    search_urls = [
        {"label": query, "url": url(encoded_query),
         "description": f"Exact: '{query}' in {loc_label} · {recency_label}"},
        {"label": f"Senior {clean_query}", "url": url("Senior+" + encoded_clean),
         "description": f"Senior-level · {loc_label} · {recency_label}"},
        {"label": f"{clean_query} – Enterprise", "url": url(encoded_clean + "+Enterprise"),
         "description": f"Enterprise context · {loc_label} · {recency_label}"},
        {"label": f"{clean_query} – Remote",
         "url": f"https://www.linkedin.com/jobs/search/?keywords={encoded_clean}&location=India&f_WT=2{filter_str}",
         "description": f"Remote roles across India · {recency_label}"},
        {"label": f"Lead {clean_query}", "url": url("Lead+" + encoded_clean),
         "description": f"Lead/Principal level · {loc_label} · {recency_label}"},
        {"label": f"{clean_query} – AI", "url": url(encoded_clean + "+AI"),
         "description": f"AI-augmented roles · {loc_label} · {recency_label}"},
        {"label": f"{clean_query} – Consulting", "url": url(encoded_clean + "+Consulting"),
         "description": f"Consulting firms · {loc_label} · {recency_label}"},
        {"label": f"{clean_query} – MNC", "url": url(encoded_clean + "+MNC"),
         "description": f"Multinational companies · {loc_label} · {recency_label}"},
        {"label": f"Staff {clean_query}", "url": url("Staff+" + encoded_clean),
         "description": f"Staff-level · {loc_label} · {recency_label}"},
        {"label": f"{clean_query} – Fintech", "url": url(encoded_clean + "+Fintech"),
         "description": f"Fintech sector · {loc_label} · {recency_label}"},
    ]

    return {
        "query": query,
        "location": location,
        "recency": recency,
        "recency_label": recency_label,
        "linkedin_location": li_location,
        "search_urls": search_urls,
        "primary_url": search_urls[0]["url"],
    }


@router.get("/search")
@limiter.limit("30/minute")
async def search_jobs(
    request: Request,
    query: str = Query(...),
    location: str = Query("anywhere"),
    seniority: str = Query("senior"),
    recency: str = Query("week")
):
    # Require a logged-in user: job search is FREE (no credit), but auth protects
    # the shared Adzuna free-tier budget from anonymous abuse.
    await get_current_user(request)

    # Always build the LinkedIn payload — it carries the metadata AND doubles as the
    # fallback if the live provider returns nothing.
    payload = _linkedin_fallback(query, location, seniority, recency)

    # "Search on" deep-links — same lightweight pattern as LinkedIn, for the portals
    # that have no usable listings API (so they open a filtered search in a new tab).
    payload["portal_searches"] = [
        {"name": "LinkedIn", "url": payload["primary_url"]},
        {"name": "Naukri", "url": _naukri_url(query, location, seniority, recency)},
        {"name": "Indeed", "url": _indeed_url(query, location, seniority, recency)},
    ]

    # ① Direct from company career pages (the differentiator) — curated ATS boards.
    try:
        ats_jobs = await ats_source.search(query, location, recency)
    except Exception as e:
        print(f"[jobs] ats error: {e}", flush=True)
        ats_jobs = []

    # ② Aggregator breadth — JSearch (None => not configured / error).
    try:
        agg_jobs = await job_search.search(query, location, seniority, recency)
    except Exception as e:
        print(f"[jobs] aggregator error: {e}", flush=True)
        agg_jobs = None

    payload["ats_jobs"] = ats_jobs or []
    payload["jobs"] = agg_jobs or []
    # Fallback (③ portal deep-links only) when neither live source returned anything.
    payload["fallback"] = not (payload["ats_jobs"] or payload["jobs"])

    return payload


@router.post("/refresh-ats")
async def refresh_ats(request: Request, token: str = Query(...)):
    """Refresh the curated career-page job cache. Protected by ATS_REFRESH_TOKEN so
    only the owner / a scheduled job (e.g. cron-job.org) can trigger it."""
    expected = os.getenv("ATS_REFRESH_TOKEN")
    if not expected or token != expected:
        raise HTTPException(status_code=403, detail="Forbidden")
    count = await ats_source.refresh_cache()
    return {"refreshed": count}
