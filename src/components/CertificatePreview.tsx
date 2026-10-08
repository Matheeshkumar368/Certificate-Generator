import React, { useRef } from 'react';
import { X, Download, Printer, Award, ExternalLink, ShieldCheck } from 'lucide-react';
import { Certificate } from '../types';
import { getCertificatePdfUrl, downloadClientGeneratedPdf } from '../api/certificates';

interface CertificatePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: Certificate | null;
  eventName: string;
  eventDate: string;
  organization?: string;
}

export const CertificatePreview: React.FC<CertificatePreviewProps> = ({
  isOpen,
  onClose,
  certificate,
  eventName,
  eventDate,
  organization = 'Aereo Learning',
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Attempt backend download; also provide client rendering fallback
    const downloadUrl = getCertificatePdfUrl(certificate.id, true);
    const win = window.open(downloadUrl, '_blank');
    if (!win) {
      downloadClientGeneratedPdf(certificate, eventName, eventDate, organization);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-800/90 border-b border-slate-700/60 text-slate-200">
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-semibold tracking-tight text-white truncate max-w-xs sm:max-w-md">
              Certificate_{certificate.recipient_name.replace(/\s+/g, '_')}.pdf
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-mono bg-slate-700 text-slate-300">
              1 / 1
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
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
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

        {/* Certificate Display Canvas */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-slate-950 flex items-center justify-center">
          <div
            ref={printRef}
            className="w-full max-w-3xl aspect-[1.414/1] bg-[#FCFBF9] text-slate-900 rounded-md p-6 sm:p-10 relative shadow-2xl flex flex-col justify-between border-8 border-slate-900 select-none"
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Inner Gold Frame */}
            <div className="absolute inset-3 sm:inset-4 border-2 border-amber-500/70 pointer-events-none" />
            <div className="absolute inset-4 sm:inset-5 border border-slate-800/40 pointer-events-none" />

            {/* Corner Ornamental Diamonds */}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 w-3 h-3 bg-amber-600 rotate-45" />
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-3 h-3 bg-amber-600 rotate-45" />
            <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 w-3 h-3 bg-amber-600 rotate-45" />
            <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 w-3 h-3 bg-amber-600 rotate-45" />

            {/* Header */}
            <div className="text-center pt-2 sm:pt-4">
              <h2 className="text-xs sm:text-base font-extrabold tracking-widest text-slate-800 uppercase">
                {organization}
              </h2>
              <div className="flex items-center justify-center gap-3 my-2 sm:my-3">
                <div className="w-16 sm:w-32 h-[1px] bg-slate-300" />
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <div className="w-16 sm:w-32 h-[1px] bg-slate-300" />
              </div>
              <h1 className="text-base sm:text-2xl lg:text-3xl font-extrabold text-slate-950 tracking-tight font-serif uppercase">
                Certificate of Participation
              </h1>
            </div>

            {/* Body */}
            <div className="text-center my-auto py-2 sm:py-4">
              <p className="text-xs sm:text-sm text-slate-600 italic font-serif mb-2 sm:mb-3">
                This is proudly presented to certify that
              </p>
              <div className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-indigo-950 font-serif tracking-wide px-4 leading-tight">
                {certificate.recipient_name}
              </div>
              <div className="w-48 sm:w-80 h-[2px] bg-amber-500 mx-auto mt-2 mb-3" />
              <p className="text-xs sm:text-sm text-slate-600 italic font-serif">
                has successfully participated in the program
              </p>
              <p className="text-sm sm:text-xl font-bold text-slate-900 mt-1 uppercase tracking-wide">
                {eventName}
              </p>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                conducted on {eventDate}
              </p>
            </div>

            {/* Footer Row */}
            <div className="flex items-end justify-between pt-2 sm:pt-4 border-t border-slate-200/60 text-left">
              {/* Left Metadata */}
              <div className="space-y-1">
                <div>
                  <div className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Certificate ID
                  </div>
                  <div className="text-[10px] sm:text-xs font-mono font-bold text-slate-800">
                    {certificate.id.substring(0, 16)}...
                  </div>
                </div>
                <div>
                  <div className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Issue Date
                  </div>
                  <div className="text-[10px] sm:text-xs font-medium text-slate-700">
                    {eventDate}
                  </div>
                </div>
              </div>

              {/* Center Seal */}
              <div className="flex flex-col items-center">
                <div className="relative flex items-center justify-center">
                  {/* Rosette Ribbon Tails */}
                  <div className="absolute -bottom-2 -left-1 w-3 h-5 bg-indigo-900 -rotate-12 rounded-xs" />
                  <div className="absolute -bottom-2 -right-1 w-3 h-5 bg-indigo-900 rotate-12 rounded-xs" />
                  {/* Rosette Medal */}
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 p-0.5 shadow-md flex items-center justify-center relative z-10">
                    <div className="w-full h-full rounded-full border-2 border-amber-200/80 flex flex-col items-center justify-center text-amber-950 font-bold text-[8px] sm:text-[10px] leading-tight text-center">
                      <ShieldCheck className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-amber-900 mb-0.5" />
                      <span>OFFICIAL</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Signature */}
              <div className="text-right">
                <div className="font-serif italic text-base sm:text-xl text-indigo-900 font-bold -mb-1">
                  Matheesh Kumar
                </div>
                <div className="w-24 sm:w-36 h-[1px] bg-slate-400 ml-auto mb-1" />
                <div className="text-[10px] sm:text-xs font-bold text-slate-900">
                  Authorized Signatory
                </div>
                <div className="text-[9px] sm:text-[10px] text-slate-500">
                  {organization}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="p-3.5 bg-slate-800/90 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
          <span>Official cryptographically generated certificate vector preview</span>
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
