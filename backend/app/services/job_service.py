import os
import json
import time
import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from backend.app.db.models import GenerationJob, Certificate, Template
from backend.app.db.database import CERTIFICATES_DIR
from backend.app.schemas.job import JobCreate, JobStatsResponse
from backend.app.utils.file_utils import validate_email_format
from backend.app.services.certificate_generator import generate_certificate_pdf


def create_job(db: Session, job_data: JobCreate) -> GenerationJob:
    job_id = str(uuid.uuid4())
    total = len(job_data.recipients)

    job = GenerationJob(
        id=job_id,
        event_name=job_data.event_name.strip(),
        event_date=job_data.event_date.strip(),
        organization=job_data.organization.strip() or "Aereo Learning",
        description=job_data.description.strip() if job_data.description else None,
        template_id=job_data.template_id,
        total_recipients=total,
        successful_count=0,
        failed_count=0,
        status="PENDING",
        created_at=datetime.utcnow()
    )
    db.add(job)
    db.flush()

    for r in job_data.recipients:
        cert_id = str(uuid.uuid4())
        cert = Certificate(
            id=cert_id,
            job_id=job_id,
            recipient_name=r.name.strip(),
            recipient_email=r.email.strip(),
            status="PENDING",
            created_at=datetime.utcnow()
        )
        db.add(cert)

    db.commit()
    db.refresh(job)
    return job


def process_job_certificates(job_id: str, db: Session, delay_seconds: float = 0.35) -> GenerationJob:
    job = db.query(GenerationJob).filter(GenerationJob.id == job_id).first()
    if not job:
        return None

    job.status = "PROCESSING"
    db.commit()

    # Load template configuration if assigned
    template_config = None
    if job.template_id:
        tpl = db.query(Template).filter(Template.id == job.template_id).first()
        if tpl and tpl.configuration:
            try:
                template_config = json.loads(tpl.configuration)
            except Exception as e:
                print(f"Error parsing template JSON: {e}")

    certificates = db.query(Certificate).filter(Certificate.job_id == job_id).all()
    success_count = 0
    fail_count = 0

    for cert in certificates:
        # Subtle sleep to simulate realistic generation and enable progress polling
        if delay_seconds > 0:
            time.sleep(delay_seconds)

        name = cert.recipient_name.strip()
        email = cert.recipient_email.strip()

        # Validation rules:
        if not name:
            cert.status = "FAILED"
            cert.error_message = "Recipient name cannot be empty."
            fail_count += 1
        elif not validate_email_format(email):
            cert.status = "FAILED"
            cert.error_message = f"Invalid email format: '{email}'"
            fail_count += 1
        else:
            try:
                file_path = generate_certificate_pdf(
                    certificate_id=cert.id,
                    recipient_name=name,
                    event_name=job.event_name,
                    event_date=job.event_date,
                    organization=job.organization,
                    recipient_email=email,
                    template_config=template_config
                )
                cert.status = "GENERATED"
                cert.file_path = file_path
                cert.error_message = None
                success_count += 1
            except Exception as e:
                cert.status = "FAILED"
                cert.error_message = f"Generation error: {str(e)}"
                fail_count += 1

        # Incremental database update for real-time progress
        job.successful_count = success_count
        job.failed_count = fail_count
        db.commit()

    # Final status determination
    if fail_count == 0 and success_count > 0:
        job.status = "COMPLETED"
    elif success_count == 0 and fail_count > 0:
        job.status = "FAILED"
    elif success_count > 0 and fail_count > 0:
        job.status = "COMPLETED_WITH_ERRORS"
    else:
        job.status = "COMPLETED"

    job.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(job)
    return job


def get_job(db: Session, job_id: str) -> Optional[GenerationJob]:
    return db.query(GenerationJob).filter(GenerationJob.id == job_id).first()


def delete_job(db: Session, job_id: str) -> Optional[dict]:
    job = db.query(GenerationJob).filter(GenerationJob.id == job_id).first()
    if not job:
        return None

    if job.status in ("PROCESSING", "PENDING"):
        raise ValueError("Cannot delete a job that is currently pending or processing. Please wait for generation to complete.")

    certificates = db.query(Certificate).filter(Certificate.job_id == job_id).all()
    deleted_files = 0

    real_cert_dir = os.path.realpath(CERTIFICATES_DIR)

    for cert in certificates:
        candidate_paths = []
        if cert.file_path:
            candidate_paths.append(cert.file_path)
        canonical_path = os.path.join(CERTIFICATES_DIR, f"certificate_{cert.id}.pdf")
        if canonical_path not in candidate_paths:
            candidate_paths.append(canonical_path)

        for p in candidate_paths:
            try:
                real_p = os.path.realpath(p)
                # Restrict strictly to files inside CERTIFICATES_DIR to avoid arbitrary path deletion
                if real_p.startswith(real_cert_dir) and os.path.isfile(real_p):
                    os.remove(real_p)
                    deleted_files += 1
            except Exception as e:
                print(f"Warning: could not delete file {p}: {e}")

    cert_count = len(certificates)
    event_name = job.event_name
    db.delete(job)
    db.commit()

    return {
        "success": True,
        "id": job_id,
        "event_name": event_name,
        "deleted_certificates": cert_count,
        "deleted_files": deleted_files
    }


def get_jobs(
    db: Session,
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> List[GenerationJob]:
    query = db.query(GenerationJob)

    if status and status != "ALL":
        query = query.filter(GenerationJob.status == status)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            or_(
                GenerationJob.event_name.ilike(search_filter),
                GenerationJob.organization.ilike(search_filter),
                GenerationJob.id.ilike(search_filter)
            )
        )

    return query.order_by(desc(GenerationJob.created_at)).offset(skip).limit(limit).all()


def get_job_certificates(db: Session, job_id: str) -> List[Certificate]:
    return db.query(Certificate).filter(Certificate.job_id == job_id).order_by(Certificate.created_at).all()


def get_certificate(db: Session, certificate_id: str) -> Optional[Certificate]:
    return db.query(Certificate).filter(Certificate.id == certificate_id).first()


def get_overall_stats(db: Session) -> JobStatsResponse:
    total_jobs = db.query(GenerationJob).count()
    completed_jobs = db.query(GenerationJob).filter(GenerationJob.status == "COMPLETED").count()
    jobs_with_errors = db.query(GenerationJob).filter(
        or_(
            GenerationJob.status == "COMPLETED_WITH_ERRORS",
            GenerationJob.status == "FAILED"
        )
    ).count()

    # Sum of generated certificates
    total_certs = db.query(Certificate).filter(Certificate.status == "GENERATED").count()

    return JobStatsResponse(
        total_jobs=total_jobs,
        total_certificates=total_certs,
        completed_jobs=completed_jobs,
        jobs_with_errors=jobs_with_errors
    )


def seed_demo_data_if_empty(db: Session):
    """Seeds realistic demo data matching user assignment specs if table is empty."""
    count = db.query(GenerationJob).count()
    if count > 0:
        return

    now = datetime.utcnow()

    # Demo Job 1: Python Workshop (3 recipients, 2 success, 1 fail)
    job1_id = "f1a2b3c4-1111-2222-3333-444444444444"
    job1 = GenerationJob(
        id=job1_id,
        event_name="Python Workshop",
        event_date="08 Oct 2026",
        organization="Aereo Learning",
        description="A comprehensive workshop on Python programming for beginners.",
        total_recipients=3,
        successful_count=2,
        failed_count=1,
        status="COMPLETED_WITH_ERRORS",
        created_at=now - timedelta(hours=2),
        completed_at=now - timedelta(hours=1, minutes=58)
    )
    db.add(job1)
    db.flush()

    # Create certificates for Job 1
    recipients_job1 = [
        ("c1-1111-2222-3333-444444444441", "Matheesh Kumar", "matheesh@example.com", True),
        ("c1-1111-2222-3333-444444444442", "Rahul Kumar", "rahul@example.com", True),
        ("c1-1111-2222-3333-444444444443", "Invalid User", "invalid-email", False),
    ]

    for cid, name, email, is_valid in recipients_job1:
        if is_valid:
            pdf_path = generate_certificate_pdf(
                certificate_id=cid,
                recipient_name=name,
                event_name="Python Workshop",
                event_date="08 Oct 2026",
                organization="Aereo Learning"
            )
            cert = Certificate(
                id=cid,
                job_id=job1_id,
                recipient_name=name,
                recipient_email=email,
                status="GENERATED",
                file_path=pdf_path,
                created_at=now - timedelta(hours=2)
            )
        else:
            cert = Certificate(
                id=cid,
                job_id=job1_id,
                recipient_name=name,
                recipient_email=email,
                status="FAILED",
                error_message="Invalid email format: 'invalid-email'",
                file_path=None,
                created_at=now - timedelta(hours=2)
            )
        db.add(cert)

    # Demo Job 2: Django Bootcamp (10 recipients, 10 success)
    job2_id = "a7d8e9f0-2222-3333-4444-555555555555"
    job2 = GenerationJob(
        id=job2_id,
        event_name="Django Bootcamp",
        event_date="01 Oct 2026",
        organization="Aereo Learning",
        description="Intensive weekend bootcamp on building scalable web apps with Django & REST API.",
        total_recipients=10,
        successful_count=10,
        failed_count=0,
        status="COMPLETED",
        created_at=now - timedelta(days=7),
        completed_at=now - timedelta(days=7) + timedelta(minutes=5)
    )
    db.add(job2)
    db.flush()

    django_names = [
        "Aarav Sharma", "Priya Patel", "Kavya Nair", "Vikram Malhotra",
        "Ananya Roy", "Rohan Joshi", "Sneha Rao", "Aditya Verma", "Pooja Reddy", "Deepak Gupta"
    ]
    for idx, dname in enumerate(django_names, start=1):
        cid = f"c2-1111-2222-3333-5555555555{idx:02d}"
        pdf_path = generate_certificate_pdf(
            certificate_id=cid,
            recipient_name=dname,
            event_name="Django Bootcamp",
            event_date="01 Oct 2026",
            organization="Aereo Learning"
        )
        cert = Certificate(
            id=cid,
            job_id=job2_id,
            recipient_name=dname,
            recipient_email=f"{dname.lower().replace(' ', '.')}@example.com",
            status="GENERATED",
            file_path=pdf_path,
            created_at=now - timedelta(days=7)
        )
        db.add(cert)

    # Demo Job 3: Web Development (25 recipients, 25 success)
    job3_id = "c9d0e1f2-3333-4444-5555-666666666666"
    job3 = GenerationJob(
        id=job3_id,
        event_name="Web Development",
        event_date="25 Sep 2026",
        organization="Aereo Learning",
        description="Frontend and Backend foundation program.",
        total_recipients=25,
        successful_count=25,
        failed_count=0,
        status="COMPLETED",
        created_at=now - timedelta(days=13),
        completed_at=now - timedelta(days=13) + timedelta(minutes=10)
    )
    db.add(job3)
    db.flush()

    # Create certificates for demo job 3 (generate sample certificates)
    for i in range(1, 26):
        cid = f"c3-1111-2222-3333-6666666666{i:02d}"
        sname = f"Web Dev Student {i}"
        pdf_path = generate_certificate_pdf(
            certificate_id=cid,
            recipient_name=sname,
            event_name="Web Development",
            event_date="25 Sep 2026",
            organization="Aereo Learning"
        )
        cert = Certificate(
            id=cid,
            job_id=job3_id,
            recipient_name=sname,
            recipient_email=f"student{i}@example.com",
            status="GENERATED",
            file_path=pdf_path,
            created_at=now - timedelta(days=13)
        )
        db.add(cert)

    db.commit()
