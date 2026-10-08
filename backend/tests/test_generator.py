import os
import pytest
from backend.app.services.certificate_generator import generate_certificate_pdf


def test_pdf_generation_file_creation():
    test_id = "test-pdf-generator-01"
    path = generate_certificate_pdf(
        certificate_id=test_id,
        recipient_name="Deepak Kumar",
        event_name="Cloud Architecture Masterclass",
        event_date="08 October 2026",
        organization="Aereo Learning"
    )

    assert os.path.exists(path)
    file_size = os.path.getsize(path)
    assert file_size > 1000  # Should be at least a few KB

    # Validate PDF signature
    with open(path, "rb") as f:
        header = f.read(4)
        assert header == b"%PDF"

    # Cleanup test artifact
    try:
        os.remove(path)
    except OSError:
        pass
