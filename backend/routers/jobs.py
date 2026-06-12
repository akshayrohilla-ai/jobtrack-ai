from fastapi import APIRouter, Query, Request
from slowapi import Limiter
from middleware.ratelimit import user_or_ip

router = APIRouter()
limiter = Limiter(key_func=user_or_ip)

LOCATION_MAP = {
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


@router.get("/search")
@limiter.limit("30/minute")
async def search_jobs(
    request: Request,
    query: str = Query(...),
    location: str = Query("pune"),
    seniority: str = Query("senior"),
    recency: str = Query("week")
):
    loc_key = location.lower().strip()
    li_location = LOCATION_MAP.get(loc_key, location.replace(" ", "+"))

    # Strip leading "Senior " or "Lead " from query to avoid doubling
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

    def url(kw: str) -> str:
        return f"https://www.linkedin.com/jobs/search/?keywords={kw}&location={li_location}&count=25{filter_str}"

    search_urls = [
        {
            "label": query,
            "url": url(encoded_query),
            "description": f"Exact: '{query}' in {location} · {recency_label}"
        },
        {
            "label": f"Senior {clean_query}",
            "url": url("Senior+" + encoded_clean),
            "description": f"Senior-level · {location} · {recency_label}"
        },
        {
            "label": f"{clean_query} – Enterprise",
            "url": url(encoded_clean + "+Enterprise"),
            "description": f"Enterprise context · {location} · {recency_label}"
        },
        {
            "label": f"{clean_query} – Remote",
            "url": f"https://www.linkedin.com/jobs/search/?keywords={encoded_clean}&location=India&f_WT=2{filter_str}",
            "description": f"Remote roles across India · {recency_label}"
        },
        {
            "label": f"Lead {clean_query}",
            "url": url("Lead+" + encoded_clean),
            "description": f"Lead/Principal level · {location} · {recency_label}"
        },
        {
            "label": f"{clean_query} – AI",
            "url": url(encoded_clean + "+AI"),
            "description": f"AI-augmented roles · {location} · {recency_label}"
        },
        {
            "label": f"{clean_query} – Consulting",
            "url": url(encoded_clean + "+Consulting"),
            "description": f"Consulting firms · {location} · {recency_label}"
        },
        {
            "label": f"{clean_query} – MNC",
            "url": url(encoded_clean + "+MNC"),
            "description": f"Multinational companies · {location} · {recency_label}"
        },
        {
            "label": f"Staff {clean_query}",
            "url": url("Staff+" + encoded_clean),
            "description": f"Staff-level · {location} · {recency_label}"
        },
        {
            "label": f"{clean_query} – Fintech",
            "url": url(encoded_clean + "+Fintech"),
            "description": f"Fintech sector · {location} · {recency_label}"
        },
    ]

    return {
        "query": query,
        "location": location,
        "recency": recency,
        "recency_label": recency_label,
        "linkedin_location": li_location,
        "search_urls": search_urls,
        "primary_url": search_urls[0]["url"]
    }
