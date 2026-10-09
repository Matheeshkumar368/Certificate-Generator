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


def test_delete_nonexistent_job():
    response = client.delete("/api/jobs/non-existent-uuid-9999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_delete_pending_or_processing_job_rejected():
    db = SessionLocal()
    job_id = "test-pending-job-uuid-123"
    try:
        pending_job = GenerationJob(
            id=job_id,
            event_name="Active Ongoing Session",
            event_date="09 Oct 2026",
            organization="Aereo Learning",
            total_recipients=5,
            successful_count=0,
            failed_count=0,
            status="PROCESSING"
        )
        db.add(pending_job)
        db.commit()
    finally:
        db.close()

    # Attempt deletion while PROCESSING
    response = client.delete(f"/api/jobs/{job_id}")
    assert response.status_code == 400
    assert "cannot delete" in response.json()["detail"].lower()

    # Verify job still exists in DB
    db = SessionLocal()
    try:
        still_there = db.query(GenerationJob).filter(GenerationJob.id == job_id).first()
        assert still_there is not None
        # Clean up test object
        db.delete(still_there)
        db.commit()
    finally:
        db.close()


def test_delete_job_success_and_cleanup():
    import os
    # 1. Create Job A to delete
    res_a = client.post("/api/jobs/", json={
        "event_name": "Job A To Delete",
        "event_date": "15 Oct 2026",
        "organization=" : "Aereo Learning",
        "recipients": [
            {"name": "Delete Target 1", "email": "target1@example.com"},
            {"name": "Delete Target 2", "email": "target2@example.com"}
        ]
    })
    assert res_a.status_code == 201
    job_a_id = res_a.json()["id"]

    # 2. Create Job B that should NOT be deleted
    res_b = client.post("/api/jobs/", json={
        "event_name": "Job B Keep Safe",
        "event_date": "16 Oct 2026",
        "organization": "Aereo Learning",
        "recipients": [
            {"name": "Safe User", "email": "safe@example.com"}
        ]
    })
    assert res_b.status_code == 201
    job_b_id = res_b.json()["id"]

    # Process certificates for both jobs synchronously
    db = SessionLocal()
    cert_a_files = []
    try:
        process_job_certificates(job_a_id, db, delay_seconds=0)
        process_job_certificates(job_b_id, db, delay_seconds=0)

        certs_a = db.query(Certificate).filter(Certificate.job_id == job_a_id).all()
        assert len(certs_a) == 2
        for c in certs_a:
            if c.file_path and os.path.isfile(c.file_path):
                cert_a_files.append(c.file_path)

        assert len(cert_a_files) >= 1, "At least one certificate PDF file was generated for Job A"
    finally:
        db.close()

    # 3. Delete Job A via API
    del_res = client.delete(f"/api/jobs/{job_a_id}")
    assert del_res.status_code == 200
    del_data = del_res.json()
    assert del_data["success"] is True
    assert del_data["id"] == job_a_id

    # 4. Verify Job A no longer exists (404)
    get_a = client.get(f"/api/jobs/{job_a_id}")
    assert get_a.status_code == 404

    # 5. Verify Job A certificates are cleaned up from DB
    db = SessionLocal()
    try:
        orphan_certs = db.query(Certificate).filter(Certificate.job_id == job_a_id).all()
        assert len(orphan_certs) == 0

        # 6. Verify Job A generated PDF files are deleted from disk
        for file_p in cert_a_files:
            assert not os.path.exists(file_p), f"Generated certificate file {file_p} should be deleted"

        # 7. Verify Job B and its certificates remain untouched
        job_b = db.query(GenerationJob).filter(GenerationJob.id == job_b_id).first()
        assert job_b is not None
        assert job_b.event_name == "Job B Keep Safe"
        certs_b = db.query(Certificate).filter(Certificate.job_id == job_b_id).all()
        assert len(certs_b) == 1
    finally:
        db.close()

