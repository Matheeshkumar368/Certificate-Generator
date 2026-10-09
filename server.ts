import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { INITIAL_SYSTEM_TEMPLATES } from './src/api/templates.ts';
import type { Template, JobDetail, Certificate, TemplateConfig } from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const STORAGE_DIR = path.join(__dirname, 'backend', 'storage');
export const CERTIFICATES_DIR = path.join(STORAGE_DIR, 'certificates');
export const DB_FILE_PATH = path.join(STORAGE_DIR, 'db.json');

fs.mkdirSync(CERTIFICATES_DIR, { recursive: true });

// Persistent stores backed by disk (backend/storage/db.json)
const templatesStore = new Map<string, Template>();
const jobsStore = new Map<string, JobDetail>();
const certificatesStore = new Map<string, Certificate>();

export function sanitizeFilename(name: string): string {
  return (
    (name || 'certificate')
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'certificate'
  );
}

export function validateEmailFormat(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(trimmed);
}

function escapePdfText(str: string): string {
  return (str || '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function hexToRgbFloats(hex: string, fallback: [number, number, number] = [0, 0, 0]): string {
  const clean = (hex || '').replace('#', '').trim();
  if (/^[0-9a-fA-F]{6}$/.test(clean)) {
    const r = parseInt(clean.slice(0, 2), 16) / 255;
    const g = parseInt(clean.slice(2, 4), 16) / 255;
    const b = parseInt(clean.slice(4, 6), 16) / 255;
    return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
  }
  return `${fallback[0].toFixed(3)} ${fallback[1].toFixed(3)} ${fallback[2].toFixed(3)}`;
}

function formatCertIdForPdf(rawId: string, format: 'full' | 'short' = 'full'): string {
  if (!rawId) return 'CERT-DEMO-001';
  if (format === 'short') {
    const clean = rawId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return `CERT-${clean.slice(0, 8)}`;
  }
  return rawId;
}

function resolvePdfPlaceholders(
  text: string,
  ctx: {
    recipientName: string;
    recipientEmail?: string;
    eventName: string;
    eventDate: string;
    organization: string;
    certificateId: string;
    issueDate: string;
  },
  idDisplayFormat?: 'full' | 'short'
): string {
  if (!text) return '';
  const formattedId = formatCertIdForPdf(ctx.certificateId, idDisplayFormat || 'full');
  return text
    .replace(/\{\{\s*recipient_name\s*\}\}/gi, ctx.recipientName || 'Matheesh Kumar')
    .replace(/\{\{\s*recipient_email\s*\}\}/gi, ctx.recipientEmail || 'matheesh@example.com')
    .replace(/\{\{\s*event_name\s*\}\}/gi, ctx.eventName || 'Python Workshop')
    .replace(/\{\{\s*event_date\s*\}\}/gi, ctx.eventDate || '08 October 2026')
    .replace(/\{\{\s*organization\s*\}\}/gi, ctx.organization || 'Aereo Learning')
    .replace(/\{\{\s*certificate_id\s*\}\}/gi, formattedId)
    .replace(/\{\{\s*issue_date\s*\}\}/gi, ctx.issueDate || ctx.eventDate || '08 October 2026');
}

function resolvePdfFontResource(
  fontFamily?: string,
  fontWeight?: 'normal' | 'bold',
  fontStyle?: 'normal' | 'italic'
): { fontKey: string; charWidthRatio: number } {
  const lower = (fontFamily || 'Helvetica').toLowerCase();
  const isBold = fontWeight === 'bold';
  const isItalic = fontStyle === 'italic';

  if (lower.includes('courier') || lower.includes('mono')) {
    return {
      fontKey: isBold ? '/F7' : '/F6',
      charWidthRatio: 0.6,
    };
  }
  if (lower.includes('times') || lower.includes('playfair') || lower.includes('cinzel')) {
    if (isBold && isItalic) return { fontKey: '/F8', charWidthRatio: 0.52 };
    if (isBold) return { fontKey: '/F5', charWidthRatio: 0.53 };
    if (isItalic) return { fontKey: '/F2', charWidthRatio: 0.5 };
    return { fontKey: '/F4', charWidthRatio: 0.5 };
  }
  // Default Helvetica
  if (isBold) return { fontKey: '/F1', charWidthRatio: 0.55 };
  return { fontKey: '/F3', charWidthRatio: 0.52 };
}

function wrapTextLinesForPdf(
  rawText: string,
  maxWidthPt: number,
  fontSizePt: number,
  charWidthRatio: number
): string[] {
  const paragraphs = (rawText || '').split(/\r?\n/);
  const lines: string[] = [];
  const avgCharPt = Math.max(3, fontSizePt * charWidthRatio);
  const maxCharsPerLine = Math.max(8, Math.floor(maxWidthPt / avgCharPt));

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) {
      lines.push('');
      continue;
    }
    const words = trimmed.split(/\s+/);
    let currentLine = '';
    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (candidate.length <= maxCharsPerLine || !currentLine) {
        currentLine = candidate;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  }
  return lines.length > 0 ? lines : [''];
}

function pdfCirclePathCommands(cx: number, cy: number, r: number): string[] {
  const k = 0.552284749831 * r;
  return [
    `${(cx + r).toFixed(2)} ${cy.toFixed(2)} m`,
    `${(cx + r).toFixed(2)} ${(cy + k).toFixed(2)} ${(cx + k).toFixed(2)} ${(cy + r).toFixed(2)} ${cx.toFixed(2)} ${(cy + r).toFixed(2)} c`,
    `${(cx - k).toFixed(2)} ${(cy + r).toFixed(2)} ${(cx - r).toFixed(2)} ${(cy + k).toFixed(2)} ${(cx - r).toFixed(2)} ${cy.toFixed(2)} c`,
    `${(cx - r).toFixed(2)} ${(cy - k).toFixed(2)} ${(cx - k).toFixed(2)} ${(cy - r).toFixed(2)} ${cx.toFixed(2)} ${(cy - r).toFixed(2)} c`,
    `${(cx + k).toFixed(2)} ${(cy - r).toFixed(2)} ${(cx + r).toFixed(2)} ${(cy - k).toFixed(2)} ${(cx + r).toFixed(2)} ${cy.toFixed(2)} c`,
  ];
}

/**
 * Generates a valid landscape PDF (792 x 612 pt) buffer using the canonical TemplateConfig
 * and writes it to backend/storage/certificates/certificate_<certificateId>.pdf
 */
export function generateCertificatePdfFile(params: {
  certificateId: string;
  recipientName: string;
  recipientEmail?: string;
  eventName: string;
  eventDate: string;
  organization: string;
  issueDate?: string;
  templateConfig?: TemplateConfig | null;
}): string {
  const {
    certificateId,
    recipientName,
    recipientEmail,
    eventName,
    eventDate,
    organization,
    issueDate = eventDate,
    templateConfig,
  } = params;

  const activeConfig: TemplateConfig =
    templateConfig && Array.isArray(templateConfig.elements) && templateConfig.elements.length > 0
      ? templateConfig
      : INITIAL_SYSTEM_TEMPLATES[0].configuration;

  const pageWidth = 792;
  const pageHeight = 612;
  const canvasWidth = activeConfig.canvas_width || 800;
  const canvasHeight = activeConfig.canvas_height || 566;
  const scaleX = pageWidth / canvasWidth;
  const scaleY = pageHeight / canvasHeight;

  const bgRgb = hexToRgbFloats(activeConfig.background || '#FCFBF9', [0.988, 0.984, 0.976]);
  const borderStyle = activeConfig.borderStyle || 'classic_gold';

  const borderCommands: string[] = [];
  if (borderStyle === 'modern_minimal') {
    borderCommands.push(
      '0.886 0.910 0.941 RG',
      '1 w',
      '25 25 742 562 re S',
      '0.051 0.580 0.533 rg',
      '25 25 10 562 re f'
    );
  } else if (borderStyle === 'corporate_blue') {
    borderCommands.push(
      '0.118 0.227 0.541 RG',
      '3 w',
      '24 24 744 564 re S',
      '0.576 0.773 0.992 RG',
      '1 w',
      '28 28 736 556 re S'
    );
  } else if (borderStyle === 'elegant_black') {
    borderCommands.push(
      '0.035 0.035 0.043 RG',
      '2.5 w',
      '24 24 744 564 re S',
      '0.443 0.443 0.478 RG',
      '0.8 w',
      '30 30 732 552 re S'
    );
  } else if (borderStyle === 'academic') {
    borderCommands.push(
      '0.471 0.208 0.059 RG',
      '3 w',
      '24 24 744 564 re S',
      '0.851 0.467 0.024 RG',
      '1 w',
      '29 29 734 554 re S'
    );
  } else if (borderStyle === 'creative_gradient') {
    borderCommands.push(
      '0.545 0.361 0.965 RG',
      '2.5 w',
      '22 22 748 568 re S',
      '0.925 0.282 0.600 RG',
      '1 w',
      '27 27 738 558 re S'
    );
  } else if (borderStyle === 'orange_modern') {
    borderCommands.push(
      '0.918 0.345 0.047 RG',
      '3 w',
      '22 22 748 568 re S',
      '0.992 0.729 0.455 RG',
      '1 w',
      '27 27 738 558 re S'
    );
  } else if (borderStyle !== 'none') {
    // classic_gold default
    borderCommands.push(
      '0.059 0.090 0.165 RG',
      '3 w',
      '22 22 748 568 re S',
      '0.851 0.467 0.024 RG',
      '1.5 w',
      '26 26 740 560 re S',
      '0.118 0.161 0.231 RG',
      '0.75 w',
      '30 30 732 552 re S'
    );
  }

  const streamLines: string[] = [
    // Background fill
    `${bgRgb} rg`,
    `0 0 ${pageWidth} ${pageHeight} re f`,
    ...borderCommands,
  ];

  const sortedElements = [...(activeConfig.elements || [])].sort(
    (a, b) => (a.zIndex || 1) - (b.zIndex || 1)
  );

  for (const el of sortedElements) {
    const elX = (el.x || 0) * scaleX;
    const elW = Math.max(10, (el.width || 100) * scaleX);
    const elH = Math.max(6, (el.height || 24) * scaleY);
    const elBottomY = pageHeight - ((el.y || 0) + (el.height || 24)) * scaleY;
    const elTopY = pageHeight - (el.y || 0) * scaleY;
    const elCenterY = (elBottomY + elTopY) / 2;

    const effectiveShapeType =
      el.type === 'line'
        ? 'line'
        : el.type === 'seal'
        ? 'seal'
        : el.shapeType || 'rectangle';

    if (el.type === 'shape' || el.type === 'line' || el.type === 'seal') {
      const fillRgb = hexToRgbFloats(el.fillColor || '#D97706', [0.851, 0.467, 0.024]);
      const strokeRgb = hexToRgbFloats(
        el.strokeColor || el.fillColor || '#B45309',
        [0.706, 0.325, 0.035]
      );
      const strokeW = Math.max(0.5, (el.strokeWidth ?? 1.5) * scaleY);

      if (effectiveShapeType === 'line') {
        streamLines.push(
          `${fillRgb} RG`,
          `${Math.max(1, (el.strokeWidth || 2) * scaleY).toFixed(2)} w`,
          `${elX.toFixed(2)} ${elCenterY.toFixed(2)} m ${(elX + elW).toFixed(2)} ${elCenterY.toFixed(2)} l S`
        );
      } else if (effectiveShapeType === 'seal') {
        const cx = elX + elW / 2;
        const cy = elCenterY;
        const rOuter = Math.min(elW, elH) / 2;
        const rInner = Math.max(4, rOuter * 0.82);
        streamLines.push(
          // Outer gold seal circle
          `${fillRgb} rg`,
          ...pdfCirclePathCommands(cx, cy, rOuter),
          'f',
          // Inner decorative ring
          `${strokeRgb} RG`,
          `${strokeW.toFixed(2)} w`,
          ...pdfCirclePathCommands(cx, cy, rInner),
          'S',
          // Seal label text
          'BT',
          '/F1 7 Tf',
          '0.271 0.102 0.012 rg',
          `1 0 0 1 ${(cx - 17).toFixed(2)} ${(cy - 2.5).toFixed(2)} Tm`,
          '(OFFICIAL) Tj',
          'ET'
        );
      } else if (effectiveShapeType === 'circle') {
        const cx = elX + elW / 2;
        const cy = elCenterY;
        const r = Math.min(elW, elH) / 2;
        streamLines.push(`${fillRgb} rg`, ...pdfCirclePathCommands(cx, cy, r), 'f');
        if ((el.strokeWidth ?? 0) > 0) {
          streamLines.push(
            `${strokeRgb} RG`,
            `${strokeW.toFixed(2)} w`,
            ...pdfCirclePathCommands(cx, cy, r),
            'S'
          );
        }
      } else {
        // rectangle
        streamLines.push(
          `${fillRgb} rg`,
          `${elX.toFixed(2)} ${elBottomY.toFixed(2)} ${elW.toFixed(2)} ${elH.toFixed(2)} re f`
        );
        if ((el.strokeWidth ?? 0) > 0) {
          streamLines.push(
            `${strokeRgb} RG`,
            `${strokeW.toFixed(2)} w`,
            `${elX.toFixed(2)} ${elBottomY.toFixed(2)} ${elW.toFixed(2)} ${elH.toFixed(2)} re S`
          );
        }
      }
      continue;
    }

    if (el.type === 'text' || el.type === 'signature') {
      const resolvedText = resolvePdfPlaceholders(
        el.text || (el.type === 'signature' ? 'Authorized Signatory' : ''),
        {
          recipientName,
          recipientEmail,
          eventName,
          eventDate,
          organization,
          certificateId,
          issueDate,
        },
        el.idDisplayFormat
      );

      const fontSizePt = Math.max(7, Math.round((el.fontSize || 14) * scaleY));
      const { fontKey, charWidthRatio } = resolvePdfFontResource(
        el.type === 'signature' ? 'Times-Roman' : el.fontFamily,
        el.fontWeight || (el.type === 'signature' ? 'bold' : 'normal'),
        el.type === 'signature' ? 'italic' : el.fontStyle
      );
      const colorRgb = hexToRgbFloats(
        el.color || (el.type === 'signature' ? '#1E3A8A' : '#0F172A'),
        [0.059, 0.09, 0.165]
      );
      const lines = wrapTextLinesForPdf(resolvedText, elW, fontSizePt, charWidthRatio);
      const lineStep = fontSizePt * (el.lineHeight || 1.25);
      const totalBlockHeight = lines.length * lineStep;
      const firstBaselineY =
        elCenterY + totalBlockHeight / 2 - fontSizePt * 0.82;

      for (let idx = 0; idx < lines.length; idx++) {
        const lineStr = lines[idx];
        const estLineW = lineStr.length * fontSizePt * charWidthRatio;
        let lineX = elX;
        const align = el.alignment || 'center';
        if (align === 'center') {
          lineX = elX + Math.max(0, (elW - estLineW) / 2);
        } else if (align === 'right') {
          lineX = elX + Math.max(0, elW - estLineW);
        }
        const lineY = firstBaselineY - idx * lineStep;
        streamLines.push(
          'BT',
          `${fontKey} ${fontSizePt} Tf`,
          `${colorRgb} rg`,
          `1 0 0 1 ${lineX.toFixed(2)} ${lineY.toFixed(2)} Tm`,
          `(${escapePdfText(lineStr)}) Tj`,
          'ET'
        );
      }

      if (el.type === 'signature') {
        const lineStartX = elX + elW * 0.1;
        const lineEndX = elX + elW * 0.9;
        const lineY = elBottomY + 2;
        streamLines.push(
          '0.580 0.639 0.722 RG',
          '0.8 w',
          `${lineStartX.toFixed(2)} ${lineY.toFixed(2)} m ${lineEndX.toFixed(2)} ${lineY.toFixed(2)} l S`
        );
      }
      continue;
    }

    if (el.type === 'image' || el.type === 'logo') {
      const labelText = el.label || el.type.toUpperCase();
      streamLines.push(
        '0.796 0.835 0.882 RG',
        '0.8 w',
        `${elX.toFixed(2)} ${elBottomY.toFixed(2)} ${elW.toFixed(2)} ${elH.toFixed(2)} re S`,
        'BT',
        '/F1 9 Tf',
        '0.278 0.333 0.412 rg',
        `1 0 0 1 ${(elX + 6).toFixed(2)} ${(elCenterY - 3).toFixed(2)} Tm`,
        `(${escapePdfText(labelText)}) Tj`,
        'ET'
      );
    }
  }

  const contentStream = streamLines.join('\n');
  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 792 612] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R /F4 8 0 R /F5 9 0 R /F6 10 0 R /F7 11 0 R /F8 12 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${Buffer.byteLength(contentStream, 'utf8')} >>\nstream\n${contentStream}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
    '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Times-Italic >>\nendobj\n',
    '7 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    '8 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>\nendobj\n',
    '9 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>\nendobj\n',
    '10 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n',
    '11 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>\nendobj\n',
    '12 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Times-BoldItalic >>\nendobj\n',
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

  const filename = `certificate_${certificateId}.pdf`;
  const absPath = path.join(CERTIFICATES_DIR, filename);
  fs.mkdirSync(CERTIFICATES_DIR, { recursive: true });
  fs.writeFileSync(absPath, Buffer.from(pdf, 'utf8'));

  return path.relative(__dirname, absPath);
}

/**
 * Ensures the PDF file for a certificate exists on disk and returns its absolute path.
 * Never overwrites or regenerates a certificate PDF if it already exists on disk.
 */
export function ensureCertificateFileOnDisk(cert: Certificate): string {
  const canonicalAbsPath = path.join(CERTIFICATES_DIR, `certificate_${cert.id}.pdf`);
  if (cert.file_path) {
    const resolved = path.isAbsolute(cert.file_path)
      ? cert.file_path
      : path.join(__dirname, cert.file_path);
    if (fs.existsSync(resolved) && fs.statSync(resolved).size > 0) {
      return resolved;
    }
  }
  if (fs.existsSync(canonicalAbsPath) && fs.statSync(canonicalAbsPath).size > 0) {
    cert.file_path = path.relative(__dirname, canonicalAbsPath);
    return canonicalAbsPath;
  }

  const job = jobsStore.get(cert.job_id);
  const tpl = job?.template_id ? templatesStore.get(job.template_id) : undefined;
  const activeConfig = job?.template_config || tpl?.configuration || null;
  const relPath = generateCertificatePdfFile({
    certificateId: cert.id,
    recipientName: cert.recipient_name,
    recipientEmail: cert.recipient_email,
    eventName: job?.event_name || 'Certificate Program',
    eventDate: job?.event_date || '08 Oct 2026',
    organization: job?.organization || 'Aereo Learning',
    templateConfig: activeConfig,
  });
  cert.file_path = relPath;
  certificatesStore.set(cert.id, cert);
  saveDbToDisk();
  return path.join(__dirname, relPath);
}

/**
 * Creates a standard PKZIP buffer containing multiple files.
 */
export function createZipArchive(entries: { filename: string; data: Buffer }[]): Buffer {
  const localFileBuffers: Buffer[] = [];
  const centralDirectoryBuffers: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.filename, 'utf8');
    const uncompressedData = entry.data;
    const compressedData = zlib.deflateRawSync(uncompressedData);
    const crc = zlib.crc32(uncompressedData) >>> 0;

    // Local File Header (30 bytes + filename)
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // signature
    localHeader.writeUInt16LE(20, 4); // version needed to extract (2.0)
    localHeader.writeUInt16LE(0, 6); // general purpose bit flag
    localHeader.writeUInt16LE(8, 8); // compression method: 8 (DEFLATE)
    localHeader.writeUInt16LE(0, 10); // mod time
    localHeader.writeUInt16LE(0x5421, 12); // mod date
    localHeader.writeUInt32LE(crc, 14); // crc-32
    localHeader.writeUInt32LE(compressedData.length, 18); // compressed size
    localHeader.writeUInt32LE(uncompressedData.length, 22); // uncompressed size
    localHeader.writeUInt16LE(nameBuf.length, 26); // filename length
    localHeader.writeUInt16LE(0, 28); // extra field length

    const localChunk = Buffer.concat([localHeader, nameBuf, compressedData]);
    localFileBuffers.push(localChunk);

    // Central Directory File Header (46 bytes + filename)
    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0); // signature
    centralHeader.writeUInt16LE(20, 4); // version made by
    centralHeader.writeUInt16LE(20, 6); // version needed
    centralHeader.writeUInt16LE(0, 8); // bit flag
    centralHeader.writeUInt16LE(8, 10); // compression method (DEFLATE)
    centralHeader.writeUInt16LE(0, 12); // mod time
    centralHeader.writeUInt16LE(0x5421, 14); // mod date
    centralHeader.writeUInt32LE(crc, 16); // crc-32
    centralHeader.writeUInt32LE(compressedData.length, 20); // compressed size
    centralHeader.writeUInt32LE(uncompressedData.length, 24); // uncompressed size
    centralHeader.writeUInt16LE(nameBuf.length, 28); // filename length
    centralHeader.writeUInt16LE(0, 30); // extra field length
    centralHeader.writeUInt16LE(0, 32); // file comment length
    centralHeader.writeUInt16LE(0, 34); // disk number start
    centralHeader.writeUInt16LE(0, 36); // internal file attributes
    centralHeader.writeUInt32LE(0, 38); // external file attributes
    centralHeader.writeUInt32LE(offset, 42); // relative offset of local header

    centralDirectoryBuffers.push(Buffer.concat([centralHeader, nameBuf]));
    offset += localChunk.length;
  }

  const centralDirBuffer = Buffer.concat(centralDirectoryBuffers);
  const endOfCentralDir = Buffer.alloc(22);
  endOfCentralDir.writeUInt32LE(0x06054b50, 0); // EOCD signature
  endOfCentralDir.writeUInt16LE(0, 4); // number of this disk
  endOfCentralDir.writeUInt16LE(0, 6); // disk where central directory starts
  endOfCentralDir.writeUInt16LE(entries.length, 8); // total entries on this disk
  endOfCentralDir.writeUInt16LE(entries.length, 10); // total entries
  endOfCentralDir.writeUInt32LE(centralDirBuffer.length, 12); // size of central directory
  endOfCentralDir.writeUInt32LE(offset, 16); // offset of start of central directory
  endOfCentralDir.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([...localFileBuffers, centralDirBuffer, endOfCentralDir]);
}

function saveDbToDisk() {
  try {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
    const data = {
      templates: Array.from(templatesStore.values()),
      jobs: Array.from(jobsStore.values()),
    };
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to persist db.json:', err);
  }
}

function loadOrSeedDb() {
  for (const tpl of INITIAL_SYSTEM_TEMPLATES) {
    templatesStore.set(tpl.id, structuredClone(tpl));
  }

  if (fs.existsSync(DB_FILE_PATH)) {
    try {
      const raw = JSON.parse(fs.readFileSync(DB_FILE_PATH, 'utf8'));
      if (Array.isArray(raw.templates)) {
        for (const t of raw.templates) {
          templatesStore.set(t.id, t);
        }
      }
      if (Array.isArray(raw.jobs) && raw.jobs.length > 0) {
        for (const j of raw.jobs as JobDetail[]) {
          jobsStore.set(j.id, j);
          for (const c of j.certificates || []) {
            certificatesStore.set(c.id, c);
            if (c.status === 'GENERATED') {
              const absPath = path.join(CERTIFICATES_DIR, `certificate_${c.id}.pdf`);
              if (!fs.existsSync(absPath)) {
                c.file_path = generateCertificatePdfFile({
                  certificateId: c.id,
                  recipientName: c.recipient_name,
                  recipientEmail: c.recipient_email,
                  eventName: j.event_name,
                  eventDate: j.event_date,
                  organization: j.organization,
                });
              }
            }
          }
        }
        return;
      }
    } catch (err) {
      console.warn('Could not load db.json, seeding fresh data:', err);
    }
  }

  const now = Date.now();

  // Seed Demo Job 1: Python Workshop (3 recipients, 2 success, 1 fail)
  const job1Id = 'f1a2b3c4-1111-2222-3333-444444444444';
  const job1Certs: Certificate[] = [
    {
      id: 'c1-1111-2222-3333-444444444441',
      job_id: job1Id,
      recipient_name: 'Matheesh Kumar',
      recipient_email: 'matheesh@example.com',
      status: 'GENERATED',
      created_at: new Date(now - 2 * 3600000).toISOString(),
    },
    {
      id: 'c1-1111-2222-3333-444444444442',
      job_id: job1Id,
      recipient_name: 'Rahul Kumar',
      recipient_email: 'rahul@example.com',
      status: 'GENERATED',
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
  for (const c of job1Certs) {
    if (c.status === 'GENERATED') {
      c.file_path = generateCertificatePdfFile({
        certificateId: c.id,
        recipientName: c.recipient_name,
        recipientEmail: c.recipient_email,
        eventName: 'Python Workshop',
        eventDate: '08 Oct 2026',
        organization: 'Aereo Learning',
      });
    }
    certificatesStore.set(c.id, c);
  }
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

  // Seed Demo Job 2: Django Bootcamp (10 recipients, 10 success)
  const job2Id = 'a7d8e9f0-2222-3333-4444-555555555555';
  const djangoNames = [
    'Aarav Sharma',
    'Priya Patel',
    'Kavya Nair',
    'Vikram Malhotra',
    'Ananya Roy',
    'Rohan Joshi',
    'Sneha Rao',
    'Aditya Verma',
    'Pooja Reddy',
    'Deepak Gupta',
  ];
  const job2Certs: Certificate[] = djangoNames.map((name, idx) => {
    const cid = `c2-1111-2222-3333-5555555555${String(idx + 1).padStart(2, '0')}`;
    const filePath = generateCertificatePdfFile({
      certificateId: cid,
      recipientName: name,
      recipientEmail: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      eventName: 'Django Bootcamp',
      eventDate: '01 Oct 2026',
      organization: 'Aereo Learning',
    });
    const cert: Certificate = {
      id: cid,
      job_id: job2Id,
      recipient_name: name,
      recipient_email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      status: 'GENERATED',
      file_path: filePath,
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

  // Seed Demo Job 3: Web Development (25 recipients, 25 success)
  const job3Id = 'c9d0e1f2-3333-4444-5555-666666666666';
  const job3Certs: Certificate[] = Array.from({ length: 25 }, (_, i) => {
    const idx = i + 1;
    const cid = `c3-1111-2222-3333-6666666666${String(idx).padStart(2, '0')}`;
    const name = `Web Dev Student ${idx}`;
    const email = `student${idx}@example.com`;
    const filePath = generateCertificatePdfFile({
      certificateId: cid,
      recipientName: name,
      recipientEmail: email,
      eventName: 'Web Development',
      eventDate: '25 Sep 2026',
      organization: 'Aereo Learning',
    });
    const cert: Certificate = {
      id: cid,
      job_id: job3Id,
      recipient_name: name,
      recipient_email: email,
      status: 'GENERATED',
      file_path: filePath,
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

  saveDbToDisk();
}

loadOrSeedDb();

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
  const tpl = job.template_id ? templatesStore.get(job.template_id) : undefined;
  const activeTemplateConfig = job.template_config || tpl?.configuration || INITIAL_SYSTEM_TEMPLATES[0].configuration;
  job.template_config = structuredClone(activeTemplateConfig);
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
      saveDbToDisk();
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
      try {
        const relPath = generateCertificatePdfFile({
          certificateId: cert.id,
          recipientName: name,
          recipientEmail: email,
          eventName: currentJob.event_name,
          eventDate: currentJob.event_date,
          organization: currentJob.organization,
          templateConfig: currentJob.template_config || activeTemplateConfig,
        });
        cert.status = 'GENERATED';
        cert.file_path = relPath;
        cert.error_message = undefined;
        successCount += 1;
      } catch (err: any) {
        cert.status = 'FAILED';
        cert.error_message = `Generation error: ${err?.message || String(err)}`;
        failCount += 1;
      }
    }

    certificatesStore.set(cert.id, cert);
    currentJob.successful_count = successCount;
    currentJob.failed_count = failCount;
    saveDbToDisk();
    idx += 1;

    setTimeout(step, 250);
  };

  setTimeout(step, 150);
}

export function createApp() {
  const app = express();
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

  // Sync endpoint to import any client-side cached jobs into backend storage & generate missing PDFs
  app.post('/api/jobs/sync', (req, res) => {
    const incomingJobs: JobDetail[] = Array.isArray(req.body?.jobs)
      ? req.body.jobs
      : req.body?.job
      ? [req.body.job]
      : [];

    let syncedCount = 0;
    for (const j of incomingJobs) {
      if (!j || !j.id || jobsStore.has(j.id)) continue;
      const tpl = j.template_id ? templatesStore.get(j.template_id) : undefined;
      const activeConfig = j.template_config || tpl?.configuration || INITIAL_SYSTEM_TEMPLATES[0].configuration;
      let successCount = 0;
      let failCount = 0;
      const certs: Certificate[] = (j.certificates || []).map((c) => {
        const name = (c.recipient_name || '').trim();
        const email = (c.recipient_email || '').trim();
        const certCopy: Certificate = {
          ...c,
          job_id: j.id,
          recipient_name: name,
          recipient_email: email,
        };
        if (!name) {
          certCopy.status = 'FAILED';
          certCopy.error_message = 'Recipient name cannot be empty.';
          failCount++;
        } else if (!validateEmailFormat(email)) {
          certCopy.status = 'FAILED';
          certCopy.error_message = `Invalid email format: '${email}'`;
          failCount++;
        } else {
          certCopy.status = 'GENERATED';
          certCopy.file_path = generateCertificatePdfFile({
            certificateId: certCopy.id,
            recipientName: name,
            recipientEmail: email,
            eventName: j.event_name || 'Certificate Event',
            eventDate: j.event_date || '08 Oct 2026',
            organization: j.organization || 'Aereo Learning',
            templateConfig: activeConfig,
          });
          successCount++;
        }
        certificatesStore.set(certCopy.id, certCopy);
        return certCopy;
      });

      const finalStatus: JobDetail['status'] =
        failCount === 0 && successCount > 0
          ? 'COMPLETED'
          : successCount === 0 && failCount > 0
          ? 'FAILED'
          : 'COMPLETED_WITH_ERRORS';

      jobsStore.set(j.id, {
        ...j,
        template_config: structuredClone(activeConfig),
        total_recipients: certs.length,
        successful_count: successCount,
        failed_count: failCount,
        status: finalStatus,
        completed_at: j.completed_at || new Date().toISOString(),
        certificates: certs,
      });
      syncedCount++;
    }

    if (syncedCount > 0) {
      saveDbToDisk();
    }
    res.json({ synced: syncedCount });
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

    const sliced = list.slice(skip, skip + limit).map(({ certificates, template_config, ...jobSummary }) => jobSummary);
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
    const selectedTpl = body.template_id ? templatesStore.get(body.template_id) : undefined;
    const snapshotConfig = structuredClone(
      selectedTpl?.configuration || INITIAL_SYSTEM_TEMPLATES[0].configuration
    );

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
      template_id: body.template_id || INITIAL_SYSTEM_TEMPLATES[0].id,
      template_config: snapshotConfig,
      total_recipients: certs.length,
      successful_count: 0,
      failed_count: 0,
      status: 'PENDING',
      created_at: now,
      certificates: certs,
    };

    jobsStore.set(jobId, newJob);
    saveDbToDisk();
    processJobInBackground(jobId);

    const { certificates, template_config, ...jobResponse } = newJob;
    return res.status(201).json(jobResponse);
  });

  app.get('/api/jobs/:jobId', (req, res) => {
    const job = jobsStore.get(req.params.jobId);
    if (!job) {
      return res.status(404).json({ detail: 'Generation job not found.' });
    }
    const tpl = job.template_id ? templatesStore.get(job.template_id) : undefined;
    return res.json({
      ...job,
      template_config:
        job.template_config || tpl?.configuration || INITIAL_SYSTEM_TEMPLATES[0].configuration,
    });
  });

  app.get('/api/jobs/:jobId/certificates', (req, res) => {
    const job = jobsStore.get(req.params.jobId);
    if (!job) {
      return res.status(404).json({ detail: 'Generation job not found.' });
    }
    return res.json(job.certificates);
  });

  // Download All (ZIP) endpoint for a Job
  app.get(
    ['/api/jobs/:jobId/download-zip', '/api/jobs/:jobId/download', '/api/jobs/:jobId/certificates/zip'],
    (req, res) => {
      const job = jobsStore.get(req.params.jobId);
      if (!job) {
        return res.status(404).json({ detail: 'Generation job not found.' });
      }

      const generatedCerts = job.certificates.filter((c) => c.status === 'GENERATED');
      if (generatedCerts.length === 0) {
        return res.status(400).json({
          detail: 'No generated certificates are available to download for this job.',
        });
      }

      const usedNames = new Map<string, number>();
      const zipEntries: { filename: string; data: Buffer }[] = [];

      for (const cert of generatedCerts) {
        const absPath = ensureCertificateFileOnDisk(cert);
        if (!fs.existsSync(absPath)) {
          continue;
        }
        const pdfData = fs.readFileSync(absPath);
        const baseSafe = sanitizeFilename(cert.recipient_name);
        const count = usedNames.get(baseSafe) || 0;
        usedNames.set(baseSafe, count + 1);
        const entryFilename =
          count === 0
            ? `Certificate_${baseSafe}.pdf`
            : `Certificate_${baseSafe}_${count + 1}.pdf`;
        zipEntries.push({ filename: entryFilename, data: pdfData });
      }

      if (zipEntries.length === 0) {
        return res.status(404).json({ detail: 'Generated PDF files could not be found on disk.' });
      }

      const zipBuffer = createZipArchive(zipEntries);
      const safeEvent = sanitizeFilename(job.event_name);
      const zipFilename = `Certificates_${safeEvent}.zip`;

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);
      res.setHeader('Content-Length', String(zipBuffer.length));
      return res.send(zipBuffer);
    }
  );

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

    let deletedFiles = 0;
    const certCount = job.certificates.length;
    for (const cert of job.certificates) {
      const candidatePath = path.join(CERTIFICATES_DIR, `certificate_${cert.id}.pdf`);
      try {
        if (fs.existsSync(candidatePath)) {
          fs.unlinkSync(candidatePath);
          deletedFiles++;
        }
      } catch (err) {
        console.warn(`Failed to remove certificate file ${candidatePath}:`, err);
      }
      certificatesStore.delete(cert.id);
    }
    jobsStore.delete(job.id);
    saveDbToDisk();

    return res.json({
      success: true,
      id: job.id,
      event_name: job.event_name,
      deleted_certificates: certCount,
      deleted_files: deletedFiles,
    });
  });

  // Certificates Routes
  const sendCertificatePdfResponse = (
    cert: Certificate,
    res: express.Response,
    disposition: 'inline' | 'attachment'
  ) => {
    if (cert.status !== 'GENERATED') {
      return res.status(400).json({
        detail: cert.error_message || `Certificate is in '${cert.status}' status and has no PDF file.`,
      });
    }

    const absPath = ensureCertificateFileOnDisk(cert);
    if (!fs.existsSync(absPath)) {
      return res.status(404).json({ detail: 'Certificate PDF file not found on disk.' });
    }

    const pdfBuffer = fs.readFileSync(absPath);
    const safeName = sanitizeFilename(cert.recipient_name);
    const filename = `Certificate_${safeName}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
    res.setHeader('Content-Length', String(pdfBuffer.length));
    return res.send(pdfBuffer);
  };

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

    return sendCertificatePdfResponse(cert, res, download ? 'attachment' : 'inline');
  });

  app.get('/api/certificates/:certificateId/download', (req, res) => {
    const cert = certificatesStore.get(req.params.certificateId);
    if (!cert) {
      return res.status(404).json({ detail: 'Certificate not found.' });
    }
    return sendCertificatePdfResponse(cert, res, 'attachment');
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
    saveDbToDisk();
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
    saveDbToDisk();
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
    saveDbToDisk();
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
    saveDbToDisk();
    return res.status(201).json(dup);
  });

  app.post('/api/templates/:templateId/preview', (req, res) => {
    const tpl = templatesStore.get(req.params.templateId);
    if (!tpl) {
      return res.status(404).json({ detail: 'Template not found.' });
    }
    const relPath = generateCertificatePdfFile({
      certificateId: `preview_${tpl.id}`,
      recipientName: 'Matheesh Kumar',
      eventName: 'Python Workshop',
      eventDate: '08 October 2026',
      organization: 'Aereo Learning',
      issueDate: '08 October 2026',
      templateConfig: tpl.configuration,
    });
    const absPath = path.join(__dirname, relPath);
    const pdfBuffer = fs.readFileSync(absPath);
    const safeName = sanitizeFilename(tpl.name);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Preview_${safeName}.pdf"`);
    res.setHeader('Content-Length', String(pdfBuffer.length));
    return res.send(pdfBuffer);
  });

  return app;
}

async function startServer() {
  const app = createApp();
  const PORT = 3000;

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

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
