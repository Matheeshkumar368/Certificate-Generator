import { apiClient } from './client';
import { Job, JobDetail, CreateJobRequest, OverallStats, Certificate } from '../types';
import { validateEmail } from '../utils/validation';

const STORAGE_KEY = 'certificateflow_jobs_cache';

const getInitialFallbackJobs = (): JobDetail[] => {
  return [
    {
      id: 'f1a2b3c4-1111-2222-3333-444444444444',
      event_name: 'Python Workshop',
      event_date: '08 Oct 2026',
      organization: 'Aereo Learning',
      description: 'A workshop on Python programming for beginners.',
      total_recipients: 3,
      successful_count: 2,
      failed_count: 1,
      status: 'COMPLETED_WITH_ERRORS',
      created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
      completed_at: new Date(Date.now() - 1.9 * 3600000).toISOString(),
      certificates: [
        {
          id: 'c1-1111-2222-3333-444444444441',
          job_id: 'f1a2b3c4-1111-2222-3333-444444444444',
          recipient_name: 'Matheesh Kumar',
          recipient_email: 'matheesh@example.com',
          status: 'GENERATED',
          file_path: 'backend/storage/certificates/certificate_c1-1.pdf',
          created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
        },
        {
          id: 'c1-1111-2222-3333-444444444442',
          job_id: 'f1a2b3c4-1111-2222-3333-444444444444',
          recipient_name: 'Rahul Kumar',
          recipient_email: 'rahul@example.com',
          status: 'GENERATED',
          file_path: 'backend/storage/certificates/certificate_c1-2.pdf',
          created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
        },
        {
          id: 'c1-1111-2222-3333-444444444443',
          job_id: 'f1a2b3c4-1111-2222-3333-444444444444',
          recipient_name: 'Invalid User',
          recipient_email: 'invalid-email',
          status: 'FAILED',
          error_message: "Invalid email format: 'invalid-email'",
          created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
        },
      ],
    },
    {
      id: 'a7d8e9f0-2222-3333-4444-555555555555',
      event_name: 'Django Bootcamp',
      event_date: '01 Oct 2026',
      organization: 'Aereo Learning',
      description: 'Intensive weekend bootcamp on Django & REST APIs.',
      total_recipients: 10,
      successful_count: 10,
      failed_count: 0,
      status: 'COMPLETED',
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      completed_at: new Date(Date.now() - 7 * 86400000 + 300000).toISOString(),
      certificates: Array.from({ length: 10 }, (_, i) => ({
        id: `c2-${i + 1}`,
        job_id: 'a7d8e9f0-2222-3333-4444-555555555555',
        recipient_name: [
          'Aarav Sharma', 'Priya Patel', 'Kavya Nair', 'Vikram Malhotra',
          'Ananya Roy', 'Rohan Joshi', 'Sneha Rao', 'Aditya Verma', 'Pooja Reddy', 'Deepak Gupta'
        ][i] || `Student ${i + 1}`,
        recipient_email: `student${i + 1}@example.com`,
        status: 'GENERATED' as const,
        created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      })),
    },
    {
      id: 'c9d0e1f2-3333-4444-5555-666666666666',
      event_name: 'Web Development',
      event_date: '25 Sep 2026',
      organization: 'Aereo Learning',
      description: 'Foundations of web development and responsive UI design.',
      total_recipients: 25,
      successful_count: 25,
      failed_count: 0,
      status: 'COMPLETED',
      created_at: new Date(Date.now() - 13 * 86400000).toISOString(),
      completed_at: new Date(Date.now() - 13 * 86400000 + 600000).toISOString(),
      certificates: Array.from({ length: 25 }, (_, i) => ({
        id: `c3-${i + 1}`,
        job_id: 'c9d0e1f2-3333-4444-5555-666666666666',
        recipient_name: `Web Participant ${i + 1}`,
        recipient_email: `webdev${i + 1}@example.com`,
        status: 'GENERATED' as const,
        created_at: new Date(Date.now() - 13 * 86400000).toISOString(),
      })),
    },
  ];
};

const getLocalJobs = (): JobDetail[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialFallbackJobs();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return getInitialFallbackJobs();
  }
};

const saveLocalJobs = (jobs: JobDetail[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  } catch (err) {
    console.error('Error saving jobs:', err);
  }
};

export const createJob = async (payload: CreateJobRequest): Promise<Job> => {
  try {
    const response = await apiClient.post<Job>('/jobs/', payload);
    return response.data;
  } catch (err) {
    console.warn('Backend unavailable, saving locally:', err);
    const newId = crypto.randomUUID ? crypto.randomUUID() : `job-${Date.now()}`;
    const now = new Date().toISOString();

    const certificates: Certificate[] = payload.recipients.map((r, idx) => ({
      id: crypto.randomUUID ? crypto.randomUUID() : `cert-${Date.now()}-${idx}`,
      job_id: newId,
      recipient_name: r.name.trim(),
      recipient_email: r.email.trim(),
      status: 'PENDING',
      created_at: now,
    }));

    const newJob: JobDetail = {
      id: newId,
      event_name: payload.event_name.trim(),
      event_date: payload.event_date.trim(),
      organization: payload.organization.trim() || 'Aereo Learning',
      description: payload.description?.trim(),
      total_recipients: payload.recipients.length,
      successful_count: 0,
      failed_count: 0,
      status: 'PROCESSING',
      created_at: now,
      certificates,
    };

    const current = getLocalJobs();
    saveLocalJobs([newJob, ...current]);

    // Simulate async generation progression
    setTimeout(() => {
      let successes = 0;
      let fails = 0;
      const updatedCerts = newJob.certificates.map(c => {
        if (!c.recipient_name) {
          fails++;
          return { ...c, status: 'FAILED' as const, error_message: 'Recipient name cannot be empty.' };
        }
        if (!validateEmail(c.recipient_email)) {
          fails++;
          return { ...c, status: 'FAILED' as const, error_message: `Invalid email format: '${c.recipient_email}'` };
        }
        successes++;
        return { ...c, status: 'GENERATED' as const };
      });

      let finalStatus: Job['status'] = 'COMPLETED';
      if (fails > 0 && successes > 0) finalStatus = 'COMPLETED_WITH_ERRORS';
      else if (fails > 0 && successes === 0) finalStatus = 'FAILED';

      const finalJobs = getLocalJobs().map(j => {
        if (j.id === newId) {
          return {
            ...j,
            status: finalStatus,
            successful_count: successes,
            failed_count: fails,
            completed_at: new Date().toISOString(),
            certificates: updatedCerts,
          };
        }
        return j;
      });
      saveLocalJobs(finalJobs);
    }, 1500);

    return newJob;
  }
};

export const getJobs = async (status?: string, search?: string): Promise<Job[]> => {
  try {
    const params: Record<string, string> = {};
    if (status && status !== 'ALL') params.status = status;
    if (search) params.search = search;
    const response = await apiClient.get<Job[]>('/jobs/', { params });
    return response.data;
  } catch (err) {
    let list = getLocalJobs();
    if (status && status !== 'ALL') {
      list = list.filter(j => j.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(j => j.event_name.toLowerCase().includes(q) || j.organization.toLowerCase().includes(q));
    }
    return list;
  }
};

export const getJob = async (jobId: string): Promise<JobDetail> => {
  try {
    const response = await apiClient.get<JobDetail>(`/jobs/${jobId}`);
    return response.data;
  } catch (err) {
    const list = getLocalJobs();
    const found = list.find(j => j.id === jobId);
    if (!found) throw new Error('Generation job not found.');
    return found;
  }
};

export const getStats = async (): Promise<OverallStats> => {
  try {
    const response = await apiClient.get<OverallStats>('/stats');
    return response.data;
  } catch (err) {
    const list = getLocalJobs();
    const totalJobs = list.length;
    const completedJobs = list.filter(j => j.status === 'COMPLETED').length;
    const jobsWithErrors = list.filter(j => j.status === 'COMPLETED_WITH_ERRORS' || j.status === 'FAILED').length;
    const totalCertificates = list.reduce((acc, curr) => acc + (curr.successful_count || 0), 0);
    return {
      total_jobs: totalJobs,
      total_certificates: totalCertificates,
      completed_jobs: completedJobs,
      jobs_with_errors: jobsWithErrors,
    };
  }
};
