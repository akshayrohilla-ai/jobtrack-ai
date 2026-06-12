from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from slowapi import Limiter
from middleware.ratelimit import user_or_ip
from services.supabase_client import get_supabase
from middleware.auth import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
limiter = Limiter(key_func=user_or_ip)


class ApplicationCreate(BaseModel):
    job_title: str
    company: str
    location: Optional[str] = None
    match_score: Optional[int] = None
    linkedin_url: Optional[str] = None
    notes: Optional[str] = None


class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


VALID_STATUSES = {"applied", "interview", "offer", "rejected"}


@router.get("/")
@limiter.limit("30/minute")
async def get_applications(request: Request):
    """Get all applications for the authenticated user."""
    user_id = await get_current_user(request)
    try:
        supabase = get_supabase()
        result = supabase.table("applications")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .execute()
        return result.data or []
    except Exception as e:
        logger.error("applications endpoint failed", exc_info=True)
        raise HTTPException(status_code=500, detail="Something went wrong")


@router.get("/stats")
@limiter.limit("30/minute")
async def get_stats(request: Request):
    """Get dashboard statistics for the authenticated user."""
    user_id = await get_current_user(request)
    try:
        supabase = get_supabase()
        result = supabase.table("applications")\
            .select("status, match_score")\
            .eq("user_id", user_id)\
            .execute()

        apps = result.data or []
        total = len(apps)
        by_status = {"applied": 0, "interview": 0, "offer": 0, "rejected": 0}
        scores = []

        for a in apps:
            s = a.get("status", "applied")
            if s in by_status:
                by_status[s] += 1
            if a.get("match_score"):
                scores.append(a["match_score"])

        interview_rate = round((by_status["interview"] + by_status["offer"]) / total * 100) if total else 0
        avg_score = round(sum(scores) / len(scores), 1) if scores else None

        return {
            "total": total,
            "by_status": by_status,
            "interview_rate": interview_rate,
            "avg_match_score": avg_score
        }
    except Exception as e:
        logger.error("applications endpoint failed", exc_info=True)
        raise HTTPException(status_code=500, detail="Something went wrong")


@router.post("/")
@limiter.limit("20/minute")
async def create_application(request: Request, app: ApplicationCreate):
    """Add a new job application for the authenticated user."""
    user_id = await get_current_user(request)
    try:
        supabase = get_supabase()
        result = supabase.table("applications").insert({
            "user_id": user_id,
            "job_title": app.job_title,
            "company": app.company,
            "location": app.location,
            "match_score": app.match_score,
            "status": "applied",
            "linkedin_url": app.linkedin_url,
            "notes": app.notes
        }).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to save application")

        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error("applications endpoint failed", exc_info=True)
        raise HTTPException(status_code=500, detail="Something went wrong")


@router.patch("/{application_id}")
@limiter.limit("20/minute")
async def update_application(request: Request, application_id: str, update: ApplicationUpdate):
    """Update application status or notes — only if it belongs to the authenticated user."""
    user_id = await get_current_user(request)

    if update.status and update.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}"
        )
    try:
        supabase = get_supabase()
        payload = {k: v for k, v in update.model_dump().items() if v is not None}

        if not payload:
            raise HTTPException(status_code=400, detail="No fields to update")

        # Scope update to user_id — prevents one user editing another's applications
        result = supabase.table("applications")\
            .update(payload)\
            .eq("id", application_id)\
            .eq("user_id", user_id)\
            .execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Application not found")

        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error("applications endpoint failed", exc_info=True)
        raise HTTPException(status_code=500, detail="Something went wrong")


@router.delete("/{application_id}")
@limiter.limit("20/minute")
async def delete_application(request: Request, application_id: str):
    """Delete an application — only if it belongs to the authenticated user."""
    user_id = await get_current_user(request)
    try:
        supabase = get_supabase()
        # Scope delete to user_id — prevents one user deleting another's applications
        supabase.table("applications")\
            .delete()\
            .eq("id", application_id)\
            .eq("user_id", user_id)\
            .execute()
        return {"deleted": application_id}
    except Exception as e:
        logger.error("applications endpoint failed", exc_info=True)
        raise HTTPException(status_code=500, detail="Something went wrong")
