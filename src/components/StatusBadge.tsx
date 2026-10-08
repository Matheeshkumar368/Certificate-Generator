import React from 'react';
import { CheckCircle2, AlertCircle, Loader2, Clock, XCircle } from 'lucide-react';
import { JobStatus, CertificateStatus } from '../types';

interface StatusBadgeProps {
  status: JobStatus | CertificateStatus | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'COMPLETED':
    case 'GENERATED':
    case 'Valid':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>{status === 'COMPLETED' ? 'Completed' : status === 'GENERATED' ? 'Generated' : 'Valid'}</span>
        </span>
      );

    case 'PROCESSING':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
          <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
          <span>Processing</span>
        </span>
      );

    case 'COMPLETED_WITH_ERRORS':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          <span>Completed with Errors</span>
        </span>
      );

    case 'FAILED':
    case 'Invalid':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>{status === 'FAILED' ? 'Failed' : 'Invalid'}</span>
        </span>
      );

    case 'PENDING':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Pending</span>
        </span>
      );
  }
};
