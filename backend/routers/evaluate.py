from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import anthropic
import os
import json
from services.supabase_client import get_supabase

router = APIRouter()

FREE_EVALUATION_LIMIT = 3
FREE_APPLICATION_LIMIT = 5

# Cached system prompt — reused across all evaluation calls (saves ~30% tokens)
EVALUATION_SYSTEM_PROMPT = """You are a senior career advisor evaluating job opportunities for candidates.
Analyze the job description and candidate profile, then return a structured evaluation.
Return ONLY valid JSON with no markdown, no backticks, no explanation.

Format:
{
  "role_summary": "2-3 sentence plain-language summary of what this job actually is and what success looks like",
  "company_signals": "What the JD reveals about company culture, team, and role (positive and negative signals)",
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
    "reasoning": "brief reasoning for the range"
  },
  "red_flags": ["flag1", "flag2"],
  "green_flags": ["flag1", "flag2"],
  "recommended_action": "apply_now|apply_with_tailoring|skip|needs_more_info",
  "recommended_action_reason": "One sentence on what to do and why"
}

Grade criteria:
A = Strong match on both skills AND domain, great role quality, apply immediately
B = Good skill match but minor gaps or domain shift, worth applying with tailored CV
C = Partial match, significant skill gaps OR meaningful domain change required
D = Poor match — major skill gaps, wrong domain, or multiple red flags
F = Clear mismatch — different industry, wrong level, or avoid entirely

IMPORTANT: Be strict about domain fit. A finance professional applying for a customer analytics role is AT MOST a C — transferable skills exist but the core domain knowledge gap is significant. Do not grade D or F candidates as B."""


class EvaluationRequest(BaseModel):
    jd_text: str
    session_id: str
    cv_skills: Optional[list] = []
    cv_title: Optional[str] = ""
    cv_years_exp: Optional[str] = ""
    application_id: Optional[str] = None


def get_usage(session_id: str) -> dict:
    try:
        supabase = get_supabase()
        eval_count = len(supabase.table("jd_evaluations").select("id").eq("user_session", session_id).execute().data or [])
        app_count  = len(supabase.table("applications").select("id").eq("user_session", session_id).execute().data or [])
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
            "evaluations_used": 0, "evaluations_limit": FREE_EVALUATION_LIMIT,
            "evaluations_remaining": FREE_EVALUATION_LIMIT,
            "applications_used": 0, "applications_limit": FREE_APPLICATION_LIMIT,
            "applications_remaining": FREE_APPLICATION_LIMIT, "is_free_tier": True
        }


@router.get("/usage/{session_id}")
async def get_session_usage(session_id: str):
    return get_usage(session_id)


@router.post("/evaluate-jd")
async def evaluate_jd(request: EvaluationRequest):
    if len(request.jd_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Job description too short")

    usage = get_usage(request.session_id)
    if usage["evaluations_remaining"] <= 0:
        raise HTTPException(status_code=429, detail={
            "message": "Free tier limit reached",
            "evaluations_used": usage["evaluations_used"],
            "evaluations_limit": usage["evaluations_limit"],
            "upgrade_message": "You've used all 3 free evaluations. Upgrade to Pro for unlimited evaluations, CV tailoring, and STAR interview prep."
        })

    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    profile_context = ""
    if request.cv_skills:
        profile_context = f"""
Candidate profile:
- Current title: {request.cv_title or 'Not provided'}
- Experience: {request.cv_years_exp or 'Not provided'}
- Skills: {', '.join(request.cv_skills[:20])}
"""

    user_prompt = f"""Evaluate this job opportunity for the candidate:

JOB DESCRIPTION:
{request.jd_text[:4000]}

{profile_context}

Return the full evaluation as JSON."""

    try:
        message = client.messages.create(
            model="claude-opus-4-5",
            max_tokens=1500,
            system=[
                {
                    "type": "text",
                    "text": EVALUATION_SYSTEM_PROMPT,
                    "cache_control": {"type": "ephemeral"}
                }
            ],
            messages=[{"role": "user", "content": user_prompt}]
        )

        raw = message.content[0].text.strip().replace("```json", "").replace("```", "").strip()
        evaluation = json.loads(raw)

        # Log cache usage if available
        usage_meta = getattr(message, 'usage', None)
        if usage_meta:
            cache_read = getattr(usage_meta, 'cache_read_input_tokens', 0)
            if cache_read:
                print(f"Cache hit: {cache_read} tokens reused")

        # Save to Supabase
        try:
            supabase = get_supabase()
            supabase.table("jd_evaluations").insert({
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
                **({"application_id": request.application_id} if request.application_id else {})
            }).execute()
        except Exception:
            pass

        evaluation["_usage"] = get_usage(request.session_id)
        return evaluation

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")


@router.get("/history/{session_id}")
async def get_evaluation_history(session_id: str):
    try:
        supabase = get_supabase()
        result = supabase.table("jd_evaluations").select("*").eq("user_session", session_id).order("created_at", desc=True).limit(20).execute()
        return result.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
