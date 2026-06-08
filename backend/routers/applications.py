from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.supabase_client import get_supabase

router = APIRouter()


class ApplicationCreate(BaseModel):
    session_id: str
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


@router.get("/session/{session_id}")
async def get_applications(session_id: str):
    """Get all applications for a session."""
    try:
        supabase = get_supabase()
        result = supabase.table("applications")\
            .select("*")\
            .eq("user_session", session_id)\
            .order("created_at", desc=True)\
            .execute()
        return result.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/{session_id}")
async def get_stats(session_id: str):
    """Get dashboard statistics for a session."""
    try:
        supabase = get_supabase()
        result = supabase.table("applications")\
            .select("status, match_score")\
            .eq("user_session", session_id)\
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
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
async def create_application(app: ApplicationCreate):
    """Add a new job application to the tracker."""
    try:
        supabase = get_supabase()
        result = supabase.table("applications").insert({
            "user_session": app.session_id,
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
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{application_id}")
async def update_application(application_id: str, update: ApplicationUpdate):
    """Update application status or notes."""
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

        result = supabase.table("applications")\
            .update(payload)\
            .eq("id", application_id)\
            .execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Application not found")

        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{application_id}")
async def delete_application(application_id: str):
    """Remove an application from the tracker."""
    try:
        supabase = get_supabase()
        supabase.table("applications")\
            .delete()\
            .eq("id", application_id)\
            .execute()
        return {"deleted": application_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
