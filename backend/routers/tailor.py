from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
import anthropic
import os
import json
from services.supabase_client import get_supabase
from middleware.auth import get_current_user, require_credits

router = APIRouter()

# ---------------------------------------------------------------------
# CV TAILORING SYSTEM PROMPT — kept above 1,024 tokens for prompt caching.
# Do NOT shorten below ~1,024 tokens.
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
async def tailor_cv(request: Request, payload: TailorRequest):
    # 1. Verify JWT
    user_id = await get_current_user(request)

    if len(payload.jd_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Job description too short")

    if len(payload.cv_raw_text.strip()) < 100:
        raise HTTPException(status_code=400, detail="CV text too short")

    # 2. Check + decrement 1 credit
    new_balance = await require_credits(user_id, action="cv_tailor", cost=1)

    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

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
{payload.cv_raw_text[:6000]}

JOB DESCRIPTION:
{payload.jd_text[:3000]}

Rewrite the CV to maximise fit for this specific role. Return JSON only."""

    try:
        message = client.messages.create(
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
        )

        raw = message.content[0].text.strip().replace("```json", "").replace("```", "").strip()
        tailored = json.loads(raw)

        # Log cache usage
        usage_meta = getattr(message, 'usage', None)
        if usage_meta:
            cache_read  = getattr(usage_meta, 'cache_read_input_tokens', 0)
            cache_write = getattr(usage_meta, 'cache_creation_input_tokens', 0)
            print(f"Tailor — cache_write: {cache_write}, cache_read: {cache_read}")

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

        tailored["_credits"] = {"balance": new_balance}
        return tailored

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CV tailoring failed: {str(e)}")
