import io
import os
import zipfile
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from backend.app.db.database import get_db, SessionLocal
from backend.app.schemas.job import JobCreate, JobResponse, JobDetailResponse, JobStatsResponse
from backend.app.schemas.certificate import CertificateResponse
from backend.app.services.certificate_service import get_certificate_file_path
from backend.app.utils.file_utils import sanitize_filename
from backend.app.services.job_service import (
    create_job,
    process_job_certificates,
    get_job,
    delete_job,
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


@router.get("/{job_id}/download-zip")
def download_job_certificates_zip(job_id: str, db: Session = Depends(get_db)):
    job = get_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Generation job not found.")

    certificates = [c for c in get_job_certificates(db, job_id) if c.status == "GENERATED"]
    if not certificates:
        raise HTTPException(
            status_code=400,
            detail="No generated certificates are available to download for this job."
        )

    zip_buffer = io.BytesIO()
    used_names = {}
    added_files = 0

    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for cert in certificates:
            file_path = get_certificate_file_path(db, cert.id)
            if not os.path.isfile(file_path):
                continue
            base_safe = sanitize_filename(cert.recipient_name) or "certificate"
            count = used_names.get(base_safe, 0)
            used_names[base_safe] = count + 1
            arcname = f"Certificate_{base_safe}.pdf" if count == 0 else f"Certificate_{base_safe}_{count + 1}.pdf"
            zf.write(file_path, arcname=arcname)
            added_files += 1

    if added_files == 0:
        raise HTTPException(status_code=404, detail="Generated PDF files could not be found on disk.")

    zip_buffer.seek(0)
    safe_event = sanitize_filename(job.event_name) or "event"
    zip_filename = f"Certificates_{safe_event}.zip"

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{zip_filename}"'
        }
    )


@router.delete("/{job_id}", status_code=200)
def delete_generation_job(job_id: str, db: Session = Depends(get_db)):
    job = get_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Generation job not found.")

    if job.status in ("PROCESSING", "PENDING"):
        raise HTTPException(
            status_code=400,
            detail="Cannot delete a job that is currently pending or processing. Please wait for certificate generation to finish."
        )

    try:
        result = delete_job(db, job_id)
        if not result:
            raise HTTPException(status_code=404, detail="Generation job not found.")
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete job: {str(e)}")
