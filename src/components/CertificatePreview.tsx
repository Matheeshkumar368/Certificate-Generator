import React, { useRef, useState } from 'react';
import { X, Download, Printer, Award, AlertCircle, Loader2 } from 'lucide-react';
import { Certificate, TemplateConfig } from '../types';
import { downloadCertificatePdf } from '../api/certificates';
import { INITIAL_SYSTEM_TEMPLATES } from '../api/templates';
import { TemplateCanvas } from './TemplateCanvas';

interface CertificatePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: Certificate | null;
  eventName: string;
  eventDate: string;
  organization?: string;
  templateConfig?: TemplateConfig;
}

export const CertificatePreview: React.FC<CertificatePreviewProps> = ({
  isOpen,
  onClose,
  certificate,
  eventName,
  eventDate,
  organization = 'Aereo Learning',
  templateConfig,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  if (!isOpen || !certificate) return null;

  const activeConfig: TemplateConfig =
    templateConfig && templateConfig.elements && templateConfig.elements.length > 0
      ? templateConfig
      : INITIAL_SYSTEM_TEMPLATES[0].configuration;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadCertificatePdf(certificate);
    } catch (err: any) {
      setDownloadError(err?.message || 'Failed to download certificate PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-800/90 border-b border-slate-700/60 text-slate-200">
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-semibold tracking-tight text-white truncate max-w-xs sm:max-w-md">
              Certificate_{certificate.recipient_name.replace(/\s+/g, '_')}.pdf
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-mono bg-slate-700 text-slate-300">
              ID: {certificate.id.slice(0, 8)}...
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Print Certificate"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{downloading ? 'Downloading...' : 'Download PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Visible Error Banner if download fails */}
        {downloadError && (
          <div className="px-5 py-2.5 bg-rose-950/90 border-b border-rose-800 text-rose-200 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{downloadError}</span>
            </div>
            <button
              onClick={() => setDownloadError(null)}
              className="text-rose-300 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Canonical Certificate Display Canvas */}
        <div
          ref={printRef}
          className="p-4 sm:p-8 overflow-auto bg-slate-950 flex items-center justify-center flex-1"
        >
          <div className="flex items-center justify-center">
            <TemplateCanvas
              config={activeConfig}
              isPreviewMode={true}
              zoom={1}
              sampleContext={{
                recipient_name: certificate.recipient_name,
                recipient_email: certificate.recipient_email,
                event_name: eventName,
                event_date: eventDate,
                organization,
                certificate_id: certificate.id,
                issue_date: eventDate,
              }}
            />
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="p-3.5 bg-slate-800/90 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
          <span>
            Canonical template preview • Certificate ID:{' '}
            <code className="text-slate-300 font-mono">{certificate.id}</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
          >
            Back to Job
          </button>
        </div>
      </div>
    </div>
  );
};
