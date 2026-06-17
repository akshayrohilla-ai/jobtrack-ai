from fastapi import APIRouter, HTTPException, Request
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
from middleware.auth import get_current_user, require_credits, refund_credits

limiter = Limiter(key_func=user_or_ip)

router = APIRouter()

# ---------------------------------------------------------------------
# CV TAILORING SYSTEM PROMPT — prompt caching note (verified 2026-06):
# Sonnet 4.6's minimum cacheable prefix is 2,048 tokens. This prompt is
# ~1,200-1,460 tokens, so the cache_control marker below is currently a
# NO-OP (cache_creation_input_tokens stays 0). The old "1,024" target was
# for Sonnet 4.5; the 4.6 switch silently disabled caching here. To enable
# cross-user caching, this prompt must exceed 2,048 tokens of genuine
# instructions (don't pad with filler). The cache_write/cache_read log in
# event_stream() below reports the real numbers.
# ---------------------------------------------------------------------
TAILORING_SYSTEM_PROMPT = """You are an expert CV writer and career coach who specialises in tailoring CVs for specific job applications.
Your task is to rewrite a candidate's CV to maximise their chances of passing ATS screening and impressing hiring managers for a specific role.
Return ONLY valid JSON with no markdown, no backticks, no explanation.

Output format:
{
  "professional_summary": "3-4 sentence rewritten summary that directly addresses the JD requirements, uses keywords from the JD, and positions the candidate as the ideal fit for this specific role",
  "skills": ["skill1", "skill2", ...],
  "experience": [
    {
      "company": "Company name from CV",
      "title": "Job title from CV",
      "duration": "Duration from CV",
      "bullets": [
        "Rewritten bullet 1 — quantified, uses JD language, highlights relevant impact",
        "Rewritten bullet 2",
        "Rewritten bullet 3"
      ]
    }
  ],
  "technical_projects": [
    {
      "title": "Project title from CV",
      "tech_stack": "Technologies used",
      "bullets": ["Rewritten bullet highlighting relevance to this role"]
    }
  ],
  "certifications": ["Certification name | Issuer | Date"],
  "education": [
    {
      "degree": "Degree name",
      "institution": "Institution name",
      "location": "City, Country"
    }
  ],
  "application_briefing": {
    "lead_with": "What experience or achievement to open with in applications and interviews",
    "mirror_language": ["exact phrase from JD to use", "another JD phrase", "third phrase"],
    "downplay": "What to de-emphasise or not lead with for this specific role",
    "add_if_possible": "One thing to add or clarify in the CV if the candidate has it"
  }
}

TAILORING RULES:

Professional summary:
- Open with the candidate's most relevant title and years of experience
- Include 2-3 specific skills that directly match the JD requirements
- Reference the type of company or environment (MNC, startup, BFSI, etc.) if it matches
- End with a value statement tied to what the role needs
- Never use generic phrases like "results-driven professional" or "team player"
- Mirror exact terminology from the JD — if JD says "requirements elicitation" use that, not "requirements gathering"

Skills section:
- Lead with skills explicitly mentioned in the JD as required
- Remove or deprioritise skills not relevant to this role
- Add skills the candidate clearly has (inferred from experience) but may not have listed
- Keep to 20-25 skills maximum
- Use exact terminology from the JD where the candidate's skill is equivalent

Experience bullets:
- Rewrite the 3 most relevant bullets per role to use JD language and quantify impact
- Start each bullet with a strong action verb
- Include metrics where possible — percentages, time saved, team size, project scale
- If the original CV has no metrics, infer reasonable ones from context or flag with [add metric]
- Focus on outcomes not activities — "Delivered X that resulted in Y" not "Responsible for X"
- Prioritise the 2 most recent and relevant roles; include a third only if it adds distinct value

Application briefing (shown on screen, not in CV):
- lead_with: the single strongest selling point for THIS specific role
- mirror_language: 3 exact phrases from the JD the candidate should use in applications and interviews
- downplay: experience that is real but not relevant to this role — don't hide it, just don't lead with it
- add_if_possible: one specific gap or ambiguity that, if addressed, would strengthen the application

ATS optimisation:
- Use exact skill names from the JD — "Power BI" not "PowerBI", "Agile" not "agile methodology"
- Include the job title from the JD in the professional summary if it matches the candidate's level
- Repeat 3-5 key JD terms naturally across the summary and bullets

CRITICAL COMPLETENESS RULES — never violate these:
- NEVER remove or omit any role from the candidate's experience — include ALL roles even if less relevant
- For older or less relevant roles, include them with 2-3 bullets focused on transferable elements
- NEVER remove technical projects, certifications, or education — always include all of them
- If a project is not directly relevant to the JD, keep it but reframe the bullets toward transferable skills
- The output must be a COMPLETE CV the candidate can submit — not a partial rewrite
- Only summary wording, skills order, and bullet language should change — all sections must be present

QUALITY STANDARDS:
- Every bullet must be specific and credible — never fabricate achievements
- If the candidate clearly lacks something, note it in application_briefing.add_if_possible — do not invent it
- The tailored CV should feel like it was written by this specific person, not a generic template
- Preserve the candidate's authentic voice while elevating the language"""


class TailorRequest(BaseModel):
    jd_text: str
    cv_raw_text: str
    cv_profile: dict  # The parsed profile object — name, title, skills, summary, years_exp, seniority, domain


@router.post("/tailor-cv")
@limiter.limit("10/minute")
async def tailor_cv(request: Request, payload: TailorRequest):
    # --- timing instrumentation (diagnostic) ---
    rid = uuid.uuid4().hex[:8]
    t_start = time.perf_counter()

    # 1. Verify JWT
    user_id = await get_current_user(request)

    if len(payload.jd_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Job description too short")

    if len(payload.cv_raw_text.strip()) < 100:
        raise HTTPException(status_code=400, detail="CV text too short")

    # 2. Check + decrement 1 credit — raises 402 (returned before the stream starts)
    new_balance = await require_credits(user_id, action="cv_tailor", cost=1)

    # Async client so the SSE stream below doesn't block the event loop.
    client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    profile = payload.cv_profile
    user_prompt = f"""Tailor this candidate's CV for the specific job description below.

CANDIDATE PROFILE:
Name: {profile.get('name', 'Not provided')}
Current title: {profile.get('title', 'Not provided')}
Experience: {profile.get('years_exp', 'Not provided')}
Seniority: {profile.get('seniority', 'Not provided')}
Domain: {profile.get('domain', 'Not provided')}
Current skills: {', '.join(profile.get('skills', [])[:25])}

FULL CV TEXT:
{payload.cv_raw_text[:12000]}

JOB DESCRIPTION:
{payload.jd_text[:8000]}

Rewrite the CV to maximise fit for this specific role. Return JSON only."""

    t_pre_llm = time.perf_counter()

    async def event_stream():
        """Stream the tailored CV over SSE. Only the TRANSPORT changes (buffered -> streamed);
        model, prompt, max_tokens and the final JSON are identical to before. Emits `delta`
        progress events while generating, a `done` event carrying the complete tailored-CV JSON,
        or an `error` event (credit refunded) on failure."""
        full_text = ""
        t_first = None
        try:
            async with client.messages.stream(
                model="claude-sonnet-4-6",
                max_tokens=3000,
                system=[
                    {
                        "type": "text",
                        "text": TAILORING_SYSTEM_PROMPT,
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
            tailored = json.loads(raw)
            t_parse = time.perf_counter()

            # Log cache usage (final message carries token accounting)
            usage_meta = None
            try:
                final_message = await stream.get_final_message()
                usage_meta = getattr(final_message, 'usage', None)
                if usage_meta:
                    cache_read  = getattr(usage_meta, 'cache_read_input_tokens', 0)
                    cache_write = getattr(usage_meta, 'cache_creation_input_tokens', 0)
                    print(f"Tailor — cache_write: {cache_write}, cache_read: {cache_read}")
            except Exception:
                pass

            # Log to usage (credit already decremented in require_credits)
            try:
                supabase = get_supabase()
                supabase.table("cv_tailoring_log").insert({
                    "user_id": user_id,
                    "jd_snippet": payload.jd_text[:200],
                    "grade_before": None,
                }).execute()
            except Exception:
                pass

            t_db = time.perf_counter()
            ttft = (t_first - t_pre_llm) if t_first else 0.0
            out_tok = getattr(usage_meta, 'output_tokens', 0) if usage_meta else 0
            print(f"[{rid}] tailor-cv(stream) | pre-LLM={t_pre_llm-t_start:.2f}s "
                  f"TTFT={ttft:.2f}s LLM={t_llm-t_pre_llm:.2f}s parse={t_parse-t_llm:.2f}s "
                  f"db={t_db-t_parse:.2f}s | total={t_db-t_start:.2f}s | out_tokens={out_tok} | streaming=True",
                  flush=True)

            tailored["_credits"] = {"balance": new_balance}
            yield f"event: done\ndata: {json.dumps(tailored)}\n\n"

        except json.JSONDecodeError:
            # AI failed to deliver usable output — refund the credit (Refund Policy §3).
            await refund_credits(user_id, cost=1)
            yield f"event: error\ndata: {json.dumps({'detail': 'AI returned an unexpected response. Please try again.'})}\n\n"
        except Exception:
            await refund_credits(user_id, cost=1)
            yield f"event: error\ndata: {json.dumps({'detail': 'CV tailoring failed. Please try again.'})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
