import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_list_templates():
    response = client.get("/api/templates/")
    assert response.status_code == 200
    templates = response.json()
    assert isinstance(templates, list)
    assert len(templates) >= 6

    # Verify our 6 default sample templates exist
    names = [t["name"] for t in templates]
    assert "Classic Gold" in names
    assert "Modern Minimal" in names
    assert "Corporate Blue" in names
    assert "Elegant Black" in names
    assert "Academic" in names
    assert "Creative Gradient" in names


def test_get_template_by_id():
    response = client.get("/api/templates/tpl-classic-gold-01")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Classic Gold"
    assert "configuration" in data
    assert "elements" in data["configuration"]
    assert len(data["configuration"]["elements"]) > 0


def test_create_and_update_template():
    create_payload = {
        "name": "Custom Tech Certificate",
        "description": "Tech conference certificate",
        "category": "Corporate",
        "orientation": "landscape",
        "canvas_width": 800,
        "canvas_height": 566,
        "configuration": {
            "background": "#FFFFFF",
            "borderStyle": "modern_minimal",
            "elements": [
                {
                    "id": "t1",
                    "type": "text",
                    "text": "Certificate for {{recipient_name}}",
                    "x": 100,
                    "y": 100,
                    "width": 600,
                    "height": 40,
                    "fontSize": 24,
                    "fontFamily": "Helvetica",
                    "fontWeight": "bold",
                    "color": "#111827",
                    "alignment": "center"
                }
            ]
        }
    }
    res = client.post("/api/templates/", json=create_payload)
    assert res.status_code == 201
    created = res.json()
    assert created["name"] == "Custom Tech Certificate"
    t_id = created["id"]

    # Update template
    update_res = client.put(f"/api/templates/{t_id}", json={"name": "Renamed Tech Certificate"})
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Renamed Tech Certificate"

    # Duplicate template
    dup_res = client.post(f"/api/templates/{t_id}/duplicate")
    assert dup_res.status_code == 201
    assert "Copy" in dup_res.json()["name"]

    # Delete custom template
    del_res = client.delete(f"/api/templates/{t_id}")
    assert del_res.status_code == 200


def test_system_template_delete_protection():
    res = client.delete("/api/templates/tpl-classic-gold-01")
    assert res.status_code == 400
    assert "system" in res.json()["detail"].lower()


def test_template_preview_pdf():
    res = client.post("/api/templates/tpl-classic-gold-01/preview")
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert len(res.content) > 1000
    assert res.content[:4] == b"%PDF"
