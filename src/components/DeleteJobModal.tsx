import React from 'react';
import { AlertTriangle, Trash2, Loader2, X } from 'lucide-react';
import { Job } from '../types';
import { formatDate } from '../utils/formatters';

interface DeleteJobModalProps {
  isOpen: boolean;
  job: Job | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteJobModal: React.FC<DeleteJobModalProps> = ({
  isOpen,
  job,
  isDeleting,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !job) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200/80 transform transition-all animate-scaleIn"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header Icon */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="flex-1 pr-6">
            <h3
              id="delete-modal-title"
              className="text-lg font-bold text-slate-900 tracking-tight"
            >
              Delete Generation Job
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Confirm permanent deletion of this job and all associated records.
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="mt-5 space-y-3.5">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-500">
              <span>Event Name:</span>
              <span className="font-semibold text-slate-800 text-right truncate max-w-[200px]">
                {job.event_name}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Event Date:</span>
              <span className="font-medium text-slate-700">
                {formatDate(job.event_date)}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Total Recipients:</span>
              <span className="font-semibold text-slate-800 font-mono">
                {job.total_recipients} recipient{job.total_recipients !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/70 text-rose-800 text-xs leading-relaxed space-y-1">
            <p className="font-semibold flex items-center gap-1.5 text-rose-900">
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span>Warning: This action cannot be undone.</span>
            </p>
            <p className="text-rose-700">
              All <strong>{job.total_recipients}</strong> associated certificate records and generated PDF files stored on disk will be permanently deleted.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-xs shadow-rose-200 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting Job...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete Job</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
