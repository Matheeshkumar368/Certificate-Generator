import os
from fastapi import HTTPException
from sqlalchemy.orm import Session
from backend.app.db.models import Certificate, GenerationJob, Template
from backend.app.db.database import CERTIFICATES_DIR
from backend.app.services.certificate_generator import generate_certificate_pdf
import json


def get_certificate_file_path(db: Session, certificate_id: str) -> str:
    cert = db.query(Certificate).filter(Certificate.id == certificate_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found.")

    if cert.status != "GENERATED":
        raise HTTPException(
            status_code=400,
            detail=cert.error_message or f"Certificate is in '{cert.status}' status and has no PDF file."
        )

    expected_path = os.path.join(CERTIFICATES_DIR, f"certificate_{cert.id}.pdf")
    candidate_path = cert.file_path if cert.file_path else expected_path

    if os.path.isfile(candidate_path) and os.path.getsize(candidate_path) > 0:
        return candidate_path

    if os.path.isfile(expected_path) and os.path.getsize(expected_path) > 0:
        cert.file_path = expected_path
        db.commit()
        return expected_path

    # Regenerate to expected location if missing from disk
    job = db.query(GenerationJob).filter(GenerationJob.id == cert.job_id).first()
    template_config = None
    if job and job.template_id:
        tpl = db.query(Template).filter(Template.id == job.template_id).first()
        if tpl and tpl.configuration:
            try:
                template_config = json.loads(tpl.configuration)
            except Exception:
                template_config = None

    file_path = generate_certificate_pdf(
        certificate_id=cert.id,
        recipient_name=cert.recipient_name,
        event_name=job.event_name if job else "Certificate Program",
        event_date=job.event_date if job else "08 Oct 2026",
        organization=job.organization if job else "Aereo Learning",
        recipient_email=cert.recipient_email,
        template_config=template_config
    )
    cert.file_path = file_path
    db.commit()
    return file_path
