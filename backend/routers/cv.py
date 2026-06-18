from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from slowapi import Limiter
from middleware.ratelimit import user_or_ip
from services.cv_parser import extract_text_from_file, parse_cv_with_ai
from services.supabase_client import get_supabase
from middleware.auth import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
limiter = Limiter(key_func=user_or_ip)


class CVProfile(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    title: Optional[str] = None
    location: Optional[str] = None
    years_exp: Optional[str] = None
    seniority: Optional[str] = None
    domain: Optional[str] = None
    skills: list[str] = []
    summary: Optional[str] = None
    education: list = []          # [{degree, institution, year}] — threaded into Tailor/Interview
    certifications: list[str] = []  # ["name | issuer | year"] — threaded into Tailor/Interview
    initials: Optional[str] = None
    raw_text: Optional[str] = None  # Returned to frontend for CV tailoring


@router.post("/parse", response_model=CVProfile)
@limiter.limit("5/minute")
async def parse_cv(
    request: Request,
    file: UploadFile = File(...),
):
    """
    Upload a CV file and get a structured profile back using AI.
    CV parsing is FREE — no credits consumed.
    raw_text is returned so the frontend can use it for CV tailoring without re-uploading.
    """
    user_id = await get_current_user(request)

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
        logger.error("CV AI parsing failed", exc_info=True)
        raise HTTPException(status_code=500, detail="Could not parse this CV. Please try again.")

    # Save to Supabase scoped to user_id (best-effort, non-blocking).
    # raw_text cap raised 12k -> 20k so the CV tail (education/certs) survives.
    base_row = {
        "user_id": user_id,
        "name": profile.get("name"),
        "email": profile.get("email"),
        "phone": profile.get("phone"),
        "linkedin": profile.get("linkedin"),
        "title": profile.get("title"),
        "location": profile.get("location"),
        "years_exp": profile.get("years_exp"),
        "seniority": profile.get("seniority"),
        "domain": profile.get("domain"),
        "skills": profile.get("skills", []),
        "raw_text": cv_text[:20000]
    }
    try:
        supabase = get_supabase()
        # Insert with the new columns; if the migration hasn't run yet the
        # columns won't exist, so fall back to the base row. This keeps profile
        # persistence working regardless of deploy/migration ordering.
        try:
            supabase.table("cv_profiles").insert({
                **base_row,
                "education": profile.get("education", []),
                "certifications": profile.get("certifications", []),
            }).execute()
        except Exception:
            supabase.table("cv_profiles").insert(base_row).execute()
    except Exception as e:
        print(f"CV profile save FAILED: {type(e).__name__}: {e}")

    # Return profile + raw_text so frontend can store in sessionStorage.
    # education/certifications travel in `profile` and are threaded into
    # Tailor/Interview so the degree is never lost to raw-text truncation.
    return {**profile, "raw_text": cv_text[:20000]}


@router.get("/profile")
@limiter.limit("30/minute")
async def get_profile(request: Request):
    """Get the most recently parsed CV profile for the authenticated user."""
    user_id = await get_current_user(request)
    supabase = get_supabase()
    result = supabase.table("cv_profiles")\
        .select("*")\
        .eq("user_id", user_id)\
        .order("created_at", desc=True)\
        .limit(1)\
        .execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="No profile found")

    return result.data[0]
