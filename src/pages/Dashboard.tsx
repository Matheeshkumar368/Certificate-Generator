import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Layers,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { JobTable } from '../components/JobTable';
import { LoadingState } from '../components/LoadingState';
import { getJobs, getStats } from '../api/jobs';
import { Job, OverallStats } from '../types';

export const Dashboard: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [jobsData, statsData] = await Promise.all([
          getJobs(),
          getStats(),
        ]);
        setJobs(jobsData);
        setStats(statsData);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  if (loading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Good afternoon, Matheesh 👋
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Create, track and manage your certificate generation jobs.
        </p>
      </div>

      {/* Hero Banner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white p-6 sm:p-10 shadow-xl border border-indigo-800/40">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-1/4 -mt-20 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 -mb-20 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text & CTA */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>Certificate Generator</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Create Certificates <br />
              in Bulk, <span className="text-indigo-400 underline decoration-indigo-400/40">Effortlessly</span>
            </h2>

            <p className="text-sm sm:text-base text-indigo-100/80 max-w-xl leading-relaxed">
              Generate professional certificates for your event or course with just a few clicks.
              Upload recipients, customize details, and get beautifully designed certificates.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/generate"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-md shadow-indigo-600/30 transition-all active:scale-95"
              >
                <span>Generate Certificates</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/jobs"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold border border-white/10 backdrop-blur-xs transition-colors"
              >
                <span>View My Jobs</span>
              </Link>
            </div>
          </div>

          {/* Right 3D Certificate Preview Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-sm transform lg:rotate-2 hover:rotate-0 transition-transform duration-300 shadow-2xl rounded-2xl overflow-hidden border-4 border-white/20 bg-[#FCFBF9] text-slate-900 p-5 select-none">
              <div className="border border-amber-600/50 p-4 rounded-lg bg-[#FAF8F5] text-center space-y-2">
                <div className="text-[10px] font-bold tracking-widest text-slate-700 uppercase">
                  AEREO LEARNING
                </div>
                <div className="text-xs font-serif font-extrabold tracking-wide uppercase text-slate-900">
                  Certificate of Participation
                </div>
                <div className="text-[10px] italic font-serif text-slate-500">
                  This is to certify that
                </div>
                <div className="text-sm font-serif font-bold text-indigo-950 py-1">
                  Your Name
                </div>
                <div className="text-[10px] italic font-serif text-slate-500">
                  has successfully participated in the
                </div>
                <div className="text-xs font-bold text-slate-900 uppercase">
                  Python Workshop
                </div>
                <div className="text-[9px] text-slate-400">
                  08 October 2026
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 mt-2">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-right">
                    <div className="font-serif italic text-xs text-indigo-900 font-bold">
                      Aereo Cloud
                    </div>
                    <div className="text-[8px] text-slate-400">Authorized Signatory</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Key Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          label="Total Jobs"
          value={stats?.total_jobs ?? 0}
          icon={Layers}
          variant="blue"
        />
        <StatCard
          label="Certificates Generated"
          value={stats?.total_certificates ?? 0}
          icon={Award}
          variant="emerald"
        />
        <StatCard
          label="Completed Jobs"
          value={stats?.completed_jobs ?? 0}
          icon={CheckCircle2}
          variant="purple"
        />
        <StatCard
          label="Jobs With Errors"
          value={stats?.jobs_with_errors ?? 0}
          icon={AlertCircle}
          variant="rose"
        />
      </div>

      {/* Recent Jobs Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Recent Jobs
            </h3>
            <p className="text-xs text-slate-500">
              Overview of your latest certificate generation pipelines.
            </p>
          </div>
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <JobTable jobs={jobs} limit={5} />
      </div>
    </div>
  );
};
