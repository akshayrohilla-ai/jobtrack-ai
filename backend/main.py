from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from routers import cv, jobs, applications, recruiter, evaluate

app = FastAPI(
    title="JobTrack AI API",
    description="AI-powered job search and application tracker",
    version="1.0.0"
)

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cv.router, prefix="/api/cv", tags=["CV"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["Jobs"])
app.include_router(applications.router, prefix="/api/applications", tags=["Applications"])
app.include_router(recruiter.router, prefix="/api/recruiter", tags=["Recruiter"])
app.include_router(evaluate.router, prefix="/api/evaluate", tags=["Evaluate"])

@app.get("/")
def root():
    return {"status": "ok", "message": "JobTrack AI API is running"}

@app.get("/health")
def health():
    return {"status": "healthy"}
