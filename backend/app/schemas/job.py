from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from backend.app.schemas.certificate import RecipientInput, CertificateResponse


class JobCreate(BaseModel):
    event_name: str = Field(..., min_length=1, description="Event or course name")
    event_date: str = Field(..., min_length=1, description="Date of the event")
    organization: str = Field(default="Aereo Learning", min_length=1, description="Issuing organization")
    description: Optional[str] = Field(default=None, description="Event description or notes")
    template_id: Optional[str] = Field(default=None, description="Selected template ID")
    recipients: List[RecipientInput] = Field(..., min_length=1, description="List of recipients")


class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    event_name: str
    event_date: str
    organization: str
    description: Optional[str] = None
    template_id: Optional[str] = None
    total_recipients: int
    successful_count: int
    failed_count: int
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None


class JobDetailResponse(JobResponse):
    certificates: List[CertificateResponse] = []


class JobStatsResponse(BaseModel):
    total_jobs: int
    total_certificates: int
    completed_jobs: int
    jobs_with_errors: int
