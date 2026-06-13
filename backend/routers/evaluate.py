from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import anthropic
import os
import json
import time
import uuid
from slowapi import Limiter
from middleware.ratelimit import user_or_ip
from services.supabase_client import get_supabase
from middleware.auth import get_current_user, require_credits, refund_credits, get_credit_balance

limiter = Limiter(key_func=user_or_ip)

router = APIRouter()

# ---------------------------------------------------------------------
# SYSTEM PROMPT — intentionally kept above 1,024 tokens so Anthropic's
# prompt caching activates. Cache write costs 1.25x on first call, then
# subsequent calls pay only 0.1x (90% discount) on these tokens.
# Do NOT shorten this prompt below ~1,024 tokens or caching will silently stop.
# ---------------------------------------------------------------------
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

GRADING RULES — apply these strictly and consistently:

A grade (apply immediately):
- Candidate holds 80%+ of required skills with direct experience, not just exposure
- Domain matches or is a natural adjacent step (e.g. IT consulting to product, finance to fintech)
- Role is at the right seniority level — neither a step down nor a stretch beyond reach
- No critical red flags in the JD
- Example: Senior BA with 8 years BFSI experience applying for a Senior BA role at a fintech — A

B grade (apply with tailored CV):
- Candidate matches 60-79% of required skills, with 1-2 fillable gaps
- Minor domain shift that transferable skills can bridge within 3-6 months
- Role may be a slight stretch upward but candidate has clear trajectory
- Example: Senior BA applying for a Product Manager role — skills transfer but framing needed — B

C grade (partial match, proceed cautiously):
- Candidate matches 40-59% of required skills
- Meaningful domain change required — core domain knowledge is missing
- Significant reskilling required for 2+ critical gaps
- Role is either too senior or candidate is overqualified
- Example: Finance analyst applying for a data engineering role — C

D grade (poor match, apply only if desperate):
- Candidate matches fewer than 40% of required skills
- Wrong domain with no clear bridge
- Multiple critical gaps requiring months of dedicated learning
- Multiple red flags in the JD
- Example: Marketing manager applying for a cloud architect role — D

F grade (do not apply):
- Fundamentally different industry, function, or career level
- Candidate would be screened out by ATS before a human sees the application
- Role is clearly a scam, spam, or has severe red flags
- Example: Accountant applying for a neurosurgeon role — F

SALARY ESTIMATION RULES:
- Use Indian market rates unless the JD explicitly states another country
- Tier 1 cities (Mumbai, Bangalore, Delhi, Hyderabad, Pune): 20-40% premium over Tier 2
- If the JD mentions a specific range, use it as the anchor and note confidence as high
- If no salary info exists, estimate from role + seniority + domain + city with confidence low or medium

RED FLAG DETECTION — always flag these if present:
- No company name or vague company description
- Salary range suspiciously wide (e.g. 3L to 30L for the same role)
- Requires unpaid trial periods or training fees
- More than 8 required skills for a single individual contributor role
- Contradictory seniority signals (entry level pay for senior responsibilities)
- Urgent hiring language with no interview process described

RECOMMENDED ACTION RULES:
- apply_now: Grade A only, no critical gaps, candidate should send CV within 48 hours
- apply_with_tailoring: Grade A or B where CV framing needs adjustment to highlight relevant experience
- skip: Grade D or F, or Grade C where the domain gap is too large to overcome with tailoring
- needs_more_info: JD is too vague to evaluate accurately, missing seniority, location, or core responsibilities

COMPANY SIGNAL ANALYSIS:
- Positive signals: clear growth path, named team size, specific tech stack, realistic requirements
- Negative signals: excessive buzzwords with no substance, requires 5+ years for entry pay, no mention of team structure
- Startup signals high risk high reward, large MNC signals process-heavy environment, consulting firms signal billable hour pressure

DOMAIN STRICTNESS:
- A finance professional applying for a customer analytics role is AT MOST a C
- A developer applying for a pure sales role is AT MOST a D
- Never inflate grades to be encouraging — a wrong-domain application wastes the candidate's time
- Transferable skills exist everywhere but do not override domain knowledge gaps"""


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
@limiter.limit("10/minute")
async def evaluate_jd(request: Request, payload: EvaluationRequest):
    # --- timing instrumentation (diagnostic) ---
    rid = uuid.uuid4().hex[:8]
    t_start = time.perf_counter()

    # 1. Verify JWT — raises 401 if missing/invalid
    user_id = await get_current_user(request)

    if len(payload.jd_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Job description too short")

    # 2. Check + decrement credits — raises 402 if balance is 0
    new_balance = await require_credits(user_id, action="jd_evaluate", cost=1)

    # 3. Build prompt
    # Switched from Opus to Sonnet 4.6 — 40% cheaper, no quality loss for structured JSON.
    # Async client so the SSE stream below doesn't block the event loop.
    client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

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

    t_pre_llm = time.perf_counter()

    async def event_stream():
        """Stream the evaluation over SSE. Only the TRANSPORT changes (buffered -> streamed);
        model, prompt, max_tokens, temperature and the final JSON are identical to before.
        Emits `delta` progress events while generating, a `done` event carrying the complete
        evaluation JSON, or an `error` event (credit refunded) on failure."""
        full_text = ""
        t_first = None
        try:
            async with client.messages.stream(
                model="claude-sonnet-4-6",
                max_tokens=1500,
                temperature=0,  # Deterministic grading — prevents A/B flip on same CV+JD
                system=[
                    {
                        "type": "text",
                        "text": EVALUATION_SYSTEM_PROMPT,
                        "cache_control": {"type": "ephemeral"}
                    }
                ],
                messages=[{"role": "user", "content": user_prompt}]
            ) as stream:
                async for text in stream.text_stream:
                    if t_first is None:
                        t_first = time.perf_counter()
                    full_text += text
                    # Send the incremental text so the client can progressively
                    # parse + render sections as they complete.
                    yield f"event: delta\ndata: {json.dumps({'t': text})}\n\n"

            t_llm = time.perf_counter()
            raw = full_text.strip().replace("```json", "").replace("```", "").strip()
            evaluation = json.loads(raw)
            t_parse = time.perf_counter()

            # Save evaluation to Supabase (unchanged)
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

            t_db = time.perf_counter()
            ttft = (t_first - t_pre_llm) if t_first else 0.0
            print(f"[{rid}] evaluate-jd(stream) | pre-LLM={t_pre_llm-t_start:.2f}s "
                  f"TTFT={ttft:.2f}s LLM={t_llm-t_pre_llm:.2f}s parse={t_parse-t_llm:.2f}s "
                  f"db={t_db-t_parse:.2f}s | total={t_db-t_start:.2f}s | chars={len(full_text)} | streaming=True",
                  flush=True)

            evaluation["_credits"] = {"balance": new_balance}
            yield f"event: done\ndata: {json.dumps(evaluation)}\n\n"

        except json.JSONDecodeError:
            # AI failed to deliver usable output — refund the credit (Refund Policy §3).
            await refund_credits(user_id, cost=1)
            yield f"event: error\ndata: {json.dumps({'detail': 'AI returned an unexpected response. Please try again.'})}\n\n"
        except Exception:
            await refund_credits(user_id, cost=1)
            yield f"event: error\ndata: {json.dumps({'detail': 'Evaluation failed. Please try again.'})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


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
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to load evaluation history.")
