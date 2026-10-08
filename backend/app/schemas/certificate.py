from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class RecipientInput(BaseModel):
    name: str = Field(..., min_length=1, description="Recipient full name")
    email: str = Field(..., min_length=3, description="Recipient email address")


class CertificateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    job_id: str
    recipient_name: str
    recipient_email: str
    status: str
    file_path: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
