import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { INITIAL_SYSTEM_TEMPLATES } from './src/api/templates.ts';
import type { Template, JobDetail, Certificate } from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory stores
const templatesStore = new Map<string, Template>();
const jobsStore = new Map<string, JobDetail>();
const certificatesStore = new Map<string, Certificate>();

function sanitizeFilename(name: string): string {
  return (name || 'certificate')
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'certificate';
}

function validateEmailFormat(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(trimmed);
}

function escapePdfText(str: string): string {
  return (str || '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/**
 * Generates a valid landscape PDF (792 x 612 pt) buffer in pure Node.js
 * with decorative borders and certificate typography.
 */
function generateCertificatePdfBuffer(params: {
  certificateId: string;
  recipientName: string;
  eventName: string;
  eventDate: string;
  organization: string;
  issueDate?: string;
}): Buffer {
  const {
    certificateId,
    recipientName,
    eventName,
    eventDate,
    organization,
    issueDate = eventDate,
  } = params;

  const streamLines = [
    // Background fill (#FCFBF9)
    '0.988 0.984 0.976 rg',
    '0 0 792 612 re f',
    // Outer Navy Border (#0F172A)
    '0.059 0.090 0.165 RG',
    '3 w',
    '22 22 748 568 re S',
    // Middle Gold Border (#D97706)
    '0.851 0.467 0.024 RG',
    '1.5 w',
    '27 27 738 558 re S',
    // Inner Slate Border (#1E293B)
    '0.118 0.161 0.231 RG',
    '0.75 w',
    '31 31 730 550 re S',
    // Recipient Gold Underline
    '0.851 0.467 0.024 RG',
    '1.5 w',
    '236 355 m 556 355 l S',
    // Organization
    'BT',
    '/F1 16 Tf',
    '0.118 0.161 0.231 rg',
    `1 0 0 1 ${Math.max(80, 396 - (organization.length * 4.8)).toFixed(1)} 515 Tm`,
    `(${escapePdfText(organization.toUpperCase())}) Tj`,
    'ET',
    // Title
    'BT',
    '/F1 26 Tf',
    '0.059 0.090 0.165 rg',
    '1 0 0 1 180 465 Tm',
    '(CERTIFICATE OF PARTICIPATION) Tj',
    'ET',
    // Subtitle
    'BT',
    '/F2 14 Tf',
    '0.278 0.333 0.412 rg',
    '1 0 0 1 268 425 Tm',
    '(This is proudly presented to certify that) Tj',
    'ET',
    // Recipient Name
    'BT',
    '/F1 30 Tf',
    '0.118 0.106 0.294 rg',
    `1 0 0 1 ${Math.max(80, 396 - (recipientName.length * 8.2)).toFixed(1)} 372 Tm`,
    `(${escapePdfText(recipientName)}) Tj`,
    'ET',
    // Participation statement
    'BT',
    '/F2 14 Tf',
    '0.278 0.333 0.412 rg',
    '1 0 0 1 255 328 Tm',
    '(has successfully participated in the program) Tj',
    'ET',
    // Event Name
    'BT',
    '/F1 20 Tf',
    '0.059 0.090 0.165 rg',
    `1 0 0 1 ${Math.max(80, 396 - (eventName.length * 5.8)).toFixed(1)} 292 Tm`,
    `(${escapePdfText(eventName)}) Tj`,
    'ET',
    // Event Date
    'BT',
    '/F3 12 Tf',
    '0.392 0.455 0.545 rg',
    `1 0 0 1 ${Math.max(80, 396 - ((eventDate.length + 13) * 3.1)).toFixed(1)} 264 Tm`,
    `(conducted on ${escapePdfText(eventDate)}) Tj`,
    'ET',
    // Footer Left: Certificate ID & Issue Date
    'BT',
    '/F3 9 Tf',
    '0.392 0.455 0.545 rg',
    '1 0 0 1 65 118 Tm',
    `(Certificate ID: ${escapePdfText(certificateId)}) Tj`,
    'ET',
    'BT',
    '/F3 9 Tf',
    '0.392 0.455 0.545 rg',
    '1 0 0 1 65 100 Tm',
    `(Issue Date: ${escapePdfText(issueDate)}) Tj`,
    'ET',
    // Footer Right: Signatory
    'BT',
    '/F1 11 Tf',
    '0.059 0.090 0.165 rg',
    '1 0 0 1 580 118 Tm',
    '(Authorized Signatory) Tj',
    'ET',
    'BT',
    '/F3 10 Tf',
    '0.392 0.455 0.545 rg',
    '1 0 0 1 580 102 Tm',
    `(${escapePdfText(organization)}) Tj`,
    'ET',
  ];

  const contentStream = streamLines.join('\n');
  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 792 612] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${Buffer.byteLength(contentStream, 'utf8')} >>\nstream\n${contentStream}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
    '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Times-Italic >>\nendobj\n',
    '7 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += obj;
  }
  const xrefStart = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  return Buffer.from(pdf, 'utf8');
}

function seedInitialData() {
  if (templatesStore.size === 0) {
    for (const tpl of INITIAL_SYSTEM_TEMPLATES) {
      templatesStore.set(tpl.id, structuredClone(tpl));
    }
  }

  if (jobsStore.size === 0) {
    const now = Date.now();

    // Job 1: Python Workshop
    const job1Id = 'f1a2b3c4-1111-2222-3333-444444444444';
    const job1Certs: Certificate[] = [
      {
        id: 'c1-1111-2222-3333-444444444441',
        job_id: job1Id,
        recipient_name: 'Matheesh Kumar',
        recipient_email: 'matheesh@example.com',
        status: 'GENERATED',
        file_path: `/api/certificates/c1-1111-2222-3333-444444444441`,
        created_at: new Date(now - 2 * 3600000).toISOString(),
      },
      {
        id: 'c1-1111-2222-3333-444444444442',
        job_id: job1Id,
        recipient_name: 'Rahul Kumar',
        recipient_email: 'rahul@example.com',
        status: 'GENERATED',
        file_path: `/api/certificates/c1-1111-2222-3333-444444444442`,
        created_at: new Date(now - 2 * 3600000).toISOString(),
      },
      {
        id: 'c1-1111-2222-3333-444444444443',
        job_id: job1Id,
        recipient_name: 'Invalid User',
        recipient_email: 'invalid-email',
        status: 'FAILED',
        error_message: "Invalid email format: 'invalid-email'",
        created_at: new Date(now - 2 * 3600000).toISOString(),
      },
    ];
    job1Certs.forEach((c) => certificatesStore.set(c.id, c));
    jobsStore.set(job1Id, {
      id: job1Id,
      event_name: 'Python Workshop',
      event_date: '08 Oct 2026',
      organization: 'Aereo Learning',
      description: 'A comprehensive workshop on Python programming for beginners.',
      total_recipients: 3,
      successful_count: 2,
      failed_count: 1,
      status: 'COMPLETED_WITH_ERRORS',
      created_at: new Date(now - 2 * 3600000).toISOString(),
      completed_at: new Date(now - 1.95 * 3600000).toISOString(),
      certificates: job1Certs,
    });

    // Job 2: Django Bootcamp
    const job2Id = 'a7d8e9f0-2222-3333-4444-555555555555';
    const djangoNames = [
      'Aarav Sharma', 'Priya Patel', 'Kavya Nair', 'Vikram Malhotra',
      'Ananya Roy', 'Rohan Joshi', 'Sneha Rao', 'Aditya Verma', 'Pooja Reddy', 'Deepak Gupta',
    ];
    const job2Certs: Certificate[] = djangoNames.map((name, idx) => {
      const cid = `c2-1111-2222-3333-5555555555${String(idx + 1).padStart(2, '0')}`;
      const cert: Certificate = {
        id: cid,
        job_id: job2Id,
        recipient_name: name,
        recipient_email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        status: 'GENERATED',
        file_path: `/api/certificates/${cid}`,
        created_at: new Date(now - 7 * 86400000).toISOString(),
      };
      certificatesStore.set(cid, cert);
      return cert;
    });
    jobsStore.set(job2Id, {
      id: job2Id,
      event_name: 'Django Bootcamp',
      event_date: '01 Oct 2026',
      organization: 'Aereo Learning',
      description: 'Intensive weekend bootcamp on building scalable web apps with Django & REST API.',
      total_recipients: 10,
      successful_count: 10,
      failed_count: 0,
      status: 'COMPLETED',
      created_at: new Date(now - 7 * 86400000).toISOString(),
      completed_at: new Date(now - 7 * 86400000 + 300000).toISOString(),
      certificates: job2Certs,
    });

    // Job 3: Web Development
    const job3Id = 'c9d0e1f2-3333-4444-5555-666666666666';
    const job3Certs: Certificate[] = Array.from({ length: 25 }, (_, i) => {
      const idx = i + 1;
      const cid = `c3-1111-2222-3333-6666666666${String(idx).padStart(2, '0')}`;
      const cert: Certificate = {
        id: cid,
        job_id: job3Id,
        recipient_name: `Web Dev Student ${idx}`,
        recipient_email: `student${idx}@example.com`,
        status: 'GENERATED',
        file_path: `/api/certificates/${cid}`,
        created_at: new Date(now - 13 * 86400000).toISOString(),
      };
      certificatesStore.set(cid, cert);
      return cert;
    });
    jobsStore.set(job3Id, {
      id: job3Id,
      event_name: 'Web Development',
      event_date: '25 Sep 2026',
      organization: 'Aereo Learning',
      description: 'Frontend and Backend foundation program.',
      total_recipients: 25,
      successful_count: 25,
      failed_count: 0,
      status: 'COMPLETED',
      created_at: new Date(now - 13 * 86400000).toISOString(),
      completed_at: new Date(now - 13 * 86400000 + 600000).toISOString(),
      certificates: job3Certs,
    });
  }
}

seedInitialData();

function getOverallStats() {
  const jobs = Array.from(jobsStore.values());
  const totalJobs = jobs.length;
  const completedJobs = jobs.filter((j) => j.status === 'COMPLETED').length;
  const jobsWithErrors = jobs.filter(
    (j) => j.status === 'COMPLETED_WITH_ERRORS' || j.status === 'FAILED'
  ).length;
  const totalCertificates = Array.from(certificatesStore.values()).filter(
    (c) => c.status === 'GENERATED'
  ).length;

  return {
    total_jobs: totalJobs,
    total_certificates: totalCertificates,
    completed_jobs: completedJobs,
    jobs_with_errors: jobsWithErrors,
  };
}

function processJobInBackground(jobId: string) {
  const job = jobsStore.get(jobId);
  if (!job) return;

  job.status = 'PROCESSING';
  let idx = 0;
  let successCount = 0;
  let failCount = 0;

  const step = () => {
    const currentJob = jobsStore.get(jobId);
    if (!currentJob) return;

    if (idx >= currentJob.certificates.length) {
      if (failCount === 0 && successCount > 0) {
        currentJob.status = 'COMPLETED';
      } else if (successCount === 0 && failCount > 0) {
        currentJob.status = 'FAILED';
      } else if (successCount > 0 && failCount > 0) {
        currentJob.status = 'COMPLETED_WITH_ERRORS';
      } else {
        currentJob.status = 'COMPLETED';
      }
      currentJob.completed_at = new Date().toISOString();
      return;
    }

    const cert = currentJob.certificates[idx];
    const name = (cert.recipient_name || '').trim();
    const email = (cert.recipient_email || '').trim();

    if (!name) {
      cert.status = 'FAILED';
      cert.error_message = 'Recipient name cannot be empty.';
      failCount += 1;
    } else if (!validateEmailFormat(email)) {
      cert.status = 'FAILED';
      cert.error_message = `Invalid email format: '${email}'`;
      failCount += 1;
    } else {
      cert.status = 'GENERATED';
      cert.file_path = `/api/certificates/${cert.id}`;
      cert.error_message = undefined;
      successCount += 1;
    }

    certificatesStore.set(cert.id, cert);
    currentJob.successful_count = successCount;
    currentJob.failed_count = failCount;
    idx += 1;

    setTimeout(step, 300);
  };

  setTimeout(step, 250);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health & Stats
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', app: 'CertificateFlow API', version: '1.0.0' });
  });

  app.get('/api/stats', (_req, res) => {
    res.json(getOverallStats());
  });

  app.get('/api/jobs/stats', (_req, res) => {
    res.json(getOverallStats());
  });

  // Jobs Routes
  app.get(['/api/jobs', '/api/jobs/'], (req, res) => {
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const skip = parseInt((req.query.skip as string) || '0', 10) || 0;
    const limit = parseInt((req.query.limit as string) || '100', 10) || 100;

    let list = Array.from(jobsStore.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    if (status && status !== 'ALL') {
      list = list.filter((j) => j.status === status);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (j) =>
          j.event_name.toLowerCase().includes(q) ||
          j.organization.toLowerCase().includes(q) ||
          j.id.toLowerCase().includes(q)
      );
    }

    const sliced = list.slice(skip, skip + limit).map(({ certificates, ...jobSummary }) => jobSummary);
    res.json(sliced);
  });

  app.post(['/api/jobs', '/api/jobs/'], (req, res) => {
    const body = req.body || {};
    const recipients = Array.isArray(body.recipients) ? body.recipients : [];
    if (recipients.length === 0) {
      return res.status(400).json({ detail: 'At least one recipient is required.' });
    }

    const jobId = crypto.randomUUID();
    const now = new Date().toISOString();
    const certs: Certificate[] = recipients.map((r: { name?: string; email?: string }) => {
      const cid = crypto.randomUUID();
      const cert: Certificate = {
        id: cid,
        job_id: jobId,
        recipient_name: (r.name || '').trim(),
        recipient_email: (r.email || '').trim(),
        status: 'PENDING',
        created_at: now,
      };
      certificatesStore.set(cid, cert);
      return cert;
    });

    const newJob: JobDetail = {
      id: jobId,
      event_name: (body.event_name || 'Untitled Event').trim(),
      event_date: (body.event_date || new Date().toISOString().slice(0, 10)).trim(),
      organization: (body.organization || 'Aereo Learning').trim() || 'Aereo Learning',
      description: body.description ? String(body.description).trim() : undefined,
      template_id: body.template_id || undefined,
      total_recipients: certs.length,
      successful_count: 0,
      failed_count: 0,
      status: 'PENDING',
      created_at: now,
      certificates: certs,
    };

    jobsStore.set(jobId, newJob);
    processJobInBackground(jobId);

    const { certificates, ...jobResponse } = newJob;
    return res.status(201).json(jobResponse);
  });

  app.get('/api/jobs/:jobId', (req, res) => {
    const job = jobsStore.get(req.params.jobId);
    if (!job) {
      return res.status(404).json({ detail: 'Generation job not found.' });
    }
    return res.json(job);
  });

  app.get('/api/jobs/:jobId/certificates', (req, res) => {
    const job = jobsStore.get(req.params.jobId);
    if (!job) {
      return res.status(404).json({ detail: 'Generation job not found.' });
    }
    return res.json(job.certificates);
  });

  app.delete('/api/jobs/:jobId', (req, res) => {
    const job = jobsStore.get(req.params.jobId);
    if (!job) {
      return res.status(404).json({ detail: 'Generation job not found.' });
    }
    if (job.status === 'PROCESSING' || job.status === 'PENDING') {
      return res.status(400).json({
        detail:
          'Cannot delete a job that is currently pending or processing. Please wait for certificate generation to finish.',
      });
    }

    const certCount = job.certificates.length;
    for (const cert of job.certificates) {
      certificatesStore.delete(cert.id);
    }
    jobsStore.delete(job.id);

    return res.json({
      success: true,
      id: job.id,
      event_name: job.event_name,
      deleted_certificates: certCount,
      deleted_files: certCount,
    });
  });

  // Certificates Routes
  app.get('/api/certificates/:certificateId', (req, res) => {
    const cert = certificatesStore.get(req.params.certificateId);
    if (!cert) {
      return res.status(404).json({ detail: 'Certificate not found.' });
    }

    const download = req.query.download === 'true' || req.query.download === '1';
    const format = req.query.format as string | undefined;
    const accept = req.headers.accept || '';

    if (format === 'json' || (accept.includes('application/json') && !download)) {
      return res.json(cert);
    }

    const job = jobsStore.get(cert.job_id);
    const pdfBuffer = generateCertificatePdfBuffer({
      certificateId: cert.id,
      recipientName: cert.recipient_name,
      eventName: job?.event_name || 'Professional Program',
      eventDate: job?.event_date || '08 Oct 2026',
      organization: job?.organization || 'Aereo Learning',
    });

    const safeName = sanitizeFilename(cert.recipient_name);
    const filename = `Certificate_${safeName}.pdf`;
    const disposition = download ? 'attachment' : 'inline';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
    return res.send(pdfBuffer);
  });

  app.get('/api/certificates/:certificateId/download', (req, res) => {
    const cert = certificatesStore.get(req.params.certificateId);
    if (!cert) {
      return res.status(404).json({ detail: 'Certificate not found.' });
    }

    const job = jobsStore.get(cert.job_id);
    const pdfBuffer = generateCertificatePdfBuffer({
      certificateId: cert.id,
      recipientName: cert.recipient_name,
      eventName: job?.event_name || 'Professional Program',
      eventDate: job?.event_date || '08 Oct 2026',
      organization: job?.organization || 'Aereo Learning',
    });

    const safeName = sanitizeFilename(cert.recipient_name);
    const filename = `Certificate_${safeName}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(pdfBuffer);
  });

  // Templates Routes
  app.get(['/api/templates', '/api/templates/'], (req, res) => {
    const category = req.query.category as string | undefined;
    let list = Array.from(templatesStore.values());
    if (category && category !== 'All') {
      list = list.filter((t) => t.category.toLowerCase() === category.toLowerCase());
    }
    list.sort((a, b) => {
      if (a.is_system_template !== b.is_system_template) {
        return a.is_system_template ? -1 : 1;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    res.json(list);
  });

  app.get('/api/templates/:templateId', (req, res) => {
    const tpl = templatesStore.get(req.params.templateId);
    if (!tpl) {
      return res.status(404).json({ detail: 'Template not found.' });
    }
    return res.json(tpl);
  });

  app.post(['/api/templates', '/api/templates/'], (req, res) => {
    const body = req.body || {};
    const now = new Date().toISOString();
    const newTpl: Template = {
      id: body.id || `tpl-${crypto.randomUUID()}`,
      name: (body.name || 'Untitled Certificate').trim(),
      description: body.description ? String(body.description).trim() : 'Custom user created template',
      category: (body.category || 'Corporate').trim(),
      orientation: body.orientation || 'landscape',
      canvas_width: body.canvas_width || 800,
      canvas_height: body.canvas_height || 566,
      configuration: body.configuration || {
        background: '#FFFFFF',
        borderStyle: 'classic_gold',
        elements: [],
      },
      is_system_template: false,
      created_at: now,
      updated_at: now,
    };
    templatesStore.set(newTpl.id, newTpl);
    return res.status(201).json(newTpl);
  });

  app.put('/api/templates/:templateId', (req, res) => {
    const existing = templatesStore.get(req.params.templateId);
    if (!existing) {
      return res.status(404).json({ detail: 'Template not found.' });
    }
    const body = req.body || {};
    const updated: Template = {
      ...existing,
      name: body.name !== undefined ? String(body.name).trim() : existing.name,
      description:
        body.description !== undefined ? String(body.description).trim() : existing.description,
      category: body.category !== undefined ? String(body.category).trim() : existing.category,
      orientation: body.orientation !== undefined ? body.orientation : existing.orientation,
      configuration:
        body.configuration !== undefined ? body.configuration : existing.configuration,
      updated_at: new Date().toISOString(),
    };
    templatesStore.set(updated.id, updated);
    return res.json(updated);
  });

  app.delete('/api/templates/:templateId', (req, res) => {
    const tpl = templatesStore.get(req.params.templateId);
    if (!tpl) {
      return res.status(404).json({ detail: 'Template not found.' });
    }
    if (tpl.is_system_template) {
      return res.status(400).json({
        detail: 'Default system templates cannot be deleted directly. Duplicate it first.',
      });
    }
    templatesStore.delete(tpl.id);
    return res.json({
      status: 'success',
      message: `Template '${tpl.name}' deleted successfully.`,
    });
  });

  app.post('/api/templates/:templateId/duplicate', (req, res) => {
    const orig = templatesStore.get(req.params.templateId);
    if (!orig) {
      return res.status(404).json({ detail: 'Original template not found.' });
    }
    const now = new Date().toISOString();
    const dup: Template = {
      ...structuredClone(orig),
      id: `tpl-${crypto.randomUUID()}`,
      name: `${orig.name} Copy`,
      description: `Duplicate of ${orig.name}`,
      is_system_template: false,
      created_at: now,
      updated_at: now,
    };
    templatesStore.set(dup.id, dup);
    return res.status(201).json(dup);
  });

  app.post('/api/templates/:templateId/preview', (req, res) => {
    const tpl = templatesStore.get(req.params.templateId);
    if (!tpl) {
      return res.status(404).json({ detail: 'Template not found.' });
    }
    const pdfBuffer = generateCertificatePdfBuffer({
      certificateId: `preview_${tpl.id}`,
      recipientName: 'Matheesh Kumar',
      eventName: 'Python Workshop',
      eventDate: '08 October 2026',
      organization: 'Aereo Learning',
      issueDate: '08 October 2026',
    });
    const safeName = sanitizeFilename(tpl.name);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Preview_${safeName}.pdf"`);
    return res.send(pdfBuffer);
  });

  // Vite middleware in development, static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
