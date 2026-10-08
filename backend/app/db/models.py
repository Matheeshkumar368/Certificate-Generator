import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from backend.app.db.database import Base


class Template(Base):
    __tablename__ = "templates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), default="Corporate", nullable=False)
    orientation = Column(String(50), default="landscape", nullable=False)
    canvas_width = Column(Integer, default=800, nullable=False)
    canvas_height = Column(Integer, default=566, nullable=False)
    configuration = Column(Text, nullable=False)  # JSON payload
    is_system_template = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    jobs = relationship("GenerationJob", back_populates="template")


class GenerationJob(Base):
    __tablename__ = "generation_jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_name = Column(String(255), nullable=False)
    event_date = Column(String(100), nullable=False)
    organization = Column(String(255), nullable=False, default="Aereo Learning")
    description = Column(Text, nullable=True)
    template_id = Column(String(36), ForeignKey("templates.id", ondelete="SET NULL"), nullable=True)
    
    total_recipients = Column(Integer, default=0, nullable=False)
    successful_count = Column(Integer, default=0, nullable=False)
    failed_count = Column(Integer, default=0, nullable=False)
    
    # Status: PENDING, PROCESSING, COMPLETED, COMPLETED_WITH_ERRORS, FAILED
    status = Column(String(50), default="PENDING", nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    template = relationship("Template", back_populates="jobs")
    certificates = relationship("Certificate", back_populates="job", cascade="all, delete-orphan", order_by="Certificate.created_at")


class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String(36), ForeignKey("generation_jobs.id", ondelete="CASCADE"), nullable=False)
    
    recipient_name = Column(String(255), nullable=False)
    recipient_email = Column(String(255), nullable=False)
    
    # Status: PENDING, GENERATED, FAILED
    status = Column(String(50), default="PENDING", nullable=False)
    file_path = Column(String(500), nullable=True)
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    job = relationship("GenerationJob", back_populates="certificates")
