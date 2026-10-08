import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { Job } from '../types';
import { StatusBadge } from './StatusBadge';
import { formatDate, formatDateTime, truncateId } from '../utils/formatters';

interface JobTableProps {
  jobs: Job[];
  limit?: number;
}

export const JobTable: React.FC<JobTableProps> = ({ jobs, limit }) => {
  const displayJobs = limit ? jobs.slice(0, limit) : jobs;

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <th className="py-3 px-4">Job ID</th>
            <th className="py-3 px-4">Event Name</th>
            <th className="py-3 px-4">Date</th>
            <th className="py-3 px-4 text-center">Total</th>
            <th className="py-3 px-4 text-center">Success</th>
            <th className="py-3 px-4 text-center">Failed</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4">Created At</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {displayJobs.map((job) => (
            <tr
              key={job.id}
              className="hover:bg-indigo-50/30 transition-colors group"
            >
              <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                <span title={job.id} className="underline decoration-dotted cursor-help">
                  {truncateId(job.id, 8)}
                </span>
              </td>
              <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                {job.event_name}
              </td>
              <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap text-xs">
                {formatDate(job.event_date)}
              </td>
              <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-700 tabular-nums">
                {job.total_recipients}
              </td>
              <td className="py-3.5 px-4 text-center font-mono font-semibold text-emerald-600 tabular-nums">
                {job.successful_count}
              </td>
              <td className="py-3.5 px-4 text-center font-mono font-semibold text-rose-500 tabular-nums">
                {job.failed_count > 0 ? (
                  <span className="text-rose-600 font-bold">{job.failed_count}</span>
                ) : (
                  <span className="text-slate-400">0</span>
                )}
              </td>
              <td className="py-3.5 px-4 whitespace-nowrap">
                <StatusBadge status={job.status} />
              </td>
              <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                {formatDateTime(job.created_at)}
              </td>
              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                <Link
                  to={`/jobs/${job.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-indigo-100 transition-all active:scale-95"
                >
                  <span>View</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
