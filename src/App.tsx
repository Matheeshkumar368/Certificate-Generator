import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { GenerateCertificates } from './pages/GenerateCertificates';
import { MyJobs } from './pages/MyJobs';
import { JobDetails } from './pages/JobDetails';
import { Templates } from './pages/Templates';
import { TemplateEditor } from './pages/TemplateEditor';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="generate" element={<GenerateCertificates />} />
          <Route path="jobs" element={<MyJobs />} />
          <Route path="jobs/:jobId" element={<JobDetails />} />
          <Route path="templates" element={<Templates />} />
          <Route path="templates/:templateId/edit" element={<TemplateEditor />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
