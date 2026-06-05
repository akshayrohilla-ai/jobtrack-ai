from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from pydantic import BaseModel
from services.cv_parser import extract_text_from_file, parse_cv_with_ai
from services.supabase_client import get_supabase

router = APIRouter()


class CVProfile(BaseModel):
    name: str | None
    title: str | None
    location: str | None
    years_exp: str | None
    seniority: str | None
    domain: str | None
    skills: list[str]
    summary: str | None
    initials: str | None


@router.post("/parse", response_model=CVProfile)
async def parse_cv(
    file: UploadFile = File(...),
    session_id: str = Form(...)
):
    """Upload a CV file and get a structured profile back using AI."""
    allowed = [".pdf", ".docx", ".txt"]
    if not any(file.filename.lower().endswith(ext) for ext in allowed):
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, and TXT files are supported")

    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large — maximum 10MB")

    cv_text = extract_text_from_file(file_bytes, file.filename)

    if not cv_text or len(cv_text.strip()) < 100:
        raise HTTPException(
            status_code=422,
            detail="Could not extract readable text from this file. Try saving as .txt or a non-scanned PDF."
        )

    try:
        profile = parse_cv_with_ai(cv_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI parsing failed: {str(e)}")

    try:
        supabase = get_supabase()
        supabase.table("cv_profiles").insert({
            "user_session": session_id,
            "name": profile.get("name"),
            "title": profile.get("title"),
            "location": profile.get("location"),
            "years_exp": profile.get("years_exp"),
            "seniority": profile.get("seniority"),
            "domain": profile.get("domain"),
            "skills": profile.get("skills", []),
            "raw_text": cv_text[:5000]
        }).execute()
    except Exception:
        pass

    return profile


@router.get("/profile/{session_id}")
async def get_profile(session_id: str):
    """Get the most recently parsed CV profile for a session."""
    supabase = get_supabase()
    result = supabase.table("cv_profiles")\
        .select("*")\
        .eq("user_session", session_id)\
        .order("created_at", desc=True)\
        .limit(1)\
        .execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="No profile found for this session")

    return result.data[0]
