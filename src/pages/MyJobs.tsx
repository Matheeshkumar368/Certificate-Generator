import React, { useEffect, useState, useCallback } from 'react';
import { Search, Filter, Plus, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { JobTable } from '../components/JobTable';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { DeleteJobModal } from '../components/DeleteJobModal';
import { getJobs, deleteJob } from '../api/jobs';
import { Job } from '../types';

export const MyJobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Deletion modal state
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);

  // Notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const fetchFilteredJobs = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const data = await getJobs(
        selectedStatus === 'ALL' ? undefined : selectedStatus,
        search.trim() ? search.trim() : undefined
      );
      setJobs(data);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [selectedStatus, search]);

  useEffect(() => {
    setLoading(true);
    const debounce = setTimeout(() => {
      fetchFilteredJobs(false).then(() => setLoading(false));
    }, 250);
    return () => clearTimeout(debounce);
  }, [fetchFilteredJobs]);

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      setNotification(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification]);

  const handleDeleteClick = (job: Job) => {
    if (job.status === 'PROCESSING' || job.status === 'PENDING') {
      setNotification({
        type: 'error',
        message: `Job "${job.event_name}" is currently generating certificates and cannot be deleted until completion.`,
      });
      return;
    }
    setJobToDelete(job);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isDeleting) return;
    setIsModalOpen(false);
    setJobToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!jobToDelete || isDeleting) return;

    const targetJob = jobToDelete;
    setIsDeleting(true);
    setDeletingJobId(targetJob.id);

    try {
      await deleteJob(targetJob.id);

      // Refresh jobs list from backend
      await fetchFilteredJobs(false);

      setNotification({
        type: 'success',
        message: `Job "${targetJob.event_name}" and its associated certificates were deleted successfully.`,
      });

      setIsModalOpen(false);
      setJobToDelete(null);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to delete generation job. Please try again.';
      setNotification({
        type: 'error',
        message: errorMsg,
      });
    } finally {
      setIsDeleting(false);
      setDeletingJobId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Notification Banner */}
      {notification && (
        <div
          role="alert"
          className={`flex items-center justify-between gap-3 p-4 rounded-2xl border text-sm font-medium shadow-xs transition-all animate-slideDown ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>

          <button
            type="button"
            onClick={() => setNotification(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-black/5 transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
        <JobTable
          jobs={jobs}
          onDeleteClick={handleDeleteClick}
          deletingJobId={deletingJobId}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteJobModal
        isOpen={isModalOpen}
        job={jobToDelete}
        isDeleting={isDeleting}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

