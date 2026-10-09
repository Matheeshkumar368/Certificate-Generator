import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  Edit3,
  Copy,
  Trash2,
  Sparkles,
  Award,
  Layers,
  Calendar,
  ShieldCheck,
  Check,
  X,
  FilePlus2
} from 'lucide-react';
import { getTemplates, createTemplate, duplicateTemplate, deleteTemplate } from '../api/templates';
import { Template } from '../types';
import { LoadingState } from '../components/LoadingState';
import { TemplateCanvas } from '../components/TemplateCanvas';
import { formatDate } from '../utils/formatters';

export const Templates: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);

  // Create Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('Corporate');
  const [selectedBaseTemplateId, setSelectedBaseTemplateId] = useState<string>('blank');

  const fetchTemplatesList = async () => {
    setLoading(true);
    try {
      const data = await getTemplates(activeCategory === 'All' ? undefined : activeCategory);
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplatesList();
  }, [activeCategory]);

  const handleDuplicate = async (id: string) => {
    try {
      const dup = await duplicateTemplate(id);
      await fetchTemplatesList();
      navigate(`/templates/${dup.id}/edit`);
    } catch (err) {
      console.error('Duplicate failed:', err);
    }
  };

  const handleDelete = async (tpl: Template) => {
    if (tpl.is_system_template) {
      setNotification({
        type: 'error',
        message: 'System default templates cannot be deleted directly. Please duplicate it first.',
      });
      return;
    }
    setTemplateToDelete(tpl);
  };

  const confirmDeleteTemplate = async () => {
    if (!templateToDelete) return;
    try {
      await deleteTemplate(templateToDelete.id);
      setNotification({
        type: 'success',
        message: `Template "${templateToDelete.name}" deleted successfully.`,
      });
      setTemplateToDelete(null);
      await fetchTemplatesList();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err?.message || 'Failed to delete template.',
      });
      setTemplateToDelete(null);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    let baseConfig = {
      background: '#FFFFFF',
      borderStyle: 'classic_gold',
      elements: [
        {
          id: 'el-title',
          type: 'text' as const,
          text: 'CERTIFICATE OF ACHIEVEMENT',
          x: 100,
          y: 100,
          width: 600,
          height: 40,
          fontSize: 26,
          fontFamily: 'Helvetica',
          fontWeight: 'bold' as const,
          color: '#0F172A',
          alignment: 'center' as const,
          zIndex: 1,
        },
        {
          id: 'el-name',
          type: 'text' as const,
          text: '{{recipient_name}}',
          x: 100,
          y: 200,
          width: 600,
          height: 45,
          fontSize: 32,
          fontFamily: 'Helvetica',
          fontWeight: 'bold' as const,
          color: '#1E1B4B',
          alignment: 'center' as const,
          zIndex: 2,
        },
      ],
    };

    if (selectedBaseTemplateId !== 'blank') {
      const baseTpl = templates.find((t) => t.id === selectedBaseTemplateId);
      if (baseTpl) {
        baseConfig = JSON.parse(JSON.stringify(baseTpl.configuration));
      }
    }

    try {
      const created = await createTemplate({
        name: newTemplateName.trim(),
        category: newTemplateCategory,
        configuration: baseConfig,
      });
      setCreateModalOpen(false);
      navigate(`/templates/${created.id}/edit`);
    } catch (err) {
      console.error('Create template failed:', err);
    }
  };

  const categories = ['All', 'Corporate', 'Academic', 'Modern', 'Classic', 'Creative'];

  return (
    <div className="space-y-8 animate-fadeIn pb-12 max-w-7xl mx-auto">
      {notification && (
        <div
          role="alert"
          className={`flex items-center justify-between gap-3 p-4 rounded-2xl border text-xs sm:text-sm font-medium shadow-xs ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <span>{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Certificate Templates
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Choose a template or create your own certificate design.
          </p>
        </div>

        <button
          onClick={() => {
            setNewTemplateName('My Custom Certificate');
            setCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs shadow-indigo-200 transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Template</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      {loading ? (
        <LoadingState message="Loading certificate templates..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col group"
            >
              {/* Visual Preview Thumbnail using Canonical TemplateCanvas */}
              <div
                onClick={() => navigate(`/templates/${tpl.id}/edit`)}
                className="relative aspect-[1.414/1] bg-slate-100 border-b border-slate-100 p-3 flex items-center justify-center cursor-pointer overflow-hidden group-hover:bg-slate-200/60 transition-colors"
              >
                <div
                  className="relative overflow-hidden rounded shadow-xs pointer-events-none"
                  style={{ width: 280, height: 198 }}
                >
                  <div
                    style={{
                      transform: 'scale(0.35)',
                      transformOrigin: 'top left',
                      width: 800,
                      height: 566,
                    }}
                  >
                    <TemplateCanvas
                      config={tpl.configuration}
                      isPreviewMode={true}
                      zoom={1}
                    />
                  </div>
                </div>

                <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-3 py-1.5 rounded-lg bg-white/95 text-slate-900 font-bold text-xs shadow-md">
                    Click to Edit
                  </span>
                </div>
              </div>

              {/* Template Metadata & Action Controls */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-900 truncate">
                      {tpl.name}
                    </h3>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 shrink-0">
                      {tpl.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {tpl.description || 'Custom certificate template design.'}
                  </p>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-3 font-medium">
                    <span>A4 {tpl.orientation.toUpperCase()}</span>
                    <span>•</span>
                    <span>Updated {formatDate(tpl.updated_at)}</span>
                  </div>
                </div>

                {/* Actions row */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate(`/templates/${tpl.id}/edit`)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1"
                      title="Edit template in canvas editor"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDuplicate(tpl.id)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                      title="Duplicate template"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {!tpl.is_system_template && (
                      <button
                        onClick={() => handleDelete(tpl)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete custom template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => navigate(`/generate?templateId=${tpl.id}`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200/60 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Use Template</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DELETE CUSTOM TEMPLATE MODAL */}
      {templateToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Delete Custom Template</h3>
              <button
                onClick={() => setTemplateToDelete(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete <strong>{templateToDelete.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTemplateToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteTemplate}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
              >
                Delete Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE TEMPLATE MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FilePlus2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Create New Template</h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="e.g. My Workshop Certificate"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  value={newTemplateCategory}
                  onChange={(e) => setNewTemplateCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 bg-white"
                >
                  <option value="Corporate">Corporate</option>
                  <option value="Academic">Academic</option>
                  <option value="Modern">Modern</option>
                  <option value="Classic">Classic</option>
                  <option value="Creative">Creative</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Starting Design
                </label>
                <select
                  value={selectedBaseTemplateId}
                  onChange={(e) => setSelectedBaseTemplateId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 bg-white"
                >
                  <option value="blank">Blank Template</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      Clone from: {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
                >
                  Create & Launch Editor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
