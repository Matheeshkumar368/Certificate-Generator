import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  UploadCloud,
  FileSpreadsheet,
  Check,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  FileDown,
  ShieldCheck,
  Sparkles,
  Palette,
  ExternalLink
} from 'lucide-react';
import { createJob } from '../api/jobs';
import { getTemplates } from '../api/templates';
import { Recipient, Template } from '../types';
import { parseAndValidateCsv, validateEmail, downloadSampleCsv } from '../utils/validation';
import { TemplateCanvas } from '../components/TemplateCanvas';

export const GenerateCertificates: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTemplateId = searchParams.get('templateId') || 'tpl-classic-gold-01';

  // Multi-step state: 1, 2, 3
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Template Selection
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(initialTemplateId);

  // Step 1 Form Data
  const [eventName, setEventName] = useState('Python Workshop');
  const [organization, setOrganization] = useState('Aereo Learning');
  const [eventDate, setEventDate] = useState('08 Oct 2026');
  const [description, setDescription] = useState('A workshop on Python programming for beginners.');

  // Step 2 Recipient Data
  const [uploadMethod, setUploadMethod] = useState<'csv' | 'manual'>('csv');
  const [recipients, setRecipients] = useState<Recipient[]>([
    { name: 'Matheesh Kumar', email: 'matheesh@example.com', status: 'Valid' },
    { name: 'Rahul Kumar', email: 'rahul@example.com', status: 'Valid' },
    { name: 'Invalid User', email: 'invalid-email', status: 'Invalid', error: 'Invalid email format' },
  ]);

  // Manual entry inputs
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  // Submitting state
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const list = await getTemplates();
        setTemplates(list);
        if (initialTemplateId && list.some(t => t.id === initialTemplateId)) {
          setSelectedTemplateId(initialTemplateId);
        } else if (list.length > 0 && !selectedTemplateId) {
          setSelectedTemplateId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load templates in generator:', err);
      }
    };
    loadTemplates();
  }, [initialTemplateId]);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  // CSV File Handler
  const handleFileUpload = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const parsed = parseAndValidateCsv(text);
        if (parsed.length > 0) {
          setRecipients(parsed);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Add Manual Recipient
  const handleAddManualRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualEmail.trim()) return;

    const isValid = validateEmail(manualEmail.trim());
    const newRecipient: Recipient = {
      name: manualName.trim(),
      email: manualEmail.trim(),
      status: isValid ? 'Valid' : 'Invalid',
      error: isValid ? undefined : 'Invalid email format',
    };

    setRecipients([...recipients, newRecipient]);
    setManualName('');
    setManualEmail('');
  };

  const handleRemoveRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  // Counts
  const validCount = recipients.filter((r) => r.status === 'Valid').length;
  const invalidCount = recipients.filter((r) => r.status === 'Invalid').length;

  // Submit Job
  const handleGenerate = async () => {
    if (recipients.length === 0) return;
    setSubmitting(true);
    try {
      const created = await createJob({
        event_name: eventName,
        event_date: eventDate,
        organization,
        description,
        template_id: selectedTemplateId,
        recipients: recipients.map((r) => ({ name: r.name, email: r.email })),
      });
      navigate(`/jobs/${created.id}`);
    } catch (err) {
      console.error('Job generation failed:', err);
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fadeIn pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Generate Certificates
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Select a template, fill in event details, and upload recipients to generate certificates in bulk.
        </p>
      </div>

      {/* 3-Step Wizard Navigation */}
      <div className="flex items-center justify-center max-w-2xl mx-auto px-4 py-2">
        <div className="flex items-center w-full justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />

          {/* Step 1 */}
          <div
            onClick={() => setCurrentStep(1)}
            className="relative z-10 flex flex-col items-center cursor-pointer group"
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                currentStep === 1
                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                  : currentStep > 1
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white border-2 border-slate-300 text-slate-500'
              }`}
            >
              {currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
            </div>
            <span
              className={`text-xs mt-2 font-medium whitespace-nowrap ${
                currentStep === 1 ? 'text-indigo-600 font-bold' : 'text-slate-600'
              }`}
            >
              Event & Template
            </span>
          </div>

          {/* Step 2 */}
          <div
            onClick={() => eventName && setCurrentStep(2)}
            className="relative z-10 flex flex-col items-center cursor-pointer group"
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                currentStep === 2
                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                  : currentStep > 2
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white border-2 border-slate-300 text-slate-500'
              }`}
            >
              {currentStep > 2 ? <Check className="w-4 h-4" /> : '2'}
            </div>
            <span
              className={`text-xs mt-2 font-medium whitespace-nowrap ${
                currentStep === 2 ? 'text-indigo-600 font-bold' : 'text-slate-600'
              }`}
            >
              Upload Recipients
            </span>
          </div>

          {/* Step 3 */}
          <div
            onClick={() => recipients.length > 0 && setCurrentStep(3)}
            className="relative z-10 flex flex-col items-center cursor-pointer group"
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                currentStep === 3
                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                  : 'bg-white border-2 border-slate-300 text-slate-500'
              }`}
            >
              3
            </div>
            <span
              className={`text-xs mt-2 font-medium whitespace-nowrap ${
                currentStep === 3 ? 'text-indigo-600 font-bold' : 'text-slate-600'
              }`}
            >
              Review & Generate
            </span>
          </div>
        </div>
      </div>

      {/* STEP 1: EVENT & TEMPLATE DETAILS */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
          {/* Left Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-5">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Event Information
            </h2>

            <div className="space-y-4">
              {/* Template Selector Dropdown */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Certificate Template <span className="text-rose-500">*</span>
                  </label>
                  <Link
                    to="/templates"
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                  >
                    <span>Browse All</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-900 bg-white"
                >
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name} ({tpl.category}) {tpl.is_system_template ? '• Standard' : '• Custom'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Event Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g. Python Workshop"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Organization Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="e.g. Aereo Learning"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Event Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  placeholder="e.g. 08 Oct 2026"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A workshop on Python programming for beginners."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-900 resize-none"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (eventName.trim() && organization.trim()) {
                    setCurrentStep(2);
                  }
                }}
                disabled={!eventName.trim() || !organization.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold shadow-xs shadow-indigo-200 transition-all active:scale-95"
              >
                <span>Next: Upload Recipients</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Certificate Preview Card */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Selected Template Preview
                </span>
                {selectedTemplate && (
                  <Link
                    to={`/templates/${selectedTemplate.id}/edit`}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                  >
                    Customize Design →
                  </Link>
                )}
              </div>

              {/* Dynamic visual preview matching chosen template */}
              <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center p-2">
                {selectedTemplate ? (
                  <div
                    className="relative overflow-hidden rounded-lg shadow-xs"
                    style={{ width: 320, height: 226 }}
                  >
                    <div
                      style={{
                        transform: 'scale(0.4)',
                        transformOrigin: 'top left',
                        width: 800,
                        height: 566,
                      }}
                    >
                      <TemplateCanvas
                        config={selectedTemplate.configuration}
                        isPreviewMode={true}
                        zoom={1}
                        sampleContext={{
                          recipient_name: 'Matheesh Kumar',
                          recipient_email: 'matheesh@example.com',
                          event_name: eventName || 'Python Workshop',
                          event_date: eventDate || '08 Oct 2026',
                          organization: organization || 'Aereo Learning',
                          certificate_id: 'CERT-PREVIEW-01',
                          issue_date: eventDate || '08 Oct 2026',
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[1.414/1] w-full flex items-center justify-center text-xs text-slate-400">
                    Loading template preview...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: UPLOAD RECIPIENTS */}
      {currentStep === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
          {/* Left: Input Selection (CSV vs Manual) */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">
                Upload Recipients
              </h2>
              {/* Toggle Segmented Control */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setUploadMethod('csv')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    uploadMethod === 'csv'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Upload CSV
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMethod('manual')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    uploadMethod === 'manual'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Enter Manually
                </button>
              </div>
            </div>

            {/* CSV Upload Mode */}
            {uploadMethod === 'csv' ? (
              <div className="space-y-4">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50/50'
                      : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'
                  }`}
                  onClick={() => document.getElementById('csv-file-input')?.click()}
                >
                  <input
                    id="csv-file-input"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />

                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-3">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Drag and drop your CSV file here
                  </h3>
                  <p className="text-xs text-indigo-600 font-semibold mt-0.5">
                    or click to browse
                  </p>
                  <p className="text-[11px] text-slate-400 mt-3">
                    CSV should contain columns: <span className="font-mono text-slate-600">name,email</span>
                  </p>
                </div>

                {fileName && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900 font-medium">
                    <div className="flex items-center gap-2 truncate">
                      <FileSpreadsheet className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="truncate">{fileName}</span>
                    </div>
                    <span className="text-[11px] text-indigo-600 font-semibold shrink-0">
                      Loaded
                    </span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={downloadSampleCsv}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Download Sample CSV</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Manual Input Mode */
              <div className="space-y-4">
                <form onSubmit={handleAddManualRecipient} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Recipient Name
                    </label>
                    <input
                      type="text"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="e.g. Arun Kumar"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      placeholder="e.g. arun@example.com"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-900"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!manualName.trim() || !manualEmail.trim()}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Recipient</span>
                  </button>
                </form>
              </div>
            )}

            {/* Back / Next Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => recipients.length > 0 && setCurrentStep(3)}
                disabled={recipients.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold shadow-xs shadow-indigo-200 transition-all active:scale-95"
              >
                <span>Continue to Review</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right: Real-time Validation Preview Table */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Preview ({recipients.length} recipients)
                </h3>
                <div className="flex items-center gap-3 text-xs mt-1">
                  <span className="text-emerald-600 font-semibold">
                    {validCount} Valid
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-rose-600 font-semibold">
                    {invalidCount} Invalid
                  </span>
                </div>
              </div>
            </div>

            {/* Recipients Table */}
            <div className="overflow-x-auto max-h-96 rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="py-2.5 px-3 w-8">#</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-2 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {recipients.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 text-slate-400 font-mono">{i + 1}</td>
                      <td className="py-2.5 px-3 text-slate-900 truncate max-w-[120px]">
                        {r.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 truncate max-w-[140px]">
                        {r.email}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {r.status === 'Valid' ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Valid
                          </span>
                        ) : (
                          <span
                            title={r.error}
                            className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 cursor-help"
                          >
                            Invalid
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <button
                          onClick={() => handleRemoveRecipient(i)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                          title="Remove recipient"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW & GENERATE */}
      {currentStep === 3 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xs space-y-8 animate-fadeIn">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Review & Generate
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Please double check all parameters before launching batch generation.
            </p>
          </div>

          {/* Warning Banner if Invalid Recipients */}
          {invalidCount > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Notice:</span> {invalidCount} recipient
                {invalidCount > 1 ? 's' : ''} will not receive a certificate because the email address is invalid.
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Event Summary Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Event Information
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Event:</span>
                  <span className="font-bold text-slate-900">{eventName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Organization:</span>
                  <span className="font-medium text-slate-900">{organization}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date:</span>
                  <span className="font-medium text-slate-900">{eventDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Template:</span>
                  <span className="font-semibold text-indigo-700">{selectedTemplate?.name || 'Classic Gold'}</span>
                </div>
              </div>
            </div>

            {/* Recipient Summary Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Recipients Summary
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total:</span>
                  <span className="font-mono font-bold text-slate-900">{recipients.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Valid:</span>
                  <span className="font-mono font-semibold text-emerald-600">{validCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Invalid:</span>
                  <span className="font-mono font-semibold text-rose-600">{invalidCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-sm font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold shadow-md shadow-indigo-300 transition-all active:scale-95"
            >
              {submitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Initiating Job...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Certificates</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
