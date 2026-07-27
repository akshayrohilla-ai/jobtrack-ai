import anthropic
import os
import json
import io
from dotenv import load_dotenv

load_dotenv()

try:
    import pypdf  # successor to the deprecated PyPDF2 (same PdfReader API)
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False

try:
    from docx import Document
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False


def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    """Extract plain text from PDF, DOCX, or TXT file."""
    fname = filename.lower()

    if fname.endswith(".txt"):
        return file_bytes.decode("utf-8", errors="ignore")

    if fname.endswith(".pdf") and PDF_AVAILABLE:
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
            return text.strip()
        except Exception as e:
            return f"[PDF extraction failed: {e}]"

    if fname.endswith(".docx") and DOCX_AVAILABLE:
        try:
            doc = Document(io.BytesIO(file_bytes))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            return "\n".join(paragraphs)
        except Exception as e:
            return f"[DOCX extraction failed: {e}]"

    return "[Unsupported file format — please upload PDF, DOCX, or TXT]"


def parse_cv_with_ai(cv_text: str) -> dict:
    """Send CV text to Claude and get structured profile back."""
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    system_prompt = """You are a CV/resume parser. Extract structured data from the CV text provided.
Return ONLY valid JSON with no markdown, no backticks, no explanation.

Required format:
{
  "name": "Full Name",
  "email": "email@example.com or null",
  "phone": "+91 XXXXXXXXXX or null",
  "linkedin": "linkedin.com/in/username or null",
  "title": "Current or most recent job title",
  "location": "City, Country",
  "years_exp": "X years",
  "seniority": "Junior | Mid | Senior | Lead | Executive",
  "domain": "Short domain label e.g. Enterprise IT / AI, Data & Analytics, Cloud Infrastructure",
  "skills": ["skill1", "skill2", ...],
  "summary": "2-3 sentence professional summary based on the CV",
  "education": [{"degree": "e.g. MBA Finance", "institution": "University/College name", "year": "e.g. 2020"}],
  "certifications": ["Certification, license, or award name | Issuer | Year"],
  "initials": "XX"
}

Rules:
- email: extract the email address if present, else null
- phone: extract the phone number if present, else null
- linkedin: extract the LinkedIn URL or username if present, else null
- skills: extract up to 25 skills covering BOTH tools AND competencies
  * Tools/platforms: Power BI, SQL, PostgreSQL, Python, Jira, Confluence, VMware, etc.
  * Competencies: Root cause analysis, Stakeholder management, Dashboard monitoring, Reporting, Documentation, SOP development, Process improvement, Requirements elicitation, Data analysis, Change management, KPI development, etc.
  * Include skills even if only mentioned once in the CV — breadth matters for matching
- Use short 1-3 word skill names that match how JDs describe them
- years_exp: calculate from earliest to most recent role, or use stated years
- seniority: infer from titles and years
- education: extract ALL degrees/qualifications as objects (degree, institution, year). Scan the ENTIRE CV — education is very often near the END, after all work experience. If none found, use []
- certifications: extract certifications, licenses, AND professional awards (name, issuer, year if stated). These also tend to appear near the end. If none found, use []
- initials: first letter of first name + first letter of last name
- If a field cannot be determined, use null (for lists, use [])"""

    # Read up to 20k chars (was 6k): education, certifications, and awards
    # almost always sit at the END of a CV, past the old 6k cutoff. Haiku is
    # cheap (~$0.005 for a full CV) and parsing is free to the user, so the
    # extra coverage is worth it to capture degree/credential data reliably.
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1536,
        system=system_prompt,
        messages=[
            {"role": "user", "content": f"Parse this CV and return JSON:\n\n{cv_text[:20000]}"}
        ]
    )

    raw = message.content[0].text.strip()
    raw = raw.replace("```json", "").replace("```", "").strip()
    return json.loads(raw)
