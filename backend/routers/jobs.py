from fastapi import APIRouter, Query
from pydantic import BaseModel

router = APIRouter()

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

SENIORITY_FILTER = "f_E=4"   # Senior level on LinkedIn
RECENCY_FILTER = "f_TPR=r604800"  # Last 7 days


class JobSearchResult(BaseModel):
    title: str
    search_url: str
    location: str
    seniority_label: str
    filters_applied: list[str]


@router.get("/search")
async def search_jobs(
    query: str = Query(..., description="Job title or keywords"),
    location: str = Query("pune", description="City name"),
    seniority: str = Query("senior", description="senior | mid | any"),
    recency: str = Query("week", description="week | month | any")
):
    """
    Build LinkedIn job search URLs for the given query and location.
    Returns multiple search URL variants for best coverage.
    """
    loc_key = location.lower().strip()
    li_location = LOCATION_MAP.get(loc_key, location.replace(" ", "+"))

    filters = []
    if seniority == "senior":
        filters.append(SENIORITY_FILTER)
    elif seniority == "mid":
        filters.append("f_E=3")

    if recency == "week":
        filters.append(RECENCY_FILTER)
    elif recency == "month":
        filters.append("f_TPR=r2592000")

    def build_url(keywords: str) -> str:
        base = f"https://www.linkedin.com/jobs/search/?keywords={keywords}&location={li_location}&count=25"
        if filters:
            base += "&" + "&".join(filters)
        return base

    encoded_query = query.replace(" ", "+")
    title_words = query.split()

    search_variants = [
        {
            "label": f"Exact: {query}",
            "url": build_url(encoded_query),
            "description": f"Exact title match for '{query}' in {location}"
        },
        {
            "label": f"Domain qualified: {query} Enterprise",
            "url": build_url(encoded_query + "+Enterprise"),
            "description": "Filtered to enterprise context"
        },
        {
            "label": "Senior Business Analyst India",
            "url": build_url("Senior+Business+Analyst"),
            "description": "Broader BA search for coverage"
        },
    ]

    if "business" in query.lower() or "analyst" in query.lower():
        search_variants.append({
            "label": "Technical Business Analyst",
            "url": build_url("Technical+Business+Analyst"),
            "description": "Technical BA variant"
        })

    if "ai" in query.lower() or "data" in query.lower():
        search_variants.append({
            "label": f"AI {title_words[-1] if title_words else 'Analyst'}",
            "url": build_url("AI+" + encoded_query),
            "description": "AI-focused variant"
        })

    return {
        "query": query,
        "location": location,
        "linkedin_location": li_location,
        "filters": {
            "seniority": seniority,
            "recency": recency,
            "raw": filters
        },
        "search_urls": search_variants,
        "primary_url": search_variants[0]["url"]
    }
