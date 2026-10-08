import React, { useEffect, useState } from 'react';
import { Search, Filter, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { JobTable } from '../components/JobTable';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { getJobs } from '../api/jobs';
import { Job } from '../types';

export const MyJobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  useEffect(() => {
    const fetchFilteredJobs = async () => {
      setLoading(true);
      try {
        const data = await getJobs(
          selectedStatus === 'ALL' ? undefined : selectedStatus,
          search.trim() ? search.trim() : undefined
        );
        setJobs(data);
      } catch (err) {
        console.error('Failed to load jobs:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchFilteredJobs, 250);
    return () => clearTimeout(debounce);
  }, [selectedStatus, search]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Jobs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            View and manage all your certificate generation jobs.
          </p>
        </div>

        <Link
          to="/generate"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs shadow-indigo-200 transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Generation Job</span>
        </Link>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by event name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-900 bg-white shadow-2xs"
          />
        </div>

        <div className="relative w-full sm:w-56">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm font-semibold text-slate-700 bg-white shadow-2xs cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED_WITH_ERRORS">Completed with Errors</option>
            <option value="FAILED">Failed</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      {/* Table or Empty State */}
      {loading ? (
        <LoadingState message="Loading your generation jobs..." />
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No Matching Jobs Found"
          description={
            search || selectedStatus !== 'ALL'
              ? 'Try modifying your search query or status filter.'
              : "You haven't generated any certificates yet."
          }
          actionText="Create New Generation Job"
          actionHref="/generate"
        />
      ) : (
        <JobTable jobs={jobs} />
      )}
    </div>
  );
};
