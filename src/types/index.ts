export type JobStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'COMPLETED_WITH_ERRORS'
  | 'FAILED';

export type CertificateStatus =
  | 'PENDING'
  | 'GENERATED'
  | 'FAILED';

export interface Recipient {
  name: string;
  email: string;
  status?: 'Valid' | 'Invalid';
  error?: string;
}

export interface TemplateElement {
  id: string;
  type: 'text' | 'shape' | 'image' | 'logo' | 'signature' | 'line' | 'seal';
  label?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  zIndex?: number;

  // Text attributes
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  color?: string;
  alignment?: 'left' | 'center' | 'right';
  lineHeight?: number;
  idDisplayFormat?: 'full' | 'short';

  // Shape attributes
  shapeType?: 'rectangle' | 'circle' | 'line' | 'seal';
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;

  // Image/Logo/Signature attributes
  src?: string;
}

export interface TemplateConfig {
  background: string;
  gradient?: string;
  borderStyle: string; // classic_gold, modern_minimal, corporate_blue, elegant_black, academic, creative_gradient, orange_modern, none
  canvas_width?: number;
  canvas_height?: number;
  elements: TemplateElement[];
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  category: 'Corporate' | 'Academic' | 'Modern' | 'Classic' | 'Creative' | string;
  orientation: 'landscape' | 'portrait';
  canvas_width: number;
  canvas_height: number;
  configuration: TemplateConfig;
  is_system_template: boolean;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  event_name: string;
  event_date: string;
  organization: string;
  description?: string;
  template_id?: string;
  total_recipients: number;
  successful_count: number;
  failed_count: number;
  status: JobStatus;
  created_at: string;
  completed_at?: string;
}

export interface Certificate {
  id: string;
  job_id: string;
  recipient_name: string;
  recipient_email: string;
  status: CertificateStatus;
  file_path?: string;
  error_message?: string;
  created_at: string;
}

export interface JobDetail extends Job {
  template_config?: TemplateConfig;
  certificates: Certificate[];
}

export interface CreateJobRequest {
  event_name: string;
  event_date: string;
  organization: string;
  description?: string;
  template_id?: string;
  recipients: { name: string; email: string }[];
}

export interface OverallStats {
  total_jobs: number;
  total_certificates: number;
  completed_jobs: number;
  jobs_with_errors: number;
}
