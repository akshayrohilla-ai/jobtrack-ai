from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import anthropic
import os
import json
import re
import time
import uuid
from slowapi import Limiter
from middleware.ratelimit import user_or_ip
from middleware.auth import get_current_user, require_credits, refund_credits

limiter = Limiter(key_func=user_or_ip)
router = APIRouter()

# ---------------------------------------------------------------------
# INTERVIEW SYSTEM PROMPT — prompt caching note (verified 2026-06):
# Sonnet 4.6's minimum cacheable prefix is 2,048 tokens. This prompt is
# only ~450-500 tokens, so the cache_control marker below is a NO-OP —
# caching never engages here. Enabling it would mean ~4x-ing this prompt,
# which isn't worth it for ~$0.004/call. Left as-is intentionally; the
# cache log in event_stream() confirms cache_write/cache_read stay 0.
# ---------------------------------------------------------------------
INTERVIEW_SYSTEM_PROMPT = """You are a senior career coach preparing candidates for job interviews.
Given a candidate's CV and a job description, produce a personalised interview preparation pack.
Return ONLY valid JSON with no markdown, no backticks, no explanation.

Format:
{
  "behavioral_questions": [
    {
      "question": "Tell me about a time you led a cross-functional project under pressure.",
      "why_asked": "What the interviewer is probing for (1 sentence)",
      "star_answer": {
        "situation": "2 sentences max — real company/role from CV",
        "task": "1 sentence — what they were responsible for",
        "action": "2-3 sentences — specific steps taken, first-person verbs",
        "result": "1 sentence — measurable outcome or impact"
      },
      "key_phrases": ["phrase1", "phrase2"]
    }
  ],
  "red_flags": [
    {
      "topic": "Short tenure at Company X",
      "likely_question": "The interviewer's likely phrasing (1 sentence)",
      "how_to_frame": "2-3 sentences — honest, forward-looking framing"
    }
  ],
  "questions_to_ask": [
    {
      "question": "A specific, role-relevant question to ask the interviewer",
      "why_it_works": "1 sentence"
    }
  ]
}

RULES:
- Generate exactly 5 behavioral questions tailored to the JD (not generic)
- STAR answers must use real content from the candidate's CV — no invented experiences
- Keep every field SHORT — 1-3 sentences max. Candidates read this fast before interviews
- Red flags: 2 genuine weak spots a sharp interviewer will probe. Be honest
- Questions to ask: exactly 4, all role-specific
- key_phrases: 2 exact words/phrases from the JD to mirror in that answer"""


class InterviewPrepRequest(BaseModel):
    raw_cv: str
    jd_text: str
    role: Optional[str] = ""
    company: Optional[str] = ""


@router.post("/prep")
@limiter.limit("10/minute")
async def interview_prep(request: Request, payload: InterviewPrepRequest):
    # --- timing instrumentation (diagnostic) ---
    rid = uuid.uuid4().hex[:8]
    t_start = time.perf_counter()

    user_id = await get_current_user(request)

    if len(payload.raw_cv.strip()) < 100:
        raise HTTPException(status_code=400, detail="CV text too short")
    if len(payload.jd_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Job description too short")

    new_balance = await require_credits(user_id, action="interview_prep", cost=1)

    # Async client so the SSE stream below doesn't block the event loop.
    client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    role_context = f" for the {payload.role} role" if payload.role else ""
    company_context = f" at {payload.company}" if payload.company else ""

    user_prompt = f"""Prepare a personalised interview pack{role_context}{company_context}.

CANDIDATE CV:
{payload.raw_cv[:8000]}

JOB DESCRIPTION:
{payload.jd_text[:8000]}

Return the full interview prep pack as JSON."""

    t_pre_llm = time.perf_counter()

    async def event_stream():
        """Stream the interview pack over SSE. Only the TRANSPORT changes (buffered -> streamed);
        model, prompt, max_tokens, temperature and the final JSON are identical to before. Emits
        `delta` progress events while generating, a `done` event carrying the complete pack JSON,
        or an `error` event (credit refunded) on failure."""
        full_text = ""
        raw = ""
        t_first = None
        try:
            async with client.messages.stream(
                model="claude-sonnet-4-6",
                # 4000 (was 2000): the full pack — 5 STAR answers + red flags +
                # questions — can exceed 2000 tokens for a rich CV, which truncated
                # the JSON mid-structure and failed the strict parse below (refund).
                max_tokens=4000,
                temperature=0,
                system=[
                    {
                        "type": "text",
                        "text": INTERVIEW_SYSTEM_PROMPT,
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

            raw = full_text.strip()
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
            t_parse = time.perf_counter()

            out_tok = 0
            try:
                final_message = await stream.get_final_message()
                usage_meta = getattr(final_message, 'usage', None)
                out_tok = getattr(usage_meta, 'output_tokens', 0)
                if usage_meta:
                    # Expected to stay 0 — prompt is below the 2,048 cacheable floor.
                    cache_read  = getattr(usage_meta, 'cache_read_input_tokens', 0)
                    cache_write = getattr(usage_meta, 'cache_creation_input_tokens', 0)
                    print(f"[{rid}] interview-prep — cache_write: {cache_write}, cache_read: {cache_read}", flush=True)
            except Exception:
                pass

            ttft = (t_first - t_pre_llm) if t_first else 0.0
            print(f"[{rid}] interview-prep(stream) | pre-LLM={t_pre_llm-t_start:.2f}s "
                  f"TTFT={ttft:.2f}s LLM={t_llm-t_pre_llm:.2f}s parse={t_parse-t_llm:.2f}s "
                  f"| total={t_parse-t_start:.2f}s | out_tokens={out_tok} | streaming=True", flush=True)

            result["_credits"] = {"balance": new_balance}
            yield f"event: done\ndata: {json.dumps(result)}\n\n"

        except json.JSONDecodeError as e:
            await refund_credits(user_id, cost=1)
            # Diagnose truncation vs malformed JSON: a tail that doesn't end in '}'
            # plus stop_reason == 'max_tokens' means we hit the token cap.
            stop_reason = None
            try:
                stop_reason = getattr(await stream.get_final_message(), 'stop_reason', None)
            except Exception:
                pass
            print(f"Interview prep JSON parse error: {e} | len={len(full_text)} "
                  f"| stop_reason={stop_reason} | tail={full_text[-200:]!r}")
            yield f"event: error\ndata: {json.dumps({'detail': 'Interview prep failed — your credit has been refunded. Please try again.'})}\n\n"
        except Exception as e:
            await refund_credits(user_id, cost=1)
            print(f"Interview prep exception (refunded): {type(e).__name__}: {e}")
            yield f"event: error\ndata: {json.dumps({'detail': 'Interview prep failed — your credit has been refunded. Please try again.'})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
