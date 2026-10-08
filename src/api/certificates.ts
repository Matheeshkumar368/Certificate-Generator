import { apiClient } from './client';
import { Certificate } from '../types';

export const getJobCertificates = async (jobId: string): Promise<Certificate[]> => {
  try {
    const response = await apiClient.get<Certificate[]>(`/jobs/${jobId}/certificates`);
    return response.data;
  } catch {
    return [];
  }
};

export const getCertificatePdfUrl = (certificateId: string, download = false): string => {
  const base = apiClient.defaults.baseURL || '/api';
  return `${base}/certificates/${certificateId}${download ? '?download=true' : ''}`;
};

export const downloadClientGeneratedPdf = (
  cert: Certificate,
  eventName: string,
  eventDate: string,
  organization: string = 'Aereo Learning'
) => {
  // Render high-res canvas and download
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 1131; // ~1.414 landscape proportion
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = '#FCFBF9';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Borders
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 14;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 4;
  ctx.strokeRect(55, 55, canvas.width - 110, canvas.height - 110);

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(66, 66, canvas.width - 132, canvas.height - 132);

  // Header
  ctx.fillStyle = '#1E293B';
  ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(organization.toUpperCase(), canvas.width / 2, 220);

  // Line
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - 240, 250);
  ctx.lineTo(canvas.width / 2 + 240, 250);
  ctx.stroke();

  // Title
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 54px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('CERTIFICATE OF PARTICIPATION', canvas.width / 2, 340);

  // Statement
  ctx.fillStyle = '#475569';
  ctx.font = 'italic 28px Georgia, serif';
  ctx.fillText('This is proudly presented to certify that', canvas.width / 2, 420);

  // Recipient Name
  ctx.fillStyle = '#1E1B4B';
  ctx.font = 'bold 64px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(cert.recipient_name, canvas.width / 2, 530);

  // Underline
  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - 280, 560);
  ctx.lineTo(canvas.width / 2 + 280, 560);
  ctx.stroke();

  // Event info
  ctx.fillStyle = '#475569';
  ctx.font = 'italic 28px Georgia, serif';
  ctx.fillText('has successfully participated in the program', canvas.width / 2, 640);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 44px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(eventName, canvas.width / 2, 715);

  ctx.fillStyle = '#64748B';
  ctx.font = '24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`conducted on ${eventDate}`, canvas.width / 2, 770);

  // Bottom Left
  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('CERTIFICATE ID', 140, 930);
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 20px monospace';
  ctx.fillText(cert.id, 140, 965);

  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('ISSUE DATE', 140, 1015);
  ctx.fillStyle = '#0F172A';
  ctx.font = '20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(eventDate, 140, 1045);

  // Bottom Right (Signature)
  ctx.textAlign = 'center';
  const sigX = canvas.width - 280;
  // Signature stroke
  ctx.strokeStyle = '#1E3A8A';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(sigX - 90, 950);
  ctx.bezierCurveTo(sigX - 40, 920, sigX - 10, 990, sigX + 10, 940);
  ctx.bezierCurveTo(sigX + 30, 910, sigX + 60, 960, sigX + 90, 935);
  ctx.stroke();

  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sigX - 120, 980);
  ctx.lineTo(sigX + 120, 980);
  ctx.stroke();

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Authorized Signatory', sigX, 1015);
  ctx.fillStyle = '#64748B';
  ctx.font = '18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(organization, sigX, 1045);

  // Convert to image and trigger download
  const image = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = image;
  const safeName = cert.recipient_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  a.download = `Certificate_${safeName}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
