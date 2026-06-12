from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from middleware.ratelimit import user_or_ip
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv
import logging
import os

load_dotenv()

logger = logging.getLogger(__name__)

# --- Sentry error tracking (dormant unless SENTRY_DSN is set) ---
_sentry_dsn = os.getenv("SENTRY_DSN")
if _sentry_dsn:
    import sentry_sdk
    sentry_sdk.init(
        dsn=_sentry_dsn,
        environment=os.getenv("SENTRY_ENV", "production"),
        # Capture 10% of requests for performance tracing — keeps within free quota.
        traces_sample_rate=0.1,
        # Do NOT send personal data (auth headers, CV text, user IPs) to Sentry.
        send_default_pii=False,
    )
    logger.info("Sentry initialised")

from routers import cv, jobs, applications, recruiter, evaluate, admin, tailor, payments, interview, user

limiter = Limiter(key_func=user_or_ip)

app = FastAPI(
    title="JobTrack AI API",
    description="AI-powered job search and application tracker",
    version="1.0.0"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Parse allowed origins: trim whitespace, drop blanks.
allowed_origins = [
    o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if o.strip()
]

# Safety guard: a wildcard origin combined with credentialed requests is unsafe
# (and rejected by browsers). If "*" is configured, disable credentials so we
# never echo back arbitrary origins with Access-Control-Allow-Credentials.
allow_credentials = True
if "*" in allowed_origins:
    logger.warning(
        "ALLOWED_ORIGINS contains '*'; disabling credentialed CORS. "
        "Set ALLOWED_ORIGINS to your exact frontend domain(s) in production."
    )
    allow_credentials = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cv.router,           prefix="/api/cv",           tags=["CV"])
app.include_router(jobs.router,         prefix="/api/jobs",         tags=["Jobs"])
app.include_router(applications.router, prefix="/api/applications", tags=["Applications"])
app.include_router(recruiter.router,    prefix="/api/recruiter",    tags=["Recruiter"])
app.include_router(evaluate.router,     prefix="/api/evaluate",     tags=["Evaluate"])
app.include_router(admin.router,        prefix="/api/admin",        tags=["Admin"])
app.include_router(tailor.router,       prefix="/api/tailor",       tags=["Tailor"])
app.include_router(payments.router,     prefix="/api/payments",     tags=["Payments"])
app.include_router(interview.router,    prefix="/api/interview",    tags=["Interview"])
app.include_router(user.router,         prefix="/api/user",          tags=["User"])

@app.get("/")
def root():
    return {"status": "ok", "message": "JobTrack AI API is running"}

@app.get("/health")
def health():
    return {"status": "healthy"}
