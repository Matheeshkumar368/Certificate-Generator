import { apiClient } from './client';
import { Certificate } from '../types';
import { syncLocalJobsToBackend } from './jobs';

export const getJobCertificates = async (jobId: string): Promise<Certificate[]> => {
  const response = await apiClient.get<Certificate[]>(`/jobs/${jobId}/certificates`);
  return response.data;
};

export const getCertificatePdfUrl = (certificateId: string, download = false): string => {
  const base = apiClient.defaults.baseURL || '/api';
  return download
    ? `${base}/certificates/${certificateId}/download`
    : `${base}/certificates/${certificateId}`;
};

const sanitizeDownloadFilename = (name: string): string => {
  return (
    (name || 'certificate')
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'certificate'
  );
};

const extractBlobErrorMessage = async (err: any, fallbackMessage: string): Promise<string> => {
  if (err?.response?.data instanceof Blob) {
    try {
      const text = await err.response.data.text();
      const parsed = JSON.parse(text);
      if (parsed?.detail) return String(parsed.detail);
      if (parsed?.error) return String(parsed.error);
      if (text.trim()) return text.trim();
    } catch {
      // Ignore JSON parse errors on blob
    }
  }
  if (err?.response?.data?.detail) {
    return String(err.response.data.detail);
  }
  if (err?.response?.status) {
    return `HTTP ${err.response.status}: ${err.response.statusText || fallbackMessage}`;
  }
  if (err?.message) {
    return `Network error: ${err.message}`;
  }
  return fallbackMessage;
};

/**
 * Downloads a single generated certificate PDF from the backend `/api/certificates/{id}/download`
 * endpoint as a Blob and triggers a browser `.pdf` file download.
 * Throws a descriptive error if the certificate or PDF file is missing or on network failure.
 */
export const downloadCertificatePdf = async (cert: Certificate): Promise<void> => {
  if (!cert?.id) {
    throw new Error('Certificate ID is missing.');
  }

  let response;
  try {
    response = await apiClient.get<Blob>(`/certificates/${cert.id}/download`, {
      responseType: 'blob',
    });
  } catch (err: any) {
    if (err?.response?.status === 404) {
      await syncLocalJobsToBackend();
      try {
        response = await apiClient.get<Blob>(`/certificates/${cert.id}/download`, {
          responseType: 'blob',
        });
      } catch (retryErr: any) {
        const message = await extractBlobErrorMessage(
          retryErr,
          `Certificate PDF (${cert.id}) could not be downloaded.`
        );
        throw new Error(message);
      }
    } else {
      const message = await extractBlobErrorMessage(
        err,
        `Certificate PDF (${cert.id}) could not be downloaded.`
      );
      throw new Error(message);
    }
  }

  const blob = response.data;
  if (!blob || blob.size === 0) {
    throw new Error('Server returned an empty PDF file.');
  }

  const contentType = String(response.headers?.['content-type'] || blob.type || '').toLowerCase();
  if (contentType.includes('application/json')) {
    const text = await blob.text();
    let detail = 'Failed to download PDF.';
    try {
      const json = JSON.parse(text);
      if (json?.detail) detail = json.detail;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }

  const pdfBlob = new Blob([blob], { type: 'application/pdf' });
  const safeName = sanitizeDownloadFilename(cert.recipient_name);
  const filename = `Certificate_${safeName}.pdf`;

  const blobUrl = URL.createObjectURL(pdfBlob);
  try {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  }
};

/**
 * Downloads all generated certificates for a job as a single `.zip` archive
 * from the backend `/api/jobs/{jobId}/download-zip` endpoint.
 */
export const downloadJobCertificatesZip = async (
  jobId: string,
  eventName = 'Event'
): Promise<void> => {
  if (!jobId) {
    throw new Error('Job ID is missing.');
  }

  let response;
  try {
    response = await apiClient.get<Blob>(`/jobs/${jobId}/download-zip`, {
      responseType: 'blob',
    });
  } catch (err: any) {
    if (err?.response?.status === 404) {
      await syncLocalJobsToBackend();
      try {
        response = await apiClient.get<Blob>(`/jobs/${jobId}/download-zip`, {
          responseType: 'blob',
        });
      } catch (retryErr: any) {
        const message = await extractBlobErrorMessage(
          retryErr,
          'Failed to download ZIP archive for this job.'
        );
        throw new Error(message);
      }
    } else {
      const message = await extractBlobErrorMessage(
        err,
        'Failed to download ZIP archive for this job.'
      );
      throw new Error(message);
    }
  }

  const blob = response.data;
  if (!blob || blob.size === 0) {
    throw new Error('Server returned an empty ZIP archive.');
  }

  const contentType = String(response.headers?.['content-type'] || blob.type || '').toLowerCase();
  if (contentType.includes('application/json')) {
    const text = await blob.text();
    let detail = 'Failed to download ZIP archive.';
    try {
      const json = JSON.parse(text);
      if (json?.detail) detail = json.detail;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }

  const zipBlob = new Blob([blob], { type: 'application/zip' });
  const safeEvent = sanitizeDownloadFilename(eventName);
  const filename = `Certificates_${safeEvent}.zip`;

  const blobUrl = URL.createObjectURL(zipBlob);
  try {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  }
};

/**
 * Downloads a template preview PDF from `/api/templates/{templateId}/preview`.
 */
export const downloadTemplatePreviewPdf = async (
  templateId: string,
  templateName = 'Template'
): Promise<void> => {
  try {
    const response = await apiClient.post<Blob>(
      `/templates/${templateId}/preview`,
      {},
      { responseType: 'blob' }
    );
    const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
    const safeName = sanitizeDownloadFilename(templateName);
    const blobUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `Preview_${safeName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch (err: any) {
    const message = await extractBlobErrorMessage(err, 'Failed to download template preview PDF.');
    throw new Error(message);
  }
};

export const downloadClientGeneratedPdf = downloadCertificatePdf;
