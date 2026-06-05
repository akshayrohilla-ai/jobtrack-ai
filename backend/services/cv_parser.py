import anthropic
import os
import json
import io
from dotenv import load_dotenv

load_dotenv()

try:
    import PyPDF2
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
            reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
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
  "title": "Current or most recent job title",
  "location": "City, Country",
  "years_exp": "X years",
  "seniority": "Junior | Mid | Senior | Lead | Executive",
  "domain": "Short domain label e.g. Enterprise IT / AI, Data & Analytics, Cloud Infrastructure",
  "skills": ["skill1", "skill2", ...],
  "summary": "2-3 sentence professional summary based on the CV",
  "initials": "XX"
}

Rules:
- skills: extract up to 15 most relevant technical and soft skills
- years_exp: calculate from earliest to most recent role, or use stated years
- seniority: infer from titles and years
- initials: first letter of first name + first letter of last name
- If a field cannot be determined, use null"""

    message = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=1024,
        system=system_prompt,
        messages=[
            {"role": "user", "content": f"Parse this CV and return JSON:\n\n{cv_text[:6000]}"}
        ]
    )

    raw = message.content[0].text.strip()
    raw = raw.replace("```json", "").replace("```", "").strip()
    return json.loads(raw)
