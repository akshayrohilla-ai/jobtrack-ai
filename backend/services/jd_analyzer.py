import anthropic
import os
import json
from dotenv import load_dotenv

load_dotenv()


def analyze_jd_with_ai(jd_text: str) -> dict:
    """Send JD text to Claude and get structured requirements back."""
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
- required_skills: skills clearly listed as requirements or must-haves
- nice_to_have: skills listed as preferred, plus, bonus, or advantageous
- years_exp: stated minimum years of experience
- seniority: inferred from title and requirements"""

    message = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=1024,
        system=system_prompt,
        messages=[
            {"role": "user", "content": f"Extract requirements from this job description:\n\n{jd_text[:4000]}"}
        ]
    )

    raw = message.content[0].text.strip()
    raw = raw.replace("```json", "").replace("```", "").strip()
    return json.loads(raw)


def score_cv_against_jd(cv_skills: list[str], jd_requirements: dict) -> dict:
    """Score a candidate's skills against JD requirements."""
    required = [s.lower() for s in jd_requirements.get("required_skills", [])]
    nice = [s.lower() for s in jd_requirements.get("nice_to_have", [])]
    candidate_skills = [s.lower() for s in cv_skills]

    def skill_matches(candidate_skill, jd_skill):
        return candidate_skill in jd_skill or jd_skill in candidate_skill

    matched_required = []
    for req in required:
        if any(skill_matches(cs, req) for cs in candidate_skills):
            matched_required.append(req)

    matched_nice = []
    for n in nice:
        if any(skill_matches(cs, n) for cs in candidate_skills):
            matched_nice.append(n)

    base_score = round((len(matched_required) / len(required)) * 80) if required else 50
    bonus = round((len(matched_nice) / len(nice)) * 20) if nice else 0
    total = min(99, base_score + bonus)

    return {
        "score": total,
        "matched_required": matched_required,
        "matched_nice": matched_nice,
        "label": "Strong match" if total >= 75 else "Partial match" if total >= 50 else "Weak match"
    }
