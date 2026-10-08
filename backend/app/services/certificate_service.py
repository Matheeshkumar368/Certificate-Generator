import os
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException
from backend.app.db.models import Certificate
from backend.app.services.job_service import get_certificate


def get_certificate_file_path(db: Session, certificate_id: str) -> str:
    cert = get_certificate(db, certificate_id)
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found.")
    
    if cert.status != "GENERATED" or not cert.file_path:
        raise HTTPException(
            status_code=400,
            detail=f"Certificate has not been generated successfully (status: {cert.status})."
        )

    if not os.path.exists(cert.file_path):
        raise HTTPException(status_code=404, detail="Certificate PDF file is missing on storage.")

    return cert.file_path
