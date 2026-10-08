<div align="center">

<img src="./assets/certificateflow-readme-banner-fixed.gif" width="100%" />

# ✨ CertificateFlow

### Bulk Certificate Generation Platform

**Create. Customize. Generate. Track.**

A modern full-stack certificate generation platform built for organizations to create professional certificates in bulk with customizable templates, background processing, real-time progress tracking, and automated PDF generation.

<br/>

![CertificateFlow](https://img.shields.io/badge/CertificateFlow-Bulk%20Certificate%20Generator-6366F1?style=for-the-badge&logo=google-scholar&logoColor=white)

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat-square&logo=sqlite&logoColor=white)
![ReportLab](https://img.shields.io/badge/PDF-ReportLab-B91C1C?style=flat-square)
![Tests](https://img.shields.io/badge/Tests-Pytest-0A9EDC?style=flat-square&logo=pytest&logoColor=white)

<br/>

<a href="#-features">Features</a>
&nbsp;&nbsp;•&nbsp;&nbsp;
<a href="#-product-flow">Product Flow</a>
&nbsp;&nbsp;•&nbsp;&nbsp;
<a href="#-architecture">Architecture</a>
&nbsp;&nbsp;•&nbsp;&nbsp;
<a href="#-quick-start">Quick Start</a>
&nbsp;&nbsp;•&nbsp;&nbsp;
<a href="#-api">API</a>
&nbsp;&nbsp;•&nbsp;&nbsp;
<a href="#-testing">Testing</a>

</div>

---

## 🌟 Overview

**CertificateFlow** is a full-stack web application designed to simplify large-scale certificate generation.

Instead of manually creating certificates one by one, organizations can upload a recipient list, select or customize a certificate template, and generate personalized PDF certificates through a single workflow.

The platform combines:

- 🎨 Visual certificate customization
- 📋 Bulk recipient processing
- ⚡ Background certificate generation
- 📊 Real-time job progress tracking
- 🛡️ Individual certificate failure handling
- 📄 Automated PDF generation
- 💾 Persistent job and certificate records
- 📥 Individual certificate downloads

> **One request → Many certificates → Zero manual repetition.**

---

## 🎯 Assignment Objective

CertificateFlow was developed as a backend-focused certificate generation solution.

The system addresses the following requirements:

| Requirement | Implementation |
|---|---|
| Bulk certificate generation | CSV / manual recipient input |
| Recipient validation | Name and email validation |
| Certificate templates | Customizable template system |
| PDF generation | ReportLab |
| Job processing | Background processing |
| Progress tracking | Job status and progress APIs |
| Individual failures | Failed certificates do not stop the complete job |
| Certificate retrieval | Certificate listing and download APIs |
| Persistent storage | SQLite + SQLAlchemy |
| Automated testing | Pytest |

---

## ✨ Features

### 📋 Bulk Certificate Generation

Upload recipients using a CSV file containing:

```text
name,email
John Doe,john@example.com
Jane Smith,jane@example.com
```

The system validates the recipient information before starting the generation process.

---

### 🎨 Certificate Template Editor

CertificateFlow includes a customizable template system.

Supported elements include:

- Text
- Images
- Logos
- Signatures
- Shapes
- Lines
- Dynamic placeholders

Example placeholders:

```text
{{recipient_name}}
{{recipient_email}}
{{event_name}}
{{event_date}}
{{organization}}
{{certificate_id}}
{{issue_date}}
```

This allows one template to generate personalized certificates for multiple recipients.

---

### ⚡ Background Processing

Certificate generation is processed independently from the initial job creation request.

This allows the application to:

1. Create the generation job
2. Accept the recipient list
3. Start certificate processing
4. Generate PDFs
5. Track progress
6. Store successful certificates
7. Record individual failures

---

### 📊 Real-Time Job Tracking

Each generation job maintains its processing state.

Example:

```text
PENDING
   ↓
PROCESSING
   ↓
COMPLETED
```

If individual certificates fail, the job can still continue processing the remaining recipients.

---

### 🛡️ Resilient Failure Handling

A failure while generating one certificate does **not** stop the entire job.

Example:

```text
100 Recipients
      │
      ├── Certificate 001 ✓
      ├── Certificate 002 ✓
      ├── Certificate 003 ✗
      ├── Certificate 004 ✓
      ├── Certificate 005 ✓
      │
      └── ...
      
Result:
96 Successful
4 Failed
```

Failed certificates are recorded so they can be identified without losing successful results.

---

### 📄 PDF Generation

Certificates are generated as PDF files using **ReportLab**.

The generated documents contain personalized recipient information based on the selected template.

---

### 📥 Certificate Retrieval

Users can:

- View generated certificates
- View certificate details
- Download individual PDFs
- Track certificates belonging to a generation job

---

## 🎬 Product Flow

```text
              ┌─────────────────────┐
              │     Create Job      │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │ Select Certificate  │
              │      Template       │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │ Upload Recipients   │
              │    CSV / Manual     │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │ Validate Recipients │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │ Background Process  │
              └──────────┬──────────┘
                         │
                ┌────────┴────────┐
                ▼                 ▼
         ┌─────────────┐   ┌─────────────┐
         │ PDF Created │   │ PDF Failed  │
         └──────┬──────┘   └──────┬──────┘
                │                 │
                └────────┬────────┘
                         ▼
              ┌─────────────────────┐
              │ Track Job Progress  │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │ Download Certificate│
              └─────────────────────┘
```

---

## 🏗️ Architecture

```text
┌──────────────────────────────────────────────┐
│                  Frontend                    │
│                                              │
│        React + TypeScript + Vite             │
│        Tailwind CSS + Axios                  │
│        React Router                          │
└──────────────────────┬───────────────────────┘
                       │
                       │ REST API
                       ▼
┌──────────────────────────────────────────────┐
│                   Backend                    │
│                                              │
│              FastAPI + Python                │
│                                              │
│  ┌────────────┐ ┌────────────┐ ┌─────────┐ │
│  │ Validation │ │ Job Engine │ │  PDF    │ │
│  │            │ │            │ │Generator│ │
│  └────────────┘ └────────────┘ └─────────┘ │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│                 Database                     │
│                                              │
│              SQLite + SQLAlchemy             │
│                                              │
│       Generation Jobs + Certificates         │
└──────────────────────────────────────────────┘
```

---

## 🧰 Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| React | User interface |
| TypeScript | Type-safe frontend development |
| Vite | Development and build tooling |
| Tailwind CSS | UI styling |
| React Router | Application routing |
| Axios | API communication |
| Lucide | Interface icons |

### Backend

| Technology | Purpose |
|---|---|
| Python | Backend programming |
| FastAPI | REST API framework |
| Pydantic | Data validation |
| SQLAlchemy | Database ORM |
| SQLite | Relational database |
| ReportLab | PDF generation |
| Uvicorn | ASGI server |

### Testing

| Technology | Purpose |
|---|---|
| Pytest | Backend testing |
| FastAPI TestClient | API testing |

---

## 🗄️ Database Design

### GenerationJob

Stores information about each bulk generation request.

```text
GenerationJob
├── id
├── event_name
├── event_date
├── organization
├── template_id
├── total_count
├── completed_count
├── failed_count
├── status
├── created_at
└── updated_at
```

### Certificate

Stores individual generated certificate information.

```text
Certificate
├── id
├── job_id
├── recipient_name
├── recipient_email
├── certificate_id
├── file_path
├── status
├── error_message
└── created_at
```

Relationship:

```text
GenerationJob
      │
      ├── Certificate
      ├── Certificate
      ├── Certificate
      └── Certificate
```

---

## 🔌 API

### Health Check

```http
GET /api/health
```

Checks whether the backend service is running.

---

### Create Generation Job

```http
POST /api/jobs/
```

Creates a new certificate generation job.

---

### List Jobs

```http
GET /api/jobs/
```

Returns previously created generation jobs.

---

### Get Job Status

```http
GET /api/jobs/{job_id}
```

Returns job information including:

- Status
- Total recipients
- Completed certificates
- Failed certificates
- Progress

---

### Get Job Certificates

```http
GET /api/jobs/{job_id}/certificates
```

Returns certificates generated for a specific job.

---

### Get Certificate

```http
GET /api/certificates/{certificate_id}
```

Returns information about an individual certificate.

---

### Download Certificate

```http
GET /api/certificates/{certificate_id}/download
```

Downloads the generated PDF certificate.

---

### Statistics

```http
GET /api/stats
```

Returns application-level certificate generation statistics.

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Matheeshkumar368/Certificate-Generator.git

cd Certificate-Generator
```

---

### 2. Backend Setup

Open a terminal:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the backend:

```bash
uvicorn main:app --reload
```

The backend will be available at:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

---

### 3. Frontend Setup

Open another terminal from the project root:

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

The application will be available at the Vite development URL shown in the terminal.

---

## 🧪 Testing

Run backend tests:

```bash
pytest
```

The test suite covers important certificate generation scenarios.

### Test Coverage Areas

```text
✓ Job creation
✓ Recipient validation
✓ Certificate generation
✓ Job status
✓ Job progress
✓ Individual certificate failure
✓ Certificate retrieval
```

---

## 📂 Project Structure

```text
Certificate-Generator/
│
├── backend/
│   ├── main.py
│   ├── models/
│   ├── schemas/
│   ├── services/
│   ├── routes/
│   ├── tests/
│   └── requirements.txt
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── types/
│   └── ...
│
├── assets/
│   └── certificateflow-readme-banner-fixed.gif
│
├── .env.example
├── .gitignore
├── README.md
├── index.html
├── metadata.json
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🔄 Certificate Generation Lifecycle

```text
                 Job Created
                      │
                      ▼
                  Validating
                      │
                      ▼
                  Processing
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
       Success                  Failure
          │                       │
          └───────────┬───────────┘
                      ▼
                 Job Completed
```

Individual failures are isolated so that one problematic recipient does not terminate the complete generation process.

---

## 🧩 Dynamic Template System

Certificate templates support dynamic data.

For example:

```text
Certificate of Achievement

This certificate is proudly presented to

{{recipient_name}}

for successfully completing

{{event_name}}

organized by

{{organization}}

Certificate ID: {{certificate_id}}

Issued on: {{issue_date}}
```

During PDF generation, the placeholders are replaced with recipient and event information.

---

## 🎨 Template Elements

CertificateFlow supports multiple visual elements:

```text
TEXT
IMAGE
LOGO
SIGNATURE
SHAPE
LINE
```

This allows certificates to be customized without modifying the PDF generation logic for every certificate.

---

## 🛡️ Error Handling

The application is designed to handle individual certificate failures independently.

For example:

```text
Recipient 1 → ✓ Generated
Recipient 2 → ✓ Generated
Recipient 3 → ✗ Failed
Recipient 4 → ✓ Generated
Recipient 5 → ✓ Generated
```

The failed certificate is recorded with an error message while processing continues for the remaining recipients.

---

## 📈 Progress Tracking

Job progress can be represented using:

```text
Completed / Total
```

For example:

```text
75 / 100 certificates generated
```

Progress can be monitored through the job status endpoint and reflected in the frontend interface.

---

## 🔐 Environment Configuration

Environment variables can be configured using:

```text
.env
```

A sample configuration is provided in:

```text
.env.example
```

Do not commit sensitive credentials or environment secrets to the repository.

---

## 🧠 Design Principles

CertificateFlow was designed around several principles:

### Separation of Concerns

Frontend, API, database, validation, and PDF generation are separated into dedicated layers.

### Resilient Processing

One failed certificate should not stop the complete bulk operation.

### Reusable Templates

A single certificate template can be reused across multiple generation jobs.

### API-First Architecture

The frontend communicates with the backend through REST APIs.

### Simple Infrastructure

SQLite is used for straightforward local development and demonstration without requiring an external database server.

---

## 🚧 Future Improvements

Potential production enhancements include:

- Redis-based job queues
- Celery or distributed workers
- PostgreSQL
- Cloud object storage
- Email delivery
- Certificate verification URLs
- QR codes
- Authentication and role-based access
- Advanced template versioning
- Batch retry for failed certificates
- Cloud deployment
- Monitoring and observability
- Rate limiting
- Audit logging

---

## 📌 Current Scope

CertificateFlow currently focuses on the core bulk certificate generation workflow:

```text
Template
   ↓
Recipients
   ↓
Validation
   ↓
Generation Job
   ↓
PDF Generation
   ↓
Progress Tracking
   ↓
Certificate Retrieval
```

The architecture is designed so that additional infrastructure can be introduced as the application scales.

---

## 👨‍💻 Developer

**Matheeshkumar S**

B.Tech – Computer Science and Business Systems

V.S.B Engineering College, Karur

GitHub:  
https://github.com/Matheeshkumar368

---

## ⭐ Project Highlights

```text
🎨 Customizable Certificate Templates
📋 Bulk Recipient Processing
⚡ Background Generation
📊 Real-Time Progress Tracking
🛡️ Individual Failure Isolation
📄 Automated PDF Generation
💾 Persistent Database Records
🧪 Automated Backend Testing
🚀 REST API Architecture
```

---

<div align="center">

### ✨ CertificateFlow

**Create • Customize • Generate • Track**

Built with React, FastAPI, Python, SQLite and ReportLab.

⭐ If you find this project useful, consider giving the repository a star.

</div>
