import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.database import get_db, Base, engine, SessionLocal
from backend.app.db.models import GenerationJob, Certificate
from backend.app.services.job_service import process_job_certificates

client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_create_job_and_generate():
    payload = {
        "event_name": "Test Rust Workshop",
        "event_date": "10 October 2026",
        "organization": "Aereo Learning",
        "description": "Introduction to systems programming.",
        "recipients": [
            {"name": "Alice Smith", "email": "alice@example.com"},
            {"name": "Bob Jones", "email": "bob@example.com"},
            {"name": "Broken User", "email": "bad-email"}
        ]
    }
    response = client.post("/api/jobs/", json=payload)
    assert response.status_code == 201
    job = response.json()
    assert job["event_name"] == "Test Rust Workshop"
    assert job["total_recipients"] == 3
    assert "id" in job

    job_id = job["id"]

    # Now run generator synchronously for tests
    db = SessionLocal()
    try:
        updated_job = process_job_certificates(job_id, db, delay_seconds=0)
        assert updated_job is not None
        assert updated_job.successful_count == 2
        assert updated_job.failed_count == 1
        assert updated_job.status == "COMPLETED_WITH_ERRORS"
    finally:
        db.close()

    # Query via API
    get_res = client.get(f"/api/jobs/{job_id}")
    assert get_res.status_code == 200
    detail = get_res.json()
    assert detail["successful_count"] == 2
    assert detail["failed_count"] == 1
    assert detail["status"] == "COMPLETED_WITH_ERRORS"
    assert len(detail["certificates"]) == 3


def test_job_not_found():
    response = client.get("/api/jobs/non-existent-job-uuid-9999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_list_jobs():
    response = client.get("/api/jobs/")
    assert response.status_code == 200
    jobs = response.json()
    assert isinstance(jobs, list)
    assert len(jobs) >= 1


def test_get_stats():
    response = client.get("/api/stats")
    assert response.status_code == 200
    stats = response.json()
    assert "total_jobs" in stats
    assert "total_certificates" in stats
    assert stats["total_jobs"] >= 1
