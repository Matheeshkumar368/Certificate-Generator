import React, { useState } from 'react';
import { Eye, Download, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Certificate } from '../types';
import { StatusBadge } from './StatusBadge';
import { formatDateTime } from '../utils/formatters';
import { downloadClientGeneratedPdf, getCertificatePdfUrl } from '../api/certificates';

interface CertificateTableProps {
  certificates: Certificate[];
  eventName: string;
  eventDate: string;
  organization: string;
  onPreview: (certificate: Certificate) => void;
}

export const CertificateTable: React.FC<CertificateTableProps> = ({
  certificates,
  eventName,
  eventDate,
  organization,
  onPreview,
}) => {
  const [selectedError, setSelectedError] = useState<{ name: string; error: string } | null>(null);

  const handleDownload = (cert: Certificate) => {
    // Attempt backend download; also trigger vector PNG/PDF download fallback
    const downloadUrl = getCertificatePdfUrl(cert.id, true);
    const win = window.open(downloadUrl, '_blank');
    if (!win) {
      downloadClientGeneratedPdf(cert, eventName, eventDate, organization);
    }
  };

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Generated On</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {certificates.map((cert, index) => (
              <tr
                key={cert.id}
                className="hover:bg-slate-50/60 transition-colors"
              >
                <td className="py-3 px-4 text-center text-xs font-mono text-slate-400">
                  {index + 1}
                </td>
                <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                  {cert.recipient_name}
                </td>
                <td className="py-3 px-4 text-slate-600 font-mono text-xs whitespace-nowrap">
                  {cert.recipient_email}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <StatusBadge status={cert.status} />
                </td>
                <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                  {cert.status === 'GENERATED' ? formatDateTime(cert.created_at) : '—'}
                </td>
                <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                  {cert.status === 'GENERATED' ? (
                    <>
                      <button
                        onClick={() => onPreview(cert)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => handleDownload(cert)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </>
                  ) : cert.status === 'FAILED' ? (
                    <button
                      onClick={() =>
                        setSelectedError({
                          name: cert.recipient_name,
                          error: cert.error_message || 'Validation error: invalid email format.',
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>View Error</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Processing...</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Error Details Modal */}
      {selectedError && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <AlertCircle className="w-5 h-5" />
                <span>Certificate Generation Error</span>
              </div>
              <button
                onClick={() => setSelectedError(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-4 space-y-2">
              <div className="text-xs text-slate-500 font-medium">Recipient:</div>
              <div className="text-sm font-semibold text-slate-900">{selectedError.name}</div>
              <div className="text-xs text-slate-500 font-medium pt-2">Reason:</div>
              <div className="p-3 bg-rose-50 text-rose-800 text-xs font-mono rounded-xl border border-rose-100">
                {selectedError.error}
              </div>
            </div>
            <div className="pt-3 flex justify-end">
              <button
                onClick={() => setSelectedError(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
