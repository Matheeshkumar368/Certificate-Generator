import os
import re

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


def validate_email_format(email: str) -> bool:
    if not email or not isinstance(email, str):
        return False
    return bool(EMAIL_REGEX.match(email.strip()))


def sanitize_filename(name: str) -> str:
    cleaned = re.sub(r"[^\w\s-]", "", name).strip()
    return re.sub(r"[-\s]+", "_", cleaned).lower()


def ensure_directory(path: str) -> str:
    os.makedirs(path, exist_ok=True)
    return path
