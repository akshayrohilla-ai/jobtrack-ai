from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from typing import Optional
import anthropic
import os
import json
from services.supabase_client import get_supabase
from middleware.auth import get_current_user, require_credits, get_credit_balance

router = APIRouter()

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
    cv_skills: Optional[list] = []
    cv_title: Optional[str] = ""
    cv_years_exp: Optional[str] = ""
    application_id: Optional[str] = None


@router.get("/balance")
async def get_balance(request: Request):
    """Returns current credit balance for the authenticated user."""
    user_id = await get_current_user(request)
    balance = await get_credit_balance(user_id)
    return {"balance": balance, "user_id": user_id}


@router.post("/evaluate-jd")
async def evaluate_jd(request: Request, payload: EvaluationRequest):
    # 1. Verify JWT — raises 401 if missing/invalid
    user_id = await get_current_user(request)

    if len(payload.jd_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Job description too short")

    # 2. Check + decrement credits — raises 402 if balance is 0
    new_balance = await require_credits(user_id, action="jd_evaluate", cost=1)

    # 3. Build prompt
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    profile_context = ""
    if payload.cv_skills:
        profile_context = f"""
Candidate profile:
- Current title: {payload.cv_title or 'Not provided'}
- Experience: {payload.cv_years_exp or 'Not provided'}
- Skills: {', '.join(payload.cv_skills[:20])}
"""

    user_prompt = f"""Evaluate this job opportunity for the candidate:

JOB DESCRIPTION:
{payload.jd_text[:4000]}

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

        # Log cache hit if present
        usage_meta = getattr(message, 'usage', None)
        if usage_meta:
            cache_read = getattr(usage_meta, 'cache_read_input_tokens', 0)
            if cache_read:
                print(f"Cache hit: {cache_read} tokens reused")

        # 4. Save evaluation to Supabase (now keyed to user_id, not session_id)
        try:
            supabase = get_supabase()
            supabase.table("jd_evaluations").insert({
                "user_id": user_id,
                "jd_text": payload.jd_text[:3000],
                "grade": evaluation.get("grade"),
                "role_summary": evaluation.get("role_summary"),
                "matched_skills": evaluation.get("cv_match", {}).get("matched_skills", []),
                "gaps": [g.get("skill") for g in evaluation.get("gaps", [])],
                "red_flags": evaluation.get("red_flags", []),
                "recommended_action": evaluation.get("recommended_action"),
                "salary_min": evaluation.get("salary_range", {}).get("min"),
                "salary_max": evaluation.get("salary_range", {}).get("max"),
                **({"application_id": payload.application_id} if payload.application_id else {})
            }).execute()
        except Exception as e:
            print(f"Failed to save evaluation to DB: {e}")

        # 5. Return evaluation + remaining balance
        evaluation["_credits"] = {"balance": new_balance}
        return evaluation

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")


@router.get("/history")
async def get_evaluation_history(request: Request):
    """Returns evaluation history for the authenticated user."""
    user_id = await get_current_user(request)
    try:
        supabase = get_supabase()
        result = supabase.table("jd_evaluations") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .limit(20) \
            .execute()
        return result.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
