import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.app.db.database import get_db
from backend.app.schemas.template import (
    TemplateCreate,
    TemplateUpdate,
    TemplateResponse,
)
from backend.app.services.template_service import (
    get_templates,
    get_template,
    create_template,
    update_template,
    duplicate_template,
    delete_template,
)
from backend.app.services.certificate_generator import generate_certificate_pdf

router = APIRouter(prefix="/templates", tags=["Templates"])


def _to_response(tpl) -> TemplateResponse:
    config_dict = json.loads(tpl.configuration) if isinstance(tpl.configuration, str) else tpl.configuration
    return TemplateResponse(
        id=tpl.id,
        name=tpl.name,
        description=tpl.description,
        category=tpl.category,
        orientation=tpl.orientation,
        canvas_width=tpl.canvas_width,
        canvas_height=tpl.canvas_height,
        configuration=config_dict,
        is_system_template=tpl.is_system_template,
        created_at=tpl.created_at,
        updated_at=tpl.updated_at,
    )


@router.get("/", response_model=List[TemplateResponse])
def list_templates(
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db)
):
    templates = get_templates(db, category=category)
    return [_to_response(t) for t in templates]


@router.get("/{template_id}", response_model=TemplateResponse)
def get_template_by_id(template_id: str, db: Session = Depends(get_db)):
    tpl = get_template(db, template_id)
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found.")
    return _to_response(tpl)


@router.post("/", response_model=TemplateResponse, status_code=201)
def create_new_template(tpl_in: TemplateCreate, db: Session = Depends(get_db)):
    tpl = create_template(db, tpl_in)
    return _to_response(tpl)


@router.put("/{template_id}", response_model=TemplateResponse)
def update_existing_template(template_id: str, tpl_in: TemplateUpdate, db: Session = Depends(get_db)):
    tpl = update_template(db, template_id, tpl_in)
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found.")
    return _to_response(tpl)


@router.delete("/{template_id}")
def delete_template_by_id(template_id: str, db: Session = Depends(get_db)):
    tpl = get_template(db, template_id)
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found.")
    if tpl.is_system_template:
        raise HTTPException(status_code=400, detail="Default system templates cannot be deleted directly. Duplicate it first.")
    
    success = delete_template(db, template_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete template.")
    return {"status": "success", "message": f"Template '{tpl.name}' deleted successfully."}


@router.post("/{template_id}/duplicate", response_model=TemplateResponse, status_code=201)
def duplicate_existing_template(template_id: str, db: Session = Depends(get_db)):
    dup = duplicate_template(db, template_id)
    if not dup:
        raise HTTPException(status_code=404, detail="Original template not found.")
    return _to_response(dup)


@router.post("/{template_id}/preview")
def preview_template_pdf(template_id: str, db: Session = Depends(get_db)):
    tpl = get_template(db, template_id)
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found.")

    config_dict = json.loads(tpl.configuration) if isinstance(tpl.configuration, str) else tpl.configuration

    # Generate test preview PDF with canonical sample data
    preview_id = f"preview_{template_id}"
    pdf_path = generate_certificate_pdf(
        certificate_id=preview_id,
        recipient_name="Matheesh Kumar",
        event_name="Python Workshop",
        event_date="08 October 2026",
        organization="Aereo Learning",
        recipient_email="matheesh@example.com",
        issue_date="08 October 2026",
        template_config=config_dict
    )

    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=f"Preview_{tpl.name.replace(' ', '_')}.pdf",
        headers={"Content-Disposition": f'inline; filename="Preview_{tpl.name}.pdf"'}
    )
