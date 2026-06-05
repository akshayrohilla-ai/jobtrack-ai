from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from pydantic import BaseModel
from typing import Optional
from services.jd_analyzer import analyze_jd_with_ai, score_cv_against_jd
from services.cv_parser import extract_text_from_file, parse_cv_with_ai
from services.supabase_client import get_supabase

router = APIRouter()


class JDAnalysisRequest(BaseModel):
    jd_text: str
    session_id: str


@router.post("/analyze-jd")
async def analyze_jd(request: JDAnalysisRequest):
    """Analyze a job description and extract structured requirements."""
    if len(request.jd_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Job description too short")

    try:
        analysis = analyze_jd_with_ai(request.jd_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"JD analysis failed: {str(e)}")

    try:
        supabase = get_supabase()
        result = supabase.table("jd_analyses").insert({
            "user_session": request.session_id,
            "jd_text": request.jd_text[:3000],
            "required_skills": analysis.get("required_skills", []),
            "nice_to_have": analysis.get("nice_to_have", []),
            "seniority": analysis.get("seniority"),
            "years_exp": analysis.get("years_exp"),
            "domain": analysis.get("domain"),
            "summary": analysis.get("summary")
        }).execute()
        analysis["id"] = result.data[0]["id"] if result.data else None
    except Exception:
        pass

    return analysis


@router.post("/score-candidate")
async def score_candidate(
    file: UploadFile = File(...),
    session_id: str = Form(...),
    jd_required_skills: str = Form(...),
    jd_nice_to_have: str = Form("[]")
):
    """Upload a candidate CV and score it against provided JD requirements."""
    import json

    file_bytes = await file.read()
    cv_text = extract_text_from_file(file_bytes, file.filename)

    if not cv_text or len(cv_text.strip()) < 50:
        raise HTTPException(status_code=422, detail="Could not extract text from this CV")

    try:
        profile = parse_cv_with_ai(cv_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CV parsing failed: {str(e)}")

    try:
        required = json.loads(jd_required_skills)
        nice = json.loads(jd_nice_to_have)
    except Exception:
        required, nice = [], []

    jd_req = {"required_skills": required, "nice_to_have": nice}
    scoring = score_cv_against_jd(profile.get("skills", []), jd_req)

    return {
        "candidate": profile,
        "score": scoring["score"],
        "label": scoring["label"],
        "matched_required": scoring["matched_required"],
        "matched_nice": scoring["matched_nice"],
        "filename": file.filename
    }


@router.get("/shortlist/{session_id}")
async def get_shortlist(session_id: str):
    """Get shortlisted candidates for a session."""
    supabase = get_supabase()
    result = supabase.table("shortlist")\
        .select("*")\
        .eq("user_session", session_id)\
        .order("match_score", desc=True)\
        .execute()
    return result.data


@router.post("/shortlist")
async def add_to_shortlist(
    session_id: str = Form(...),
    candidate_name: str = Form(...),
    candidate_title: str = Form(""),
    match_score: int = Form(0),
    matched_skills: str = Form("[]"),
    jd_id: Optional[str] = Form(None)
):
    """Add a candidate to the shortlist."""
    import json
    supabase = get_supabase()
    result = supabase.table("shortlist").insert({
        "user_session": session_id,
        "jd_id": jd_id,
        "candidate_name": candidate_name,
        "candidate_title": candidate_title,
        "match_score": match_score,
        "matched_skills": json.loads(matched_skills)
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to save to shortlist")

    return result.data[0]
