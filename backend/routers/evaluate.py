from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import anthropic
import os
import json
from services.supabase_client import get_supabase

router = APIRouter()

# Free tier limits
FREE_EVALUATION_LIMIT = 3
FREE_APPLICATION_LIMIT = 5


class EvaluationRequest(BaseModel):
    jd_text: str
    session_id: str
    cv_skills: Optional[list] = []
    cv_title: Optional[str] = ""
    cv_years_exp: Optional[str] = ""
    application_id: Optional[str] = None


def get_usage(session_id: str) -> dict:
    """Get current usage counts for a session."""
    try:
        supabase = get_supabase()
        result = supabase.table("jd_evaluations")\
            .select("id")\
            .eq("user_session", session_id)\
            .execute()
        eval_count = len(result.data or [])

        app_result = supabase.table("applications")\
            .select("id")\
            .eq("user_session", session_id)\
            .execute()
        app_count = len(app_result.data or [])

        return {
            "evaluations_used": eval_count,
            "evaluations_limit": FREE_EVALUATION_LIMIT,
            "evaluations_remaining": max(0, FREE_EVALUATION_LIMIT - eval_count),
            "applications_used": app_count,
            "applications_limit": FREE_APPLICATION_LIMIT,
            "applications_remaining": max(0, FREE_APPLICATION_LIMIT - app_count),
            "is_free_tier": True
        }
    except Exception:
        return {
            "evaluations_used": 0,
            "evaluations_limit": FREE_EVALUATION_LIMIT,
            "evaluations_remaining": FREE_EVALUATION_LIMIT,
            "applications_used": 0,
            "applications_limit": FREE_APPLICATION_LIMIT,
            "applications_remaining": FREE_APPLICATION_LIMIT,
            "is_free_tier": True
        }


@router.get("/usage/{session_id}")
async def get_session_usage(session_id: str):
    """Get usage stats for a session."""
    return get_usage(session_id)


@router.post("/evaluate-jd")
async def evaluate_jd(request: EvaluationRequest):
    """Full 6-block JD evaluation against candidate profile."""
    if len(request.jd_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Job description too short")

    # Check usage limit
    usage = get_usage(request.session_id)
    if usage["evaluations_remaining"] <= 0:
        raise HTTPException(
            status_code=429,
            detail={
                "message": "Free tier limit reached",
                "evaluations_used": usage["evaluations_used"],
                "evaluations_limit": usage["evaluations_limit"],
                "upgrade_message": "You've used all 3 free evaluations. Upgrade to Pro for unlimited evaluations, CV tailoring, and STAR interview prep."
            }
        )

    # Use Haiku for cost efficiency (~20x cheaper than Opus)
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    profile_context = ""
    if request.cv_skills:
        profile_context = f"""
Candidate profile:
- Current title: {request.cv_title or 'Not provided'}
- Experience: {request.cv_years_exp or 'Not provided'}
- Skills: {', '.join(request.cv_skills[:20])}
"""

    system_prompt = """You are a senior career advisor evaluating job opportunities for candidates.
Analyze the job description and return a structured evaluation.
Return ONLY valid JSON with no markdown, no backticks, no explanation.

Format:
{
  "role_summary": "2-3 sentence plain-language summary of what this job actually is and what success looks like",
  "company_signals": "What the JD reveals about the company culture, team, and role (positive and negative signals)",
  "cv_match": {
    "matched_skills": ["skill1", "skill2"],
    "match_summary": "One sentence on overall fit"
  },
  "gaps": [
    {"skill": "skill name", "importance": "critical|nice-to-have", "mitigation": "how to address this gap"}
  ],
  "grade": "A|B|C|D|F",
  "grade_reasoning": "2-3 sentences explaining the grade based on fit, role quality, and growth potential",
  "salary_range": {
    "min": 0,
    "max": 0,
    "currency": "INR",
    "confidence": "high|medium|low",
    "reasoning": "brief reasoning"
  },
  "red_flags": ["flag1", "flag2"],
  "green_flags": ["flag1", "flag2"],
  "recommended_action": "apply_now|apply_with_tailoring|skip|needs_more_info",
  "recommended_action_reason": "One sentence on what to do and why"
}

Grade criteria:
A = Strong match, great role, apply immediately
B = Good match with minor gaps, worth applying with tailored CV
C = Partial match, significant gaps or concerning signals
D = Poor match or multiple red flags
F = Clear mismatch or avoid"""

    user_prompt = f"""Evaluate this job opportunity:

{request.jd_text[:4000]}

{profile_context}

Provide the full 6-block evaluation as JSON."""

    try:
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1500,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}]
        )

        raw = message.content[0].text.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        evaluation = json.loads(raw)

        # Save to Supabase
        try:
            supabase = get_supabase()
            record = {
                "user_session": request.session_id,
                "jd_text": request.jd_text[:3000],
                "grade": evaluation.get("grade"),
                "role_summary": evaluation.get("role_summary"),
                "matched_skills": evaluation.get("cv_match", {}).get("matched_skills", []),
                "gaps": [g.get("skill") for g in evaluation.get("gaps", [])],
                "red_flags": evaluation.get("red_flags", []),
                "recommended_action": evaluation.get("recommended_action"),
                "salary_min": evaluation.get("salary_range", {}).get("min"),
                "salary_max": evaluation.get("salary_range", {}).get("max"),
            }
            if request.application_id:
                record["application_id"] = request.application_id
            supabase.table("jd_evaluations").insert(record).execute()
        except Exception:
            pass

        # Add usage info to response
        updated_usage = get_usage(request.session_id)
        evaluation["_usage"] = updated_usage

        return evaluation

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")


@router.get("/history/{session_id}")
async def get_evaluation_history(session_id: str):
    """Get past evaluations for a session."""
    try:
        supabase = get_supabase()
        result = supabase.table("jd_evaluations")\
            .select("*")\
            .eq("user_session", session_id)\
            .order("created_at", desc=True)\
            .limit(20)\
            .execute()
        return result.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
