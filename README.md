<div align="center">

<img src="./assets/certificateflow-readme-banner.gif" width="100%" />

# ✨ CertificateFlow

### Bulk Certificate Generation Platform

**Create • Customize • Generate • Track • Download**

</div>
<div align="center">

# ✨ CertificateFlow

### Bulk Certificate Generation Platform

**Create. Customize. Generate. Track.**

A modern full-stack certificate generation platform built for organizations to create professional certificates in bulk with customizable templates, resilient background processing, real-time progress tracking, and automated PDF generation.

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

Instead of manually creating certificates one by one, organizations can upload a recipient list, select or customize a certificate template, and generate hundreds of personalized PDF certificates through a single workflow.

The platform combines:

- 🎨 Visual certificate customization
- 📋 Bulk recipient processing
- ⚡ Background PDF generation
- 📊 Job progress tracking
- 🛡️ Individual failure handling
- 📄 Automated PDF generation
- 💾 Persistent job and certificate records

> **One request → Many certificates → Zero manual repetition.**

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
              │ Background Worker   │
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
