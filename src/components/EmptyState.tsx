import React from 'react';
import { Layers, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  actionHref?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Jobs Yet',
  description = "You haven't generated any certificates yet.",
  actionText = 'Generate Your First Certificates',
  actionHref = '/generate',
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-2xl border border-dashed border-slate-300">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
        <Layers className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
      {actionHref && (
        <Link
          to={actionHref}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs shadow-indigo-200 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{actionText}</span>
        </Link>
      )}
    </div>
  );
};
