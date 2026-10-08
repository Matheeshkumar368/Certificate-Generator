# Bulk Certificate Generator — CertificateFlow

**CertificateFlow** is a full-stack web application developed for **Aereo Learning** that enables organizations to generate, track, and distribute high-resolution certificates in bulk with real-time generation feedback, granular failure handling, and automated PDF production.

---

## Architecture Overview

```
                      React Frontend (Vite + Tailwind CSS + TypeScript)
                                              |
                                              | REST API / Reverse Proxy (/api)
                                              ↓
                                        FastAPI Backend
                                              |
                                ┌─────────────┴─────────────┐
                                ↓                           ↓
                        Pydantic Validation         Background Worker
                                │                           │
                        SQLAlchemy ORM             ReportLab PDF Engine
                                │                           │
                                ↓                           ↓
                          SQLite Storage           backend/storage/certificates/
                           (app.db)                     (*.pdf)
```

---

## Key Features

1. **Analytical Dashboard**: Overview of total generation jobs, certificates issued, completion ratios, and jobs with errors with real-time counters.
2. **Customizable Template System & Canva-Style Editor (`/templates`, `/templates/:id/edit`)**:
   - **Template Library**: 6 default designs (*Classic Gold*, *Modern Minimal*, *Corporate Blue*, *Elegant Black*, *Academic*, *Creative Gradient*) with custom cloning and management.
   - **Visual Editor**: 3-column layout featuring an element library, interactive WYSIWYG canvas, and pixel-precise properties panel.
   - **Dynamic Placeholders**: Full support for `{{recipient_name}}`, `{{recipient_email}}`, `{{event_name}}`, `{{event_date}}`, `{{organization}}`, `{{certificate_id}}`, `{{issue_date}}`.
   - **Unified PDF Pipeline**: Editor canvas and ReportLab backend consume the exact same JSON schema.
3. **Multi-Step Generation Wizard (`/generate`)**:
   - **Step 1 — Event & Template**: Select from custom or system templates with live responsive preview.
   - **Step 2 — Recipient Upload & Validation**: CSV drag-and-drop or manual addition with real-time regex parsing.
   - **Step 3 — Review & Confirmation**: Summary of valid vs invalid entries with pre-generation warning alerts.
4. **Resilient Bulk Processing**:
   - If 10 recipients are submitted and 1 has a malformed email, the remaining 9 certificates are still successfully created. The job finishes with status `COMPLETED_WITH_ERRORS`.
5. **Real-Time Generation Tracking**: Polling engine tracks the backend background worker and visualizes progress in an animated progress bar.
6. **High-Resolution Vector PDF Generator**: ReportLab engine renders custom elements, shapes, borders, and signatures into 300 DPI vector PDFs.
7. **Certificate Inspection & Download**: Built-in modal viewer with direct PDF streaming and local download capabilities.
8. **Job Management & Filtering**: Search jobs by event title and filter by status.

---

## Technology Stack

### Frontend
- **React 19** with **TypeScript**
- **Vite 8** (lightning fast development & production bundling)
- **Tailwind CSS v4** (clean SaaS layout, tabular figures, and typography)
- **React Router v7** (client-side routing)
- **Axios** (centralized API client with `/api` proxy)
- **Lucide React** (high-clarity iconography)
- **Canvas Confetti** (celebration feedback on job completion)

### Backend
- **Python 3.10+ / 3.11+**
- **FastAPI** (modern, async REST framework)
- **SQLAlchemy 2.0** (ORM persistence)
- **SQLite** (file-based relational database)
- **Pydantic v2** (strict type validation)
- **ReportLab** (vector 300 DPI PDF rendering engine)
- **Pytest** (automated integration & unit testing)

---

## REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/jobs/` | Creates a new generation job and spawns background PDF worker |
| `GET` | `/api/jobs/` | Lists jobs with optional `status` and `search` query parameters |
| `GET` | `/api/jobs/{job_id}` | Returns comprehensive job details, progress counts, and certificates |
| `GET` | `/api/jobs/{job_id}/certificates` | Lists all certificates belonging to a specific job |
| `GET` | `/api/certificates/{certificate_id}` | Streams the certificate PDF inline or returns JSON metadata |
| `GET` | `/api/certificates/{certificate_id}/download` | Downloads the generated PDF with attachment headers |
| `GET` | `/api/stats` | Aggregated metrics (total jobs, certificates, completion counts) |
| `GET` | `/api/health` | Health check probe |

---

## Database Design

### `GenerationJob`
- `id`: String (UUIDv4 primary key)
- `event_name`: String(255)
- `event_date`: String(100)
- `organization`: String(255)
- `description`: Text (optional)
- `total_recipients`: Integer
- `successful_count`: Integer
- `failed_count`: Integer
- `status`: String (`PENDING`, `PROCESSING`, `COMPLETED`, `COMPLETED_WITH_ERRORS`, `FAILED`)
- `created_at`: DateTime (UTC)
- `completed_at`: DateTime (UTC)

### `Certificate`
- `id`: String (UUIDv4 primary key)
- `job_id`: ForeignKey to `generation_jobs.id` (CASCADE on delete)
- `recipient_name`: String(255)
- `recipient_email`: String(255)
- `status`: String (`PENDING`, `GENERATED`, `FAILED`)
- `file_path`: String(500) (absolute path on disk)
- `error_message`: Text (exact reason if failed)
- `created_at`: DateTime (UTC)

---

## Running the Application

### 1. Windows Setup

```powershell
# In Terminal 1 (Backend):
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# In Terminal 2 (Frontend):
cd frontend
npm install
npm run dev
```

### 2. Linux / macOS Setup

```bash
# In Terminal 1 (Backend):
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# In Terminal 2 (Frontend):
cd frontend
npm install
npm run dev
```

### 3. Running Backend Tests

```bash
cd backend
PYTHONPATH=. pytest tests/ -v
```

---

## Future Scope

- **Relational Cloud SQL (PostgreSQL)**: Scalable storage for multi-tenant organizations.
- **Asynchronous Task Queue (Redis + Celery)**: Worker tier capable of processing tens of thousands of certificates across distributed instances.
- **Automated Email Dispatch**: Direct delivery of certificates via SMTP / SendGrid with open-tracking.
- **Cryptographic Verification**: QR code stamped on the certificate linking to a public verification page `/verify/:certId`.
- **Custom Visual Template Builder**: Drag-and-drop placeholder elements for enterprise branding.
