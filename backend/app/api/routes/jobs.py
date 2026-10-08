from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session

from backend.app.db.database import get_db, SessionLocal
from backend.app.schemas.job import JobCreate, JobResponse, JobDetailResponse, JobStatsResponse
from backend.app.schemas.certificate import CertificateResponse
from backend.app.services.job_service import (
    create_job,
    process_job_certificates,
    get_job,
    get_jobs,
    get_job_certificates,
    get_overall_stats
)

router = APIRouter(prefix="/jobs", tags=["Jobs"])


def run_job_in_background(job_id: str):
    """Background worker task using a separate dedicated session."""
    db = SessionLocal()
    try:
        process_job_certificates(job_id, db, delay_seconds=0.35)
    finally:
        db.close()


@router.post("/", response_model=JobResponse, status_code=201)
def create_generation_job(
    job_in: JobCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    if not job_in.recipients:
        raise HTTPException(status_code=400, detail="At least one recipient is required.")

    job = create_job(db, job_in)
    # Launch real background generation
    background_tasks.add_task(run_job_in_background, job.id)
    return job


@router.get("/", response_model=List[JobResponse])
def list_jobs(
    status: Optional[str] = Query(None, description="Filter by job status"),
    search: Optional[str] = Query(None, description="Search by event or organization"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    return get_jobs(db, status=status, search=search, skip=skip, limit=limit)


@router.get("/stats", response_model=JobStatsResponse)
def get_stats(db: Session = Depends(get_db)):
    return get_overall_stats(db)


@router.get("/{job_id}", response_model=JobDetailResponse)
def get_job_by_id(job_id: str, db: Session = Depends(get_db)):
    job = get_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Generation job not found.")
    
    # Eagerly load certificates
    certificates = get_job_certificates(db, job_id)
    return JobDetailResponse(
        id=job.id,
        event_name=job.event_name,
        event_date=job.event_date,
        organization=job.organization,
        description=job.description,
        total_recipients=job.total_recipients,
        successful_count=job.successful_count,
        failed_count=job.failed_count,
        status=job.status,
        created_at=job.created_at,
        completed_at=job.completed_at,
        certificates=[CertificateResponse.model_validate(c) for c in certificates]
    )


@router.get("/{job_id}/certificates", response_model=List[CertificateResponse])
def get_certificates_for_job(job_id: str, db: Session = Depends(get_db)):
    job = get_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Generation job not found.")
    return get_job_certificates(db, job_id)
