from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
import anthropic
import os
import json
import re
from slowapi import Limiter
from slowapi.util import get_remote_address
from middleware.auth import get_current_user, require_credits, refund_credits

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()

INTERVIEW_SYSTEM_PROMPT = """You are a senior career coach preparing candidates for job interviews.
Given a candidate's CV and a job description, produce a personalised interview preparation pack.
Return ONLY valid JSON with no markdown, no backticks, no explanation.

Format:
{
  "behavioral_questions": [
    {
      "question": "Tell me about a time you led a cross-functional project under pressure.",
      "why_asked": "One sentence on what the interviewer is probing for",
      "star_answer": {
        "situation": "Specific context from the candidate's CV — real company, role, or project",
        "task": "What the candidate was responsible for in that situation",
        "action": "Concrete steps the candidate took — use first-person, specific verbs",
        "result": "Measurable outcome or clear impact. Use numbers if possible."
      },
      "key_phrases": ["phrase1", "phrase2"]
    }
  ],
  "red_flags": [
    {
      "topic": "Short tenure at Company X (8 months)",
      "likely_question": "I see you only stayed at Company X for 8 months — can you walk me through that?",
      "how_to_frame": "Honest, forward-looking framing that neutralises the concern without over-explaining"
    }
  ],
  "questions_to_ask": [
    {
      "question": "What does success look like for this role in the first 90 days?",
      "why_it_works": "Shows you're outcome-focused and thinking beyond just getting the job"
    }
  ]
}

RULES:
- Generate exactly 6 behavioral questions tailored to the specific JD requirements
- STAR answers must pull from actual content in the candidate's CV — no invented experiences
- If a CV detail is vague, make the STAR answer directional but note candidate should add specifics
- Red flags: identify 2-3 genuine weak spots a sharp interviewer WILL probe. Be honest, not encouraging
- Questions to ask: exactly 5, all role-specific — no generic questions like "what's the culture like"
- key_phrases: 2-3 exact words/phrases from the JD the candidate should naturally mirror in that answer
- Keep all text concise — interviewers read quickly, candidates need to memorise this"""


class InterviewPrepRequest(BaseModel):
    raw_cv: str
    jd_text: str
    role: Optional[str] = ""
    company: Optional[str] = ""


@router.post("/prep")
@limiter.limit("10/minute")
async def interview_prep(request: Request, payload: InterviewPrepRequest):
    user_id = await get_current_user(request)

    if len(payload.raw_cv.strip()) < 100:
        raise HTTPException(status_code=400, detail="CV text too short")
    if len(payload.jd_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Job description too short")

    new_balance = await require_credits(user_id, action="interview_prep", cost=1)

    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    role_context = f" for the {payload.role} role" if payload.role else ""
    company_context = f" at {payload.company}" if payload.company else ""

    user_prompt = f"""Prepare a personalised interview pack{role_context}{company_context}.

CANDIDATE CV:
{payload.raw_cv[:3000]}

JOB DESCRIPTION:
{payload.jd_text[:2000]}

Return the full interview prep pack as JSON."""

    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2500,
            temperature=0,
            system=[
                {
                    "type": "text",
                    "text": INTERVIEW_SYSTEM_PROMPT,
                    "cache_control": {"type": "ephemeral"}
                }
            ],
            messages=[{"role": "user", "content": user_prompt}]
        )

        raw = message.content[0].text.strip()
        # Strip markdown code fences
        raw = re.sub(r"```json\s*", "", raw)
        raw = re.sub(r"```\s*", "", raw)
        raw = raw.strip()
        # If model added preamble, extract the JSON object
        if not raw.startswith("{"):
            match = re.search(r"\{.*\}", raw, re.DOTALL)
            if match:
                raw = match.group()

        result = json.loads(raw)
        result["_credits"] = {"balance": new_balance}
        return result

    except (json.JSONDecodeError, Exception) as e:
        # Refund the credit — the AI failed, not the user
        await refund_credits(user_id, cost=1)
        print(f"Interview prep error (refunded): {e}")
        raise HTTPException(status_code=500, detail="Interview prep failed — your credit has been refunded. Please try again.")
