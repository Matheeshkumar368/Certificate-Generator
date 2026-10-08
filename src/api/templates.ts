import { apiClient } from './client';
import { Template, TemplateConfig } from '../types';

const TEMPLATES_STORAGE_KEY = 'certificateflow_templates_cache';

export const INITIAL_SYSTEM_TEMPLATES: Template[] = [
  {
    id: 'tpl-classic-gold-01',
    name: 'Classic Gold',
    description: 'Timeless traditional certificate with double navy and gold ornamental borders and official seal.',
    category: 'Classic',
    orientation: 'landscape',
    canvas_width: 800,
    canvas_height: 566,
    is_system_template: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    configuration: {
      background: '#FCFBF9',
      borderStyle: 'classic_gold',
      elements: [
        {
          id: 'el-org',
          type: 'text',
          text: '{{organization}}',
          x: 100,
          y: 50,
          width: 600,
          height: 30,
          fontFamily: 'Helvetica',
          fontSize: 15,
          fontWeight: 'bold',
          color: '#1E293B',
          alignment: 'center',
          zIndex: 2,
        },
        {
          id: 'el-title',
          type: 'text',
          text: 'CERTIFICATE OF PARTICIPATION',
          x: 80,
          y: 95,
          width: 640,
          height: 40,
          fontFamily: 'Helvetica',
          fontSize: 24,
          fontWeight: 'bold',
          color: '#0F172A',
          alignment: 'center',
          zIndex: 2,
        },
        {
          id: 'el-intro',
          type: 'text',
          text: 'This is proudly presented to certify that',
          x: 100,
          y: 145,
          width: 600,
          height: 25,
          fontFamily: 'Times-Roman',
          fontSize: 14,
          fontStyle: 'italic',
          color: '#475569',
          alignment: 'center',
          zIndex: 2,
        },
        {
          id: 'el-recipient',
          type: 'text',
          text: '{{recipient_name}}',
          x: 80,
          y: 190,
          width: 640,
          height: 45,
          fontFamily: 'Helvetica',
          fontSize: 32,
          fontWeight: 'bold',
          color: '#1E1B4B',
          alignment: 'center',
          zIndex: 3,
        },
        {
          id: 'el-line-rec',
          type: 'shape',
          shapeType: 'line',
          x: 220,
          y: 245,
          width: 360,
          height: 2,
          fillColor: '#D97706',
          strokeColor: '#D97706',
          strokeWidth: 2,
          zIndex: 1,
        },
        {
          id: 'el-stmt',
          type: 'text',
          text: 'has successfully participated in the program',
          x: 100,
          y: 260,
          width: 600,
          height: 25,
          fontFamily: 'Times-Roman',
          fontSize: 13,
          fontStyle: 'italic',
          color: '#475569',
          alignment: 'center',
          zIndex: 2,
        },
        {
          id: 'el-event',
          type: 'text',
          text: '{{event_name}}',
          x: 80,
          y: 295,
          width: 640,
          height: 35,
          fontFamily: 'Helvetica',
          fontSize: 20,
          fontWeight: 'bold',
          color: '#0F172A',
          alignment: 'center',
          zIndex: 2,
        },
        {
          id: 'el-date-conduct',
          type: 'text',
          text: 'conducted on {{event_date}}',
          x: 100,
          y: 335,
          width: 600,
          height: 22,
          fontFamily: 'Helvetica',
          fontSize: 12,
          color: '#64748B',
          alignment: 'center',
          zIndex: 2,
        },
        {
          id: 'el-cid',
          type: 'text',
          text: 'Certificate ID: {{certificate_id}}',
          x: 55,
          y: 485,
          width: 260,
          height: 20,
          fontFamily: 'Courier',
          fontSize: 10,
          color: '#64748B',
          alignment: 'left',
          zIndex: 2,
        },
        {
          id: 'el-issue',
          type: 'text',
          text: 'Issue Date: {{issue_date}}',
          x: 55,
          y: 505,
          width: 260,
          height: 20,
          fontFamily: 'Helvetica',
          fontSize: 10,
          color: '#64748B',
          alignment: 'left',
          zIndex: 2,
        },
        {
          id: 'el-sig',
          type: 'text',
          text: 'Authorized Signatory\n{{organization}}',
          x: 520,
          y: 480,
          width: 230,
          height: 40,
          fontFamily: 'Helvetica',
          fontSize: 11,
          fontWeight: 'bold',
          color: '#0F172A',
          alignment: 'center',
          zIndex: 2,
        },
      ],
    },
  },
  {
    id: 'tpl-modern-minimal-02',
    name: 'Modern Minimal',
    description: 'Sleek contemporary design with emerald accent line, airy typography, and high legibility.',
    category: 'Modern',
    orientation: 'landscape',
    canvas_width: 800,
    canvas_height: 566,
    is_system_template: true,
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    configuration: {
      background: '#FFFFFF',
      borderStyle: 'modern_minimal',
      elements: [
        {
          id: 'el-bar',
          type: 'shape',
          shapeType: 'rectangle',
          x: 0,
          y: 0,
          width: 24,
          height: 566,
          fillColor: '#0D9488',
          strokeColor: '#0F766E',
          strokeWidth: 0,
          zIndex: 1,
        },
        {
          id: 'el-org-m',
          type: 'text',
          text: '{{organization}}',
          x: 65,
          y: 55,
          width: 400,
          height: 24,
          fontFamily: 'Helvetica',
          fontSize: 13,
          fontWeight: 'bold',
          color: '#0D9488',
          alignment: 'left',
          zIndex: 2,
        },
        {
          id: 'el-title-m',
          type: 'text',
          text: 'CERTIFICATE OF COMPLETION',
          x: 65,
          y: 95,
          width: 650,
          height: 40,
          fontFamily: 'Helvetica',
          fontSize: 28,
          fontWeight: 'bold',
          color: '#0F172A',
          alignment: 'left',
          zIndex: 2,
        },
        {
          id: 'el-intro-m',
          type: 'text',
          text: 'This certificate is officially presented to',
          x: 65,
          y: 155,
          width: 500,
          height: 24,
          fontFamily: 'Helvetica',
          fontSize: 13,
          color: '#64748B',
          alignment: 'left',
          zIndex: 2,
        },
        {
          id: 'el-rec-m',
          type: 'text',
          text: '{{recipient_name}}',
          x: 65,
          y: 195,
          width: 660,
          height: 50,
          fontFamily: 'Helvetica',
          fontSize: 34,
          fontWeight: 'bold',
          color: '#0F766E',
          alignment: 'left',
          zIndex: 2,
        },
        {
          id: 'el-desc-m',
          type: 'text',
          text: 'in recognition of successful completion and mastery of {{event_name}}, conducted on {{event_date}}.',
          x: 65,
          y: 270,
          width: 640,
          height: 50,
          fontFamily: 'Helvetica',
          fontSize: 14,
          color: '#334155',
          alignment: 'left',
          lineHeight: 1.4,
          zIndex: 2,
        },
        {
          id: 'el-meta-m',
          type: 'text',
          text: 'Credential ID: {{certificate_id}}  •  Issued: {{issue_date}}',
          x: 65,
          y: 490,
          width: 450,
          height: 22,
          fontFamily: 'Courier',
          fontSize: 10,
          color: '#94A3B8',
          alignment: 'left',
          zIndex: 2,
        },
        {
          id: 'el-sig-m',
          type: 'text',
          text: 'Program Director\n{{organization}}',
          x: 540,
          y: 475,
          width: 210,
          height: 38,
          fontFamily: 'Helvetica',
          fontSize: 11,
          fontWeight: 'bold',
          color: '#0F172A',
          alignment: 'right',
          zIndex: 2,
        },
      ],
    },
  },
  {
    id: 'tpl-corporate-blue-03',
    name: 'Corporate Blue',
    description: 'High-authority enterprise design with deep cobalt headers, crisp geometric dividers, and dual verification lines.',
    category: 'Corporate',
    orientation: 'landscape',
    canvas_width: 800,
    canvas_height: 566,
    is_system_template: true,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    configuration: {
      background: '#F8FAFC',
      borderStyle: 'corporate_blue',
      elements: [
        {
          id: 'el-header-box',
          type: 'shape',
          shapeType: 'rectangle',
          x: 25,
          y: 25,
          width: 750,
          height: 85,
          fillColor: '#1E3A8A',
          strokeColor: '#172554',
          strokeWidth: 1,
          zIndex: 1,
        },
        {
          id: 'el-org-c',
          type: 'text',
          text: '{{organization}}',
          x: 45,
          y: 40,
          width: 710,
          height: 20,
          fontFamily: 'Helvetica',
          fontSize: 12,
          fontWeight: 'bold',
          color: '#93C5FD',
          alignment: 'center',
          zIndex: 2,
        },
        {
          id: 'el-title-c',
          type: 'text',
          text: 'CERTIFICATE OF PROFESSIONAL EXCELLENCE',
          x: 45,
          y: 68,
          width: 710,
          height: 30,
          fontFamily: 'Helvetica',
          fontSize: 20,
          fontWeight: 'bold',
          color: '#FFFFFF',
          alignment: 'center',
          zIndex: 2,
        },
        {
          id: 'el-certify-c',
          type: 'text',
          text: 'This credential certifies that',
          x: 100,
          y: 145,
          width: 600,
          height: 22,
          fontFamily: 'Helvetica',
          fontSize: 13,
          color: '#64748B',
          alignment: 'center',
          zIndex: 2,
        },
        {
          id: 'el-rec-c',
          type: 'text',
          text: '{{recipient_name}}',
          x: 60,
          y: 180,
          width: 680,
          height: 45,
          fontFamily: 'Helvetica',
          fontSize: 32,
          fontWeight: 'bold',
          color: '#1E3A8A',
          alignment: 'center',
          zIndex: 2,
        },
        {
          id: 'el-for-c',
          type: 'text',
          text: 'has demonstrated competence and achieved distinction in',
          x: 100,
          y: 245,
          width: 600,
          height: 22,
          fontFamily: 'Helvetica',
          fontSize: 13,
          color: '#64748B',
          alignment: 'center',
          zIndex: 2,
        },
        {
          id: 'el-event-c',
          type: 'text',
          text: '{{event_name}}',
          x: 60,
          y: 280,
          width: 680,
          height: 35,
          fontFamily: 'Helvetica',
          fontSize: 22,
          fontWeight: 'bold',
          color: '#0F172A',
          alignment: 'center',
          zIndex: 2,
        },
        {
          id: 'el-date-c',
          type: 'text',
          text: 'Date of Certification: {{event_date}}  •  ID: {{certificate_id}}',
          x: 100,
          y: 335,
          width: 600,
          height: 22,
          fontFamily: 'Helvetica',
          fontSize: 11,
          color: '#475569',
          alignment: 'center',
          zIndex: 2,
        },
        {
          id: 'el-sig1-c',
          type: 'text',
          text: 'Program Director\n{{organization}}',
          x: 120,
          y: 470,
          width: 200,
          height: 35,
          fontFamily: 'Helvetica',
          fontSize: 10,
          fontWeight: 'bold',
          color: '#1E293B',
          alignment: 'center',
          zIndex: 2,
        },
        {
          id: 'el-sig2-c',
          type: 'text',
          text: 'Board of Evaluators\nCertification Committee',
          x: 480,
          y: 470,
          width: 200,
          height: 35,
          fontFamily: 'Helvetica',
          fontSize: 10,
          fontWeight: 'bold',
          color: '#1E293B',
          alignment: 'center',
          zIndex: 2,
        },
      ],
    },
  },
  {
    id: 'tpl-elegant-black-04',
    name: 'Elegant Black',
    description: 'Luxurious monochrome theme with obsidian borders, platinum accents, and refined serif typography.',
    category: 'Classic',
    orientation: 'landscape',
    canvas_width: 800,
    canvas_height: 566,
    is_system_template: true,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    configuration: {
      background: '#FAF9F6',
      borderStyle: 'elegant_black',
      elements: [
        {
          id: 'el-org-eb',
          type: 'text',
          text: '{{organization}}',
          x: 80,
          y: 55,
          width: 640,
          height: 24,
          fontFamily: 'Times-Roman',
          fontSize: 14,
          fontWeight: 'bold',
          color: '#020617',
          alignment: 'center',
          zIndex: 2,
        },
        {
          id: 'el-title-eb',
          type: 'text',
          text: 'CERTIFICATE OF MERIT',
          x: 80,
          y: 95,
          width: 640,
          height: 36,
          fontFamily: 'Times-Roman',
          fontSize: 26,
          fontWeight: 'bold',
          color: '#020617',
          alignment: 'center',
          zIndex: 2,
        },
        {
          id: 'el-intro-eb',
          type: 'text',
          text: 'Conferred with highest commendations upon',
          x: 80,
          y: 145,
          width: 640,
          height: 22,
          fontFamily: 'Times-Roman',
          fontSize: 13,
          fontStyle: 'italic',
          color: '#52525B',
          alignment: 'center',
          zIndex: 2,
        },
        {
          id: 'el-rec-eb',
          type: 'text',
          text: '{{recipient_name}}',
          x: 60,
          y: 185,
          width: 680,
          height: 48,
          fontFamily: 'Times-Roman',
          fontSize: 34,
          fontWeight: 'bold',
          color: '#09090B',
          alignment: 'center',
          zIndex: 2,
        },
        {
          id: 'el-stmt-eb',
          type: 'text',
          text: 'for exemplary completion of the professional curriculum in',
          x: 80,
          y: 255,
          width: 640,
          height: 22,
          fontFamily: 'Times-Roman',
          fontSize: 13,
          fontStyle: 'italic',
          color: '#52525B',
          alignment: 'center',
          zIndex: 2,
        },
        {
          id: 'el-event-eb',
          type: 'text',
          text: '{{event_name}}',
          x: 80,
          y: 290,
          width: 640,
          height: 34,
          fontFamily: 'Times-Roman',
          fontSize: 22,
          fontWeight: 'bold',
          color: '#18181B',
          alignment: 'center',
          zIndex: 2,
        },
        {
          id: 'el-date-eb',
          type: 'text',
          text: 'Conferred on {{event_date}}  •  Credential ID: {{certificate_id}}',
          x: 80,
          y: 340,
          width: 640,
          height: 20,
          fontFamily: 'Courier',
          fontSize: 10,
          color: '#71717A',
          alignment: 'center',
          zIndex: 2,
        },
        {
          id: 'el-sig-eb',
          type: 'text',
          text: 'Chief Executive Officer\n{{organization}}',
          x: 520,
          y: 475,
          width: 220,
          height: 35,
          fontFamily: 'Times-Roman',
          fontSize: 10,
          fontWeight: 'bold',
          color: '#09090B',
          alignment: 'center',
          zIndex: 2,
        },
      ],
    },
  },
  {
    id: 'tpl-academic-05',
    name: 'Academic',
    description: 'Traditional collegiate diploma aesthetic with decree prose, laurel emblems, and vintage warmth.',
    category: 'Academic',
    orientation: 'landscape',
    canvas_width: 800,
    canvas_height: 566,
    is_system_template: true,
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    configuration: {
      background: '#FDF8EE',
      borderStyle: 'academic',
      elements: [
        {
          id: 'el-org-ac',
          type: 'text',
          text: '{{organization}}',
          x: 70,
          y: 50,
          width: 660,
          height: 26,
          fontFamily: 'Times-Roman',
          fontSize: 16,
          fontWeight: 'bold',
          color: '#78350F',
          alignment: 'center',
          zIndex: 2,
        },
        {
          id: 'el-title-ac',
          type: 'text',
          text: 'DIPLOMA OF ACADEMIC ACHIEVEMENT',
          x: 60,
          y: 90,
          width: 680,
          height: 36,
          fontFamily: 'Times-Roman',
          fontSize: 24,
          fontWeight: 'bold',
          color: '#451A03',
          alignment: 'center',
          zIndex: 2,
        },
        {
          id: 'el-be-it',
          type: 'text',
          text: 'Be it known that by authority of the academic faculty,',
          x: 80,
          y: 140,
          width: 640,
          height: 22,
          fontFamily: 'Times-Roman',
          fontSize: 13,
          fontStyle: 'italic',
          color: '#78350F',
          alignment: 'center',
          zIndex: 2,
        },
        {
          id: 'el-rec-ac',
          type: 'text',
          text: '{{recipient_name}}',
          x: 60,
          y: 180,
          width: 680,
          height: 45,
          fontFamily: 'Times-Roman',
          fontSize: 32,
          fontWeight: 'bold',
          color: '#1C1917',
          alignment: 'center',
          zIndex: 2,
        },
        {
          id: 'el-has-comp',
          type: 'text',
          text: 'has satisfactorily completed all requisite coursework, examinations and standards in',
          x: 80,
          y: 245,
          width: 640,
          height: 24,
          fontFamily: 'Times-Roman',
          fontSize: 13,
          fontStyle: 'italic',
          color: '#78350F',
          alignment: 'center',
          zIndex: 2,
        },
        {
          id: 'el-event-ac',
          type: 'text',
          text: '{{event_name}}',
          x: 60,
          y: 280,
          width: 680,
          height: 34,
          fontFamily: 'Times-Roman',
          fontSize: 22,
          fontWeight: 'bold',
          color: '#451A03',
          alignment: 'center',
          zIndex: 2,
        },
        {
          id: 'el-date-ac',
          type: 'text',
          text: 'Conferred on this {{event_date}} under seal.',
          x: 80,
          y: 325,
          width: 640,
          height: 22,
          fontFamily: 'Times-Roman',
          fontSize: 12,
          fontStyle: 'italic',
          color: '#78350F',
          alignment: 'center',
          zIndex: 2,
        },
        {
          id: 'el-meta-ac',
          type: 'text',
          text: 'Registry Record: {{certificate_id}}',
          x: 60,
          y: 490,
          width: 300,
          height: 20,
          fontFamily: 'Courier',
          fontSize: 9,
          color: '#92400E',
          alignment: 'left',
          zIndex: 2,
        },
        {
          id: 'el-sig-dean',
          type: 'text',
          text: 'Dean of Academic Affairs\n{{organization}}',
          x: 510,
          y: 480,
          width: 230,
          height: 35,
          fontFamily: 'Times-Roman',
          fontSize: 10,
          fontWeight: 'bold',
          color: '#451A03',
          alignment: 'center',
          zIndex: 2,
        },
      ],
    },
  },
  {
    id: 'tpl-creative-gradient-06',
    name: 'Creative Gradient',
    description: 'Vibrant design with energetic violet-fuchsia accents, modern badge geometry, and dynamic layout.',
    category: 'Creative',
    orientation: 'landscape',
    canvas_width: 800,
    canvas_height: 566,
    is_system_template: true,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    configuration: {
      background: '#FAFAFA',
      borderStyle: 'creative_gradient',
      elements: [
        {
          id: 'el-org-cr',
          type: 'text',
          text: '{{organization}}',
          x: 80,
          y: 50,
          width: 640,
          height: 24,
          fontFamily: 'Helvetica',
          fontSize: 14,
          fontWeight: 'bold',
          color: '#9333EA',
          alignment: 'center',
          zIndex: 2,
        },
        {
          id: 'el-title-cr',
          type: 'text',
          text: 'CERTIFICATE OF INNOVATION',
          x: 60,
          y: 90,
          width: 680,
          height: 38,
          fontFamily: 'Helvetica',
          fontSize: 26,
          fontWeight: 'bold',
          color: '#18181B',
          alignment: 'center',
          zIndex: 2,
        },
        {
          id: 'el-intro-cr',
          type: 'text',
          text: 'Presented for creative vision and accomplishment to',
          x: 80,
          y: 145,
          width: 640,
          height: 22,
          fontFamily: 'Helvetica',
          fontSize: 13,
          color: '#71717A',
          alignment: 'center',
          zIndex: 2,
        },
        {
          id: 'el-rec-cr',
          type: 'text',
          text: '{{recipient_name}}',
          x: 60,
          y: 185,
          width: 680,
          height: 48,
          fontFamily: 'Helvetica',
          fontSize: 34,
          fontWeight: 'bold',
          color: '#7C3AED',
          alignment: 'center',
          zIndex: 2,
        },
        {
          id: 'el-stmt-cr',
          type: 'text',
          text: 'for breakthrough participation and collaborative impact in',
          x: 80,
          y: 250,
          width: 640,
          height: 22,
          fontFamily: 'Helvetica',
          fontSize: 13,
          color: '#71717A',
          alignment: 'center',
          zIndex: 2,
        },
        {
          id: 'el-event-cr',
          type: 'text',
          text: '{{event_name}}',
          x: 60,
          y: 285,
          width: 680,
          height: 34,
          fontFamily: 'Helvetica',
          fontSize: 22,
          fontWeight: 'bold',
          color: '#09090B',
          alignment: 'center',
          zIndex: 2,
        },
        {
          id: 'el-date-cr',
          type: 'text',
          text: 'Completed on {{event_date}}  |  Verification: {{certificate_id}}',
          x: 80,
          y: 335,
          width: 640,
          height: 20,
          fontFamily: 'Courier',
          fontSize: 10,
          color: '#A1A1AA',
          alignment: 'center',
          zIndex: 2,
        },
        {
          id: 'el-sig-cr',
          type: 'text',
          text: 'Creative Director\n{{organization}}',
          x: 520,
          y: 475,
          width: 220,
          height: 35,
          fontFamily: 'Helvetica',
          fontSize: 10,
          fontWeight: 'bold',
          color: '#18181B',
          alignment: 'center',
          zIndex: 2,
        },
      ],
    },
  },
];

const getStoredTemplates = (): Template[] => {
  try {
    const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(INITIAL_SYSTEM_TEMPLATES));
      return INITIAL_SYSTEM_TEMPLATES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SYSTEM_TEMPLATES;
  }
};

const saveStoredTemplates = (templates: Template[]) => {
  try {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  } catch (err) {
    console.error('Failed to save templates cache:', err);
  }
};

export const getTemplates = async (category?: string): Promise<Template[]> => {
  try {
    const params = category && category !== 'All' ? { category } : {};
    const res = await apiClient.get<Template[]>('/templates/', { params });
    if (res.data && res.data.length > 0) {
      saveStoredTemplates(res.data);
      return res.data;
    }
  } catch (err) {
    console.warn('Backend templates API unavailable, using local cache:', err);
  }
  let list = getStoredTemplates();
  if (category && category !== 'All') {
    list = list.filter((t) => t.category.toLowerCase() === category.toLowerCase());
  }
  return list;
};

export const getTemplate = async (templateId: string): Promise<Template> => {
  try {
    const res = await apiClient.get<Template>(`/templates/${templateId}`);
    return res.data;
  } catch (err) {
    console.warn('Backend template fetch failed, checking local:', err);
    const list = getStoredTemplates();
    const found = list.find((t) => t.id === templateId);
    if (found) return found;
    throw new Error('Template not found');
  }
};

export const createTemplate = async (data: Partial<Template>): Promise<Template> => {
  const newTpl: Template = {
    id: data.id || `tpl-${Date.now()}`,
    name: data.name || 'Untitled Certificate',
    description: data.description || 'Custom user created template',
    category: data.category || 'Corporate',
    orientation: data.orientation || 'landscape',
    canvas_width: data.canvas_width || 800,
    canvas_height: data.canvas_height || 566,
    configuration: data.configuration || {
      background: '#FFFFFF',
      borderStyle: 'none',
      elements: [],
    },
    is_system_template: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const res = await apiClient.post<Template>('/templates/', newTpl);
    return res.data;
  } catch {
    const current = getStoredTemplates();
    saveStoredTemplates([newTpl, ...current]);
    return newTpl;
  }
};

export const updateTemplate = async (templateId: string, data: Partial<Template>): Promise<Template> => {
  try {
    const res = await apiClient.put<Template>(`/templates/${templateId}`, data);
    return res.data;
  } catch {
    const list = getStoredTemplates().map((t) => {
      if (t.id === templateId) {
        return {
          ...t,
          ...data,
          updated_at: new Date().toISOString(),
        };
      }
      return t;
    });
    saveStoredTemplates(list);
    const updated = list.find((t) => t.id === templateId);
    if (!updated) throw new Error('Template not found');
    return updated;
  }
};

export const deleteTemplate = async (templateId: string): Promise<void> => {
  try {
    await apiClient.delete(`/templates/${templateId}`);
  } catch {
    // Local deletion
  }
  const filtered = getStoredTemplates().filter((t) => t.id !== templateId);
  saveStoredTemplates(filtered);
};

export const duplicateTemplate = async (templateId: string): Promise<Template> => {
  try {
    const res = await apiClient.post<Template>(`/templates/${templateId}/duplicate`);
    return res.data;
  } catch {
    const orig = await getTemplate(templateId);
    const dup: Template = {
      ...orig,
      id: `tpl-${Date.now()}`,
      name: `${orig.name} Copy`,
      description: `Duplicate of ${orig.name}`,
      is_system_template: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const current = getStoredTemplates();
    saveStoredTemplates([dup, ...current]);
    return dup;
  }
};

export const getTemplatePreviewPdfUrl = (templateId: string): string => {
  const base = apiClient.defaults.baseURL || '/api';
  return `${base}/templates/${templateId}/preview`;
};

export const replacePlaceholders = (
  text: string,
  context: {
    recipient_name?: string;
    recipient_email?: string;
    event_name?: string;
    event_date?: string;
    organization?: string;
    certificate_id?: string;
    issue_date?: string;
  }
): string => {
  if (!text) return '';
  return text
    .replace(/\{\{\s*recipient_name\s*\}\}/gi, context.recipient_name || 'Matheesh Kumar')
    .replace(/\{\{\s*recipient_email\s*\}\}/gi, context.recipient_email || 'matheesh@example.com')
    .replace(/\{\{\s*event_name\s*\}\}/gi, context.event_name || 'Python Workshop')
    .replace(/\{\{\s*event_date\s*\}\}/gi, context.event_date || '08 October 2026')
    .replace(/\{\{\s*organization\s*\}\}/gi, context.organization || 'Aereo Learning')
    .replace(/\{\{\s*certificate_id\s*\}\}/gi, context.certificate_id || 'CERT-DEMO-001')
    .replace(/\{\{\s*issue_date\s*\}\}/gi, context.issue_date || '08 October 2026');
};
