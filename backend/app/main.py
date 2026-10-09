from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend.app.db.database import engine, Base, get_db
from backend.app.db.models import GenerationJob, Certificate, Template
from backend.app.api.routes import jobs, certificates, templates
from backend.app.services.job_service import seed_demo_data_if_empty, get_overall_stats
from backend.app.services.template_service import seed_templates_if_empty

# Create SQLite database tables
Base.metadata.create_all(bind=engine)

# Seed on import to ensure test clients and workers have default templates & demo data
_init_db = next(get_db())
try:
    seed_templates_if_empty(_init_db)
    seed_demo_data_if_empty(_init_db)
finally:
    _init_db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is ready and seed demo data & templates if fresh
    db = next(get_db())
    try:
        seed_templates_if_empty(db)
        seed_demo_data_if_empty(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="CertificateFlow API",
    description="Bulk Certificate Generation API for Aereo Learning",
    version="1.0.0",
    lifespan=lifespan
)


@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "ok", "app": "CertificateFlow API", "version": "1.0.0"}


@app.get("/api/stats", tags=["Stats"])
def api_stats(db: Session = Depends(get_db)):
    return get_overall_stats(db)


# Include modular routers under /api
app.include_router(jobs.router, prefix="/api")
app.include_router(certificates.router, prefix="/api")
app.include_router(templates.router, prefix="/api")
