import os
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.app.db.database import get_db
from backend.app.schemas.certificate import CertificateResponse
from backend.app.services.job_service import get_certificate
from backend.app.services.certificate_service import get_certificate_file_path
from backend.app.utils.file_utils import sanitize_filename

router = APIRouter(prefix="/certificates", tags=["Certificates"])


@router.get("/{certificate_id}")
def retrieve_certificate(
    certificate_id: str,
    request: Request,
    download: bool = Query(False, description="Whether to trigger file download"),
    format: str = Query(None, description="Set to 'json' to get metadata"),
    db: Session = Depends(get_db)
):
    cert = get_certificate(db, certificate_id)
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found.")

    accept_header = request.headers.get("accept", "")
    if format == "json" or ("application/json" in accept_header and not download):
        return CertificateResponse.model_validate(cert)

    file_path = get_certificate_file_path(db, certificate_id)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Certificate PDF file not found on disk.")

    safe_name = sanitize_filename(cert.recipient_name) or "certificate"
    filename = f"Certificate_{safe_name}.pdf"

    disposition = "attachment" if download else "inline"
    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=filename,
        headers={
            "Content-Disposition": f'{disposition}; filename="{filename}"'
        }
    )


@router.get("/{certificate_id}/download")
def download_certificate(certificate_id: str, db: Session = Depends(get_db)):
    cert = get_certificate(db, certificate_id)
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found.")

    file_path = get_certificate_file_path(db, certificate_id)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Certificate PDF file not found on disk.")

    safe_name = sanitize_filename(cert.recipient_name) or "certificate"
    filename = f"Certificate_{safe_name}.pdf"

    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=filename,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )
