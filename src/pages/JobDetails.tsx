import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Copy,
  Check,
  Award,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Building,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getJob } from '../api/jobs';
import { JobDetail, Certificate } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { CertificateTable } from '../components/CertificateTable';
import { CertificatePreview } from '../components/CertificatePreview';
import { ProgressBar } from '../components/ProgressBar';
import { LoadingState } from '../components/LoadingState';
import { formatDate } from '../utils/formatters';

export const JobDetails: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);
  const confettiFired = useRef(false);

  const fetchJob = async (showSpinner = false) => {
    if (!jobId) return;
    if (showSpinner) setLoading(true);
    try {
      const data = await getJob(jobId);
      setJob(data);

      // Fire celebratory confetti once when job finishes successfully
      if (
        (data.status === 'COMPLETED' || data.status === 'COMPLETED_WITH_ERRORS') &&
        !confettiFired.current
      ) {
        confettiFired.current = true;
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      }
    } catch (err) {
      console.error('Error fetching job details:', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob(true);
  }, [jobId]);

  // Polling mechanism while job is PROCESSING or PENDING
  useEffect(() => {
    if (!job) return;
    if (job.status === 'PROCESSING' || job.status === 'PENDING') {
      const interval = setInterval(() => {
        fetchJob(false);
      }, 800);
      return () => clearInterval(interval);
    }
  }, [job?.status]);

  const handleCopyId = () => {
    if (!job) return;
    navigator.clipboard.writeText(job.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <LoadingState message="Loading job details..." />;
  }

  if (!job) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800">Job Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">
          The requested certificate generation job could not be found.
        </p>
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to My Jobs</span>
        </Link>
      </div>
    );
  }

  const isProcessing = job.status === 'PROCESSING' || job.status === 'PENDING';
  const progressPercent =
    job.total_recipients > 0
      ? ((job.successful_count + job.failed_count) / job.total_recipients) * 100
      : 0;

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Top Breadcrumb & Title */}
      <div>
        <Link
          to="/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Jobs</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {isProcessing ? 'Job Progress' : 'Job Details'}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {isProcessing
                ? `Generating certificates for ${job.event_name}...`
                : `View all certificates and their status for this job.`}
            </p>
          </div>
          <button
            onClick={() => fetchJob(false)}
            className="self-start sm:self-auto p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            title="Refresh job status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary Status & Metadata Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Event & Job Information Card */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Job Identifiers
            </div>
            <StatusBadge status={job.status} />
          </div>

          <div>
            <div className="text-xs text-slate-400 font-medium">Job ID</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-xs text-slate-700 font-semibold truncate max-w-xs">
                {job.id}
              </span>
              <button
                onClick={handleCopyId}
                className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                title="Copy full UUID"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <div className="text-xs text-slate-400 font-medium">Event Name</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5 truncate">
                {job.event_name}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Event Date</div>
              <div className="text-sm font-semibold text-slate-800 mt-0.5">
                {formatDate(job.event_date)}
              </div>
            </div>
          </div>

          <div className="pt-1">
            <div className="text-xs text-slate-400 font-medium">Organization</div>
            <div className="text-sm font-semibold text-slate-800 mt-0.5">
              {job.organization}
            </div>
          </div>
        </div>

        {/* Right: Progress Tracker / Status Card */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-center">
          {isProcessing ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Processing</div>
                  <div className="text-xs text-slate-500">Generating certificates via ReportLab...</div>
                </div>
              </div>

              <ProgressBar
                progress={progressPercent}
                total={job.total_recipients}
                current={job.successful_count + job.failed_count}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  job.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {job.status === 'COMPLETED' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {job.status === 'COMPLETED' ? 'Batch Generation Complete' : 'Completed with Some Errors'}
                  </div>
                  <div className="text-xs text-slate-500">
                    All recipient jobs have completed processing.
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <ProgressBar
                  progress={100}
                  total={job.total_recipients}
                  current={job.total_recipients}
                  label="Generation finished"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 tabular-nums font-mono">
              {job.total_recipients}
            </div>
            <div className="text-xs font-medium text-slate-500">Total Recipients</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-emerald-600 tabular-nums font-mono">
              {job.successful_count}
            </div>
            <div className="text-xs font-medium text-slate-500">Successful</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-rose-600 tabular-nums font-mono">
              {job.failed_count}
            </div>
            <div className="text-xs font-medium text-slate-500">Failed</div>
          </div>
        </div>
      </div>

      {/* Certificates Breakdown Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            Certificates
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {job.certificates.length} Total records
          </span>
        </div>

        <CertificateTable
          certificates={job.certificates}
          eventName={job.event_name}
          eventDate={job.event_date}
          organization={job.organization}
          onPreview={(cert) => setPreviewCert(cert)}
        />
      </div>

      {/* Modal Preview */}
      <CertificatePreview
        isOpen={!!previewCert}
        onClose={() => setPreviewCert(null)}
        certificate={previewCert}
        eventName={job.event_name}
        eventDate={job.event_date}
        organization={job.organization}
      />
    </div>
  );
};
