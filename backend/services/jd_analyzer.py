import anthropic
import os
import json
from dotenv import load_dotenv

load_dotenv()


def analyze_jd_with_ai(jd_text: str) -> dict:
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    system_prompt = """You are a recruitment assistant. Extract structured requirements from job descriptions.
Return ONLY valid JSON with no markdown, no backticks, no explanation.

Required format:
{
  "required_skills": ["skill1", "skill2", ...],
  "nice_to_have": ["skill1", ...],
  "seniority": "Junior | Mid | Senior | Lead | Executive",
  "years_exp": "X+",
  "domain": "Short domain label",
  "summary": "One sentence summary of the role and key requirements"
}

Rules:
- required_skills: short 1-3 word skill names only. e.g. "SQL", "Power BI", "Root cause analysis", "Stakeholder management"
- Keep skills atomic — never combine two skills into one phrase
- nice_to_have: skills listed as preferred, plus, bonus, or advantageous
- years_exp: stated minimum years, or "Not specified"
- seniority: inferred from title and requirements"""

    message = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=1024,
        system=system_prompt,
        messages=[{"role": "user", "content": f"Extract requirements from this job description:\n\n{jd_text[:4000]}"}]
    )

    raw = message.content[0].text.strip().replace("```json", "").replace("```", "").strip()
    return json.loads(raw)


def score_cv_against_jd(cv_skills: list, jd_requirements: dict) -> dict:
    """Use Claude to intelligently score CV skills against JD requirements."""
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    required = jd_requirements.get("required_skills", [])
    nice = jd_requirements.get("nice_to_have", [])

    if not required:
        return {"score": 50, "matched_required": [], "unmatched_required": [], "matched_nice": [], "label": "Partial match"}

    prompt = f"""You are scoring a candidate's CV skills against a job description.

JD Required Skills: {json.dumps(required)}
JD Nice-to-Have Skills: {json.dumps(nice)}
Candidate Skills: {json.dumps(cv_skills)}

Instructions:
- Match skills intelligently, accounting for synonyms, abbreviations, and related skills
- "Power BI" matches "dashboard reporting", "SQL" matches "PostgreSQL", "Root cause analysis" matches "RCA", "Stakeholder Management" matches "Stakeholder reporting"
- Be generous with related skills in the same domain
- Return ONLY valid JSON, no markdown, no explanation:

{{
  "matched_required": ["skill1", ...],
  "unmatched_required": ["skill1", ...],
  "matched_nice": ["skill1", ...],
  "reasoning": "One sentence explaining the score"
}}"""

    message = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = message.content[0].text.strip().replace("```json", "").replace("```", "").strip()
    result = json.loads(raw)

    matched_req = result.get("matched_required", [])
    unmatched_req = result.get("unmatched_required", [])
    matched_nice = result.get("matched_nice", [])

    base_score = round((len(matched_req) / len(required)) * 80) if required else 50
    bonus = round((len(matched_nice) / len(nice)) * 20) if nice else 0
    total = min(99, base_score + bonus)

    return {
        "score": total,
        "matched_required": matched_req,
        "unmatched_required": unmatched_req,
        "matched_nice": matched_nice,
        "label": "Strong match" if total >= 75 else "Partial match" if total >= 50 else "Weak match",
        "reasoning": result.get("reasoning", "")
    }
