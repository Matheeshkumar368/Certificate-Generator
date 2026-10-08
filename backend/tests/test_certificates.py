import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_missing_certificate():
    response = client.get("/api/certificates/non-existent-cert-id-000")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_certificate_flow():
    # Create a job with 1 recipient
    res = client.post("/api/jobs/", json={
        "event_name": "Single Cert Test",
        "event_date": "08 Oct 2026",
        "organization": "Aereo Learning",
        "recipients": [{"name": "Jane Doe", "email": "jane@example.com"}]
    })
    assert res.status_code == 201
    job_id = res.json()["id"]

    # Retrieve certificates for job
    certs_res = client.get(f"/api/jobs/{job_id}/certificates")
    assert certs_res.status_code == 200
    certs = certs_res.json()
    assert len(certs) == 1
    cert_id = certs[0]["id"]

    # Verify JSON metadata query
    meta_res = client.get(f"/api/certificates/{cert_id}?format=json")
    assert meta_res.status_code == 200
    meta = meta_res.json()
    assert meta["recipient_name"] == "Jane Doe"
