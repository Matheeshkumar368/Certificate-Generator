import { apiClient } from './client';
import { Job, JobDetail, CreateJobRequest, OverallStats } from '../types';

const STORAGE_KEY = 'certificateflow_jobs_cache';
let hasSyncedLocalCache = false;

export const syncLocalJobsToBackend = async (): Promise<void> => {
  if (hasSyncedLocalCache) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      hasSyncedLocalCache = true;
      return;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      await apiClient.post('/jobs/sync', { jobs: parsed });
    }
    hasSyncedLocalCache = true;
  } catch {
    // Ignore sync errors if localStorage is empty or unavailable
  }
};

export const createJob = async (payload: CreateJobRequest): Promise<Job> => {
  const response = await apiClient.post<Job>('/jobs/', payload);
  return response.data;
};

export const getJobs = async (status?: string, search?: string): Promise<Job[]> => {
  await syncLocalJobsToBackend();
  const params: Record<string, string> = {};
  if (status && status !== 'ALL') params.status = status;
  if (search) params.search = search;
  const response = await apiClient.get<Job[]>('/jobs/', { params });
  return response.data;
};

export const getJob = async (jobId: string): Promise<JobDetail> => {
  try {
    const response = await apiClient.get<JobDetail>(`/jobs/${jobId}`);
    return response.data;
  } catch (err: any) {
    if (err?.response?.status === 404 && !hasSyncedLocalCache) {
      await syncLocalJobsToBackend();
      const retry = await apiClient.get<JobDetail>(`/jobs/${jobId}`);
      return retry.data;
    }
    throw err;
  }
};

export const getStats = async (): Promise<OverallStats> => {
  await syncLocalJobsToBackend();
  const response = await apiClient.get<OverallStats>('/stats');
  return response.data;
};

export const deleteJob = async (
  jobId: string
): Promise<{ success: boolean; id: string; deleted_certificates?: number; event_name?: string }> => {
  try {
    const response = await apiClient.delete<{
      success: boolean;
      id: string;
      deleted_certificates?: number;
      event_name?: string;
    }>(`/jobs/${jobId}`);

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(list.filter((j: JobDetail) => j.id !== jobId))
          );
        }
      }
    } catch {
      // Ignore localStorage cleanup errors
    }

    return response.data;
  } catch (err: any) {
    if (err.response?.data?.detail) {
      throw new Error(err.response.data.detail);
    }
    if (err.response?.status) {
      throw new Error(
        `Server returned error ${err.response.status}: ${err.response.statusText || 'Deletion failed'}`
      );
    }
    if (err.message) {
      throw new Error(`Connection error: ${err.message}`);
    }
    throw new Error('Failed to delete generation job on server.');
  }
};
