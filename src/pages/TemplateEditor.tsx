import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Copy,
  Eye,
  EyeOff,
  Download,
  Undo2,
  Redo2,
  Type,
  Square,
  Circle,
  Minus,
  Image as ImageIcon,
  PenTool,
  Layers,
  ArrowUp,
  ArrowDown,
  Trash2,
  Sparkles,
  Check,
  ZoomIn,
  ZoomOut,
  ShieldCheck,
  AlertCircle,
  X
} from 'lucide-react';
import { getTemplate, updateTemplate, duplicateTemplate } from '../api/templates';
import { Template, TemplateConfig, TemplateElement } from '../types';
import { TemplateCanvas } from '../components/TemplateCanvas';
import { LoadingState } from '../components/LoadingState';
import { downloadTemplatePreviewPdf } from '../api/certificates';

export const TemplateEditor: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  // Active configuration
  const [config, setConfig] = useState<TemplateConfig>({
    background: '#FFFFFF',
    borderStyle: 'classic_gold',
    canvas_width: 800,
    canvas_height: 566,
    elements: [],
  });

  // Selected element & UI state
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [activeLeftTab, setActiveLeftTab] = useState<'text' | 'shapes' | 'media' | 'background'>(
    'text'
  );
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [zoom, setZoom] = useState(0.95);

  // History stack for Undo/Redo
  const [history, setHistory] = useState<TemplateConfig[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    const fetchTpl = async () => {
      if (!templateId) return;
      setLoading(true);
      setErrorMessage(null);
      try {
        const data = await getTemplate(templateId);
        setTemplate(data);
        const initialCfg = structuredClone(data.configuration);
        setConfig(initialCfg);
        setHistory([initialCfg]);
        setHistoryIndex(0);
        setHasUnsavedChanges(false);
      } catch (err: any) {
        console.error('Failed to load template:', err);
        setErrorMessage(err?.message || 'Failed to load template from server.');
      } finally {
        setLoading(false);
      }
    };
    fetchTpl();
  }, [templateId]);

  // Warn before closing tab with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Push to history
  const updateConfigWithHistory = (newConfig: TemplateConfig) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    const cloned = structuredClone(newConfig);
    setHistory([...nextHistory, cloned]);
    setHistoryIndex(nextHistory.length);
    setConfig(cloned);
    setHasUnsavedChanges(true);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = structuredClone(history[historyIndex - 1]);
      setHistoryIndex(historyIndex - 1);
      setConfig(prev);
      setHasUnsavedChanges(true);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = structuredClone(history[historyIndex + 1]);
      setHistoryIndex(historyIndex + 1);
      setConfig(next);
      setHasUnsavedChanges(true);
    }
  };

  // Element updates
  const handleUpdateElement = (id: string, updates: Partial<TemplateElement>) => {
    const updatedElements = config.elements.map((el) => {
      if (el.id === id) {
        return { ...el, ...updates };
      }
      return el;
    });
    updateConfigWithHistory({ ...config, elements: updatedElements });
  };

  // Add Text Element
  const handleAddText = (
    defaultText = 'Double click to edit',
    fontSize = 18,
    fontWeight: 'normal' | 'bold' = 'normal',
    extra?: Partial<TemplateElement>
  ) => {
    const newId = `el-text-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newElement: TemplateElement = {
      id: newId,
      type: 'text',
      text: defaultText,
      x: 250,
      y: 200,
      width: 300,
      height: Math.max(24, Math.round(fontSize * 1.8)),
      fontSize,
      fontFamily: 'Helvetica',
      fontWeight,
      color: '#0F172A',
      alignment: 'center',
      zIndex: config.elements.length + 1,
      ...extra,
    };
    updateConfigWithHistory({
      ...config,
      elements: [...config.elements, newElement],
    });
    setSelectedElementId(newId);
  };

  // Add Shape / Seal / Line Element
  const handleAddShape = (shapeType: 'rectangle' | 'circle' | 'line' | 'seal') => {
    const newId = `el-${shapeType}-${Date.now()}`;
    const newElement: TemplateElement = {
      id: newId,
      label:
        shapeType === 'seal'
          ? 'Official Gold Seal'
          : shapeType === 'line'
          ? 'Divider Line'
          : shapeType === 'circle'
          ? 'Circle Shape'
          : 'Rectangle Box',
      type: shapeType === 'seal' ? 'seal' : 'shape',
      shapeType,
      x: shapeType === 'seal' ? 368 : 280,
      y: shapeType === 'seal' ? 450 : 220,
      width: shapeType === 'line' ? 240 : shapeType === 'seal' ? 68 : 100,
      height: shapeType === 'line' ? 6 : shapeType === 'seal' ? 68 : 100,
      fillColor: '#D97706',
      strokeColor: shapeType === 'seal' ? '#FEF3C7' : '#B45309',
      strokeWidth: 2,
      zIndex: config.elements.length + 1,
    };
    updateConfigWithHistory({
      ...config,
      elements: [...config.elements, newElement],
    });
    setSelectedElementId(newId);
  };

  // Add Signature Element
  const handleAddSignature = () => {
    const newId = `el-sig-${Date.now()}`;
    const newElement: TemplateElement = {
      id: newId,
      label: 'Signature Script',
      type: 'signature',
      text: 'Authorized Signatory',
      x: 520,
      y: 445,
      width: 220,
      height: 36,
      fontFamily: 'Times-Roman',
      fontSize: 18,
      fontWeight: 'bold',
      fontStyle: 'italic',
      color: '#1E3A8A',
      alignment: 'center',
      zIndex: config.elements.length + 1,
    };
    updateConfigWithHistory({
      ...config,
      elements: [...config.elements, newElement],
    });
    setSelectedElementId(newId);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const newId = `el-img-${Date.now()}`;
      const newElement: TemplateElement = {
        id: newId,
        label: file.name,
        type: 'logo',
        src: base64,
        x: 340,
        y: 200,
        width: 120,
        height: 120,
        zIndex: config.elements.length + 1,
      };
      updateConfigWithHistory({
        ...config,
        elements: [...config.elements, newElement],
      });
      setSelectedElementId(newId);
    };
    reader.readAsDataURL(file);
  };

  const handleDuplicateSelectedElement = () => {
    if (!selectedElementId) return;
    const orig = config.elements.find((el) => el.id === selectedElementId);
    if (!orig) return;

    const newId = `${orig.id}-copy-${Date.now()}`;
    const copy: TemplateElement = {
      ...structuredClone(orig),
      id: newId,
      label: orig.label ? `${orig.label} (Copy)` : undefined,
      x: Math.min(740, orig.x + 16),
      y: Math.min(520, orig.y + 16),
      zIndex: config.elements.length + 1,
    };
    updateConfigWithHistory({
      ...config,
      elements: [...config.elements, copy],
    });
    setSelectedElementId(newId);
  };

  const handleDeleteElement = (id: string) => {
    const filtered = config.elements.filter((el) => el.id !== id);
    updateConfigWithHistory({ ...config, elements: filtered });
    setSelectedElementId(null);
  };

  // Layer Ordering
  const handleMoveLayer = (direction: 'up' | 'down' | 'top' | 'bottom') => {
    if (!selectedElementId) return;
    const currentEl = config.elements.find((el) => el.id === selectedElementId);
    if (!currentEl) return;

    let updated = [...config.elements].sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1));
    const currentIndex = updated.findIndex((el) => el.id === selectedElementId);

    if (direction === 'up' && currentIndex < updated.length - 1) {
      const temp = updated[currentIndex];
      updated[currentIndex] = updated[currentIndex + 1];
      updated[currentIndex + 1] = temp;
    } else if (direction === 'down' && currentIndex > 0) {
      const temp = updated[currentIndex];
      updated[currentIndex] = updated[currentIndex - 1];
      updated[currentIndex - 1] = temp;
    } else if (direction === 'top') {
      updated = updated.filter((el) => el.id !== selectedElementId);
      updated.push(currentEl);
    } else if (direction === 'bottom') {
      updated = updated.filter((el) => el.id !== selectedElementId);
      updated.unshift(currentEl);
    }

    updated = updated.map((el, idx) => ({ ...el, zIndex: idx + 1 }));
    updateConfigWithHistory({ ...config, elements: updated });
  };

  // Save Template to Backend
  const handleSave = async (): Promise<Template | null> => {
    if (!template) return null;
    setSaving(true);
    setErrorMessage(null);
    try {
      const updated = await updateTemplate(template.id, {
        name: template.name,
        category: template.category,
        configuration: config,
      });
      setTemplate(updated);
      setConfig(structuredClone(updated.configuration));
      setHasUnsavedChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      return updated;
    } catch (err: any) {
      console.error('Save failed:', err);
      setErrorMessage(err?.message || 'Failed to save template changes.');
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Duplicate Template
  const handleDuplicate = async () => {
    if (!template) return;
    try {
      if (hasUnsavedChanges) {
        await handleSave();
      }
      const dup = await duplicateTemplate(template.id);
      navigate(`/templates/${dup.id}/edit`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to duplicate template.');
    }
  };

  const handleDownloadPreview = async () => {
    if (!template) return;
    setErrorMessage(null);
    try {
      if (hasUnsavedChanges) {
        await handleSave();
      }
      await downloadTemplatePreviewPdf(template.id, template.name);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to download preview PDF.');
    }
  };

  const handleBackToTemplates = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedModal(true);
      return;
    }
    navigate('/templates');
  };

  const handleUseTemplate = async () => {
    if (!template) return;
    if (hasUnsavedChanges) {
      await handleSave();
    }
    navigate(`/generate?templateId=${template.id}`);
  };

  if (loading || !template) {
    return <LoadingState message="Loading certificate template editor..." />;
  }

  const selectedElement = config.elements.find((el) => el.id === selectedElementId);
  const isCertificateIdElement =
    selectedElement?.type === 'text' &&
    (selectedElement.text?.toLowerCase().includes('certificate_id') ||
      selectedElement.id.includes('cid'));

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] -m-4 sm:-m-6 lg:-m-8 bg-slate-100 overflow-hidden select-none">
      {/* 1. TOP TOOLBAR */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBackToTemplates}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Return to Templates"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Editable Template Name */}
          <input
            type="text"
            value={template.name}
            onChange={(e) => {
              setTemplate({ ...template, name: e.target.value });
              setHasUnsavedChanges(true);
            }}
            className="text-sm font-bold text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-white px-2 py-1 rounded-md border border-transparent focus:border-indigo-400 focus:outline-none max-w-xs truncate"
            title="Click to rename template"
          />

          <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
            {template.category}
          </span>

          {hasUnsavedChanges && (
            <span className="hidden md:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              Unsaved changes
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 mr-2">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-30 rounded transition-colors"
              title="Undo"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-30 rounded transition-colors"
              title="Redo"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Preview Toggle */}
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isPreviewMode
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
            title="Preview with sample variables"
          >
            {isPreviewMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{isPreviewMode ? 'Exit Preview' : 'Preview'}</span>
          </button>

          {/* Download Preview */}
          <button
            onClick={handleDownloadPreview}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors"
            title="Download preview PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>

          {/* Save As / Duplicate */}
          <button
            onClick={handleDuplicate}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors"
            title="Duplicate as new template"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplicate</span>
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all active:scale-95"
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </>
            )}
          </button>

          {/* Use Template */}
          <button
            onClick={handleUseTemplate}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs shadow-indigo-200 transition-all active:scale-95 ml-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Use Template</span>
          </button>
        </div>
      </header>

      {/* Error Banner if Save/Load Fails */}
      {errorMessage && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. MAIN 3-COLUMN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN: ELEMENTS PANEL */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 z-20">
          {/* Sub-Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50/50 p-1">
            <button
              onClick={() => setActiveLeftTab('text')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeLeftTab === 'text'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Text
            </button>
            <button
              onClick={() => setActiveLeftTab('shapes')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeLeftTab === 'shapes'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Shapes
            </button>
            <button
              onClick={() => setActiveLeftTab('media')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeLeftTab === 'media'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Media
            </button>
            <button
              onClick={() => setActiveLeftTab('background')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeLeftTab === 'background'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Style
            </button>
          </div>

          {/* Left Tab Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* TEXT TAB */}
            {activeLeftTab === 'text' && (
              <div className="space-y-4">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Add Text Blocks
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleAddText('Add a heading', 28, 'bold')}
                      className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-300 text-left font-bold text-sm text-slate-800 transition-colors flex items-center justify-between"
                    >
                      <span>Add a heading</span>
                      <Type className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      onClick={() => handleAddText('Add a subheading', 18, 'bold')}
                      className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-300 text-left font-semibold text-xs text-slate-700 transition-colors flex items-center justify-between"
                    >
                      <span>Add a subheading</span>
                      <Type className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    <button
                      onClick={() => handleAddText('Add body text', 13, 'normal')}
                      className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-300 text-left text-xs text-slate-600 transition-colors flex items-center justify-between"
                    >
                      <span>Add body text</span>
                      <Type className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* Dynamic Placeholders */}
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Dynamic Placeholders
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {[
                      { label: 'Recipient Name', tag: '{{recipient_name}}', size: 28 },
                      { label: 'Recipient Email', tag: '{{recipient_email}}', size: 12 },
                      { label: 'Event Name', tag: '{{event_name}}', size: 20 },
                      { label: 'Event Date', tag: '{{event_date}}', size: 12 },
                      { label: 'Organization', tag: '{{organization}}', size: 15 },
                      {
                        label: 'Certificate ID Label',
                        tag: 'CERTIFICATE ID',
                        size: 9,
                        extra: { alignment: 'left' as const, color: '#64748B', width: 200, height: 18 },
                      },
                      {
                        label: 'Certificate ID Value',
                        tag: '{{certificate_id}}',
                        size: 10,
                        extra: {
                          fontFamily: 'Courier',
                          alignment: 'left' as const,
                          idDisplayFormat: 'full' as const,
                          width: 260,
                          height: 20,
                        },
                      },
                      { label: 'Issue Date', tag: '{{issue_date}}', size: 10 },
                    ].map((p) => (
                      <button
                        key={p.label}
                        onClick={() => handleAddText(p.tag, p.size, 'bold', p.extra)}
                        className="py-1.5 px-2.5 rounded-lg border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-100/70 text-left text-[11px] font-mono text-indigo-700 font-medium transition-colors truncate"
                        title={`Click to add ${p.label}`}
                      >
                        + {p.label} ({p.tag})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SHAPES TAB */}
            {activeLeftTab === 'shapes' && (
              <div className="space-y-4">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Standard Shapes & Seals
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAddShape('rectangle')}
                    className="p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 flex flex-col items-center gap-1.5 transition-colors"
                  >
                    <Square className="w-6 h-6 text-amber-600" />
                    <span className="text-[11px] font-medium text-slate-700">Box</span>
                  </button>
                  <button
                    onClick={() => handleAddShape('circle')}
                    className="p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 flex flex-col items-center gap-1.5 transition-colors"
                  >
                    <Circle className="w-6 h-6 text-amber-600" />
                    <span className="text-[11px] font-medium text-slate-700">Circle</span>
                  </button>
                  <button
                    onClick={() => handleAddShape('line')}
                    className="p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 flex flex-col items-center gap-1.5 transition-colors"
                  >
                    <Minus className="w-6 h-6 text-amber-600" />
                    <span className="text-[11px] font-medium text-slate-700">Line</span>
                  </button>
                  <button
                    onClick={() => handleAddShape('seal')}
                    className="p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 flex flex-col items-center gap-1.5 transition-colors"
                  >
                    <ShieldCheck className="w-6 h-6 text-amber-600" />
                    <span className="text-[11px] font-medium text-slate-700">Gold Seal</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Signatures
                  </div>
                  <button
                    onClick={handleAddSignature}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-300 text-left text-xs font-semibold text-slate-700 flex items-center justify-between transition-colors"
                  >
                    <span>Add Signature Block</span>
                    <PenTool className="w-4 h-4 text-indigo-600" />
                  </button>
                </div>
              </div>
            )}

            {/* MEDIA TAB */}
            {activeLeftTab === 'media' && (
              <div className="space-y-4">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Upload Logo or Seal
                </div>
                <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-4 text-center flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50 hover:bg-indigo-50/30">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <ImageIcon className="w-6 h-6 text-indigo-600 mb-1.5" />
                  <span className="text-xs font-semibold text-slate-800">Choose Image</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG up to 5MB</span>
                </label>
              </div>
            )}

            {/* BACKGROUND & STYLE TAB */}
            {activeLeftTab === 'background' && (
              <div className="space-y-4">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Background Color
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.background || '#FFFFFF'}
                      onChange={(e) =>
                        updateConfigWithHistory({ ...config, background: e.target.value })
                      }
                      className="w-10 h-10 rounded-xl border border-slate-300 cursor-pointer p-0.5"
                    />
                    <span className="font-mono text-xs text-slate-700">{config.background}</span>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Decorative Border Style
                  </div>
                  <select
                    value={config.borderStyle || 'classic_gold'}
                    onChange={(e) =>
                      updateConfigWithHistory({ ...config, borderStyle: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white"
                  >
                    <option value="classic_gold">Classic Gold (Double Navy/Gold)</option>
                    <option value="orange_modern">Orange Gold Frame</option>
                    <option value="modern_minimal">Modern Minimal (Emerald Bar)</option>
                    <option value="corporate_blue">Corporate Blue (Cobalt Frame)</option>
                    <option value="elegant_black">Elegant Black (Obsidian)</option>
                    <option value="academic">Academic (Ivy League)</option>
                    <option value="creative_gradient">Creative Gradient (Violet/Pink)</option>
                    <option value="none">None (Clean Margin)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* CENTER COLUMN: CANVAS WORKSPACE */}
        <main
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedElementId(null);
            }
          }}
          className="flex-1 bg-slate-200/80 p-6 flex flex-col items-center justify-start overflow-auto relative"
        >
          {/* Zoom & Canvas Toolbar */}
          <div className="mb-4 flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl shadow-xs border border-slate-200 text-xs text-slate-600">
            <button
              onClick={() => setZoom(Math.max(0.5, Number((zoom - 0.1).toFixed(2))))}
              className="p-1 hover:text-slate-900 rounded"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(1.5, Number((zoom + 0.1).toFixed(2))))}
              className="p-1 hover:text-slate-900 rounded"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => setZoom(0.95)}
              className="hover:text-slate-900"
              title="Reset Zoom"
            >
              Reset
            </button>
          </div>

          {/* The Certificate Canvas */}
          <div className="pb-16">
            <TemplateCanvas
              config={config}
              selectedElementId={selectedElementId}
              onSelectElement={setSelectedElementId}
              onUpdateElement={handleUpdateElement}
              isPreviewMode={isPreviewMode}
              zoom={zoom}
            />
          </div>
        </main>

        {/* RIGHT COLUMN: PROPERTIES PANEL */}
        <aside className="w-72 bg-white border-l border-slate-200 flex flex-col shrink-0 z-20">
          <div className="h-11 px-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider truncate">
              {selectedElement
                ? `${selectedElement.type.toUpperCase()} Properties`
                : 'Canvas Properties'}
            </span>
            {selectedElement && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleDuplicateSelectedElement}
                  className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                  title="Duplicate Element"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteElement(selectedElement.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                  title="Delete Element"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
            {selectedElement ? (
              <>
                {/* 1. Position & Dimensions */}
                <div>
                  <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-2">
                    Position & Size
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 font-medium">X (px)</label>
                      <input
                        type="number"
                        value={selectedElement.x}
                        onChange={(e) =>
                          handleUpdateElement(selectedElement.id, {
                            x: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-mono text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-medium">Y (px)</label>
                      <input
                        type="number"
                        value={selectedElement.y}
                        onChange={(e) =>
                          handleUpdateElement(selectedElement.id, {
                            y: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-mono text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-medium">Width (px)</label>
                      <input
                        type="number"
                        value={selectedElement.width}
                        onChange={(e) =>
                          handleUpdateElement(selectedElement.id, {
                            width: Math.max(20, parseInt(e.target.value, 10) || 20),
                          })
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-mono text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-medium">Height (px)</label>
                      <input
                        type="number"
                        value={selectedElement.height}
                        onChange={(e) =>
                          handleUpdateElement(selectedElement.id, {
                            height: Math.max(6, parseInt(e.target.value, 10) || 10),
                          })
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-mono text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Text / Signature Properties */}
                {(selectedElement.type === 'text' || selectedElement.type === 'signature') && (
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div>
                      <label className="text-[10px] text-slate-500 font-medium block mb-1">
                        Text Content
                      </label>
                      <textarea
                        value={selectedElement.text || ''}
                        onChange={(e) =>
                          handleUpdateElement(selectedElement.id, { text: e.target.value })
                        }
                        rows={3}
                        className="w-full p-2 rounded-lg border border-slate-200 text-xs font-sans text-slate-800 resize-none"
                      />
                    </div>

                    {isCertificateIdElement && (
                      <div>
                        <label className="text-[10px] text-slate-500 font-medium block mb-1">
                          Certificate ID Display Format
                        </label>
                        <select
                          value={selectedElement.idDisplayFormat || 'full'}
                          onChange={(e) =>
                            handleUpdateElement(selectedElement.id, {
                              idDisplayFormat: e.target.value as 'full' | 'short',
                            })
                          }
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white"
                        >
                          <option value="full">Full UUID (Complete ID)</option>
                          <option value="short">Shortened (CERT-XXXXXXXX)</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] text-slate-500 font-medium block mb-1">
                        Font Family
                      </label>
                      <select
                        value={selectedElement.fontFamily || 'Helvetica'}
                        onChange={(e) =>
                          handleUpdateElement(selectedElement.id, { fontFamily: e.target.value })
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white"
                      >
                        <option value="Helvetica">Helvetica (Clean Sans)</option>
                        <option value="Times-Roman">Times-Roman (Classic Serif)</option>
                        <option value="Courier">Courier (Monospace)</option>
                        <option value="Playfair Display">Playfair Display (Luxury)</option>
                        <option value="Cinzel">Cinzel (Diplomatic)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 font-medium block mb-1">
                          Size (px)
                        </label>
                        <input
                          type="number"
                          value={selectedElement.fontSize || 16}
                          onChange={(e) =>
                            handleUpdateElement(selectedElement.id, {
                              fontSize: Math.max(8, parseInt(e.target.value, 10) || 12),
                            })
                          }
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-mono text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-medium block mb-1">
                          Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={selectedElement.color || '#000000'}
                            onChange={(e) =>
                              handleUpdateElement(selectedElement.id, { color: e.target.value })
                            }
                            className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0.5"
                          />
                          <span className="font-mono text-[11px] text-slate-700 truncate">
                            {selectedElement.color}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 pt-1">
                      <button
                        onClick={() =>
                          handleUpdateElement(selectedElement.id, {
                            fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold',
                          })
                        }
                        className={`flex-1 py-1.5 rounded border text-xs font-bold ${
                          selectedElement.fontWeight === 'bold'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 text-slate-700'
                        }`}
                      >
                        B
                      </button>
                      <button
                        onClick={() =>
                          handleUpdateElement(selectedElement.id, {
                            fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic',
                          })
                        }
                        className={`flex-1 py-1.5 rounded border text-xs italic ${
                          selectedElement.fontStyle === 'italic'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 text-slate-700'
                        }`}
                      >
                        I
                      </button>
                      <button
                        onClick={() =>
                          handleUpdateElement(selectedElement.id, { alignment: 'left' })
                        }
                        className={`flex-1 py-1.5 rounded border text-[11px] ${
                          selectedElement.alignment === 'left'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 text-slate-700'
                        }`}
                      >
                        Left
                      </button>
                      <button
                        onClick={() =>
                          handleUpdateElement(selectedElement.id, { alignment: 'center' })
                        }
                        className={`flex-1 py-1.5 rounded border text-[11px] ${
                          selectedElement.alignment === 'center'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 text-slate-700'
                        }`}
                      >
                        Center
                      </button>
                      <button
                        onClick={() =>
                          handleUpdateElement(selectedElement.id, { alignment: 'right' })
                        }
                        className={`flex-1 py-1.5 rounded border text-[11px] ${
                          selectedElement.alignment === 'right'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 text-slate-700'
                        }`}
                      >
                        Right
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Shape / Seal / Line Properties */}
                {(selectedElement.type === 'shape' ||
                  selectedElement.type === 'line' ||
                  selectedElement.type === 'seal') && (
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div>
                      <label className="text-[10px] text-slate-500 font-medium block mb-1">
                        Fill Color
                      </label>
                      <input
                        type="color"
                        value={selectedElement.fillColor || '#D97706'}
                        onChange={(e) =>
                          handleUpdateElement(selectedElement.id, { fillColor: e.target.value })
                        }
                        className="w-full h-8 rounded border border-slate-200 cursor-pointer p-0.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-medium block mb-1">
                        Stroke Color
                      </label>
                      <input
                        type="color"
                        value={selectedElement.strokeColor || '#B45309'}
                        onChange={(e) =>
                          handleUpdateElement(selectedElement.id, { strokeColor: e.target.value })
                        }
                        className="w-full h-8 rounded border border-slate-200 cursor-pointer p-0.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-medium block mb-1">
                        Stroke Width (px)
                      </label>
                      <input
                        type="number"
                        value={selectedElement.strokeWidth ?? 2}
                        onChange={(e) =>
                          handleUpdateElement(selectedElement.id, {
                            strokeWidth: Math.max(0, parseInt(e.target.value, 10) || 0),
                          })
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-mono text-slate-800"
                      />
                    </div>
                  </div>
                )}

                {/* 4. Layer Ordering */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                    Layer Order
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => handleMoveLayer('up')}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-medium text-slate-700 flex items-center justify-center gap-1"
                    >
                      <ArrowUp className="w-3 h-3" />
                      <span>Forward</span>
                    </button>
                    <button
                      onClick={() => handleMoveLayer('down')}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-medium text-slate-700 flex items-center justify-center gap-1"
                    >
                      <ArrowDown className="w-3 h-3" />
                      <span>Backward</span>
                    </button>
                    <button
                      onClick={() => handleMoveLayer('top')}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-medium text-slate-700"
                    >
                      To Front
                    </button>
                    <button
                      onClick={() => handleMoveLayer('bottom')}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-medium text-slate-700"
                    >
                      To Back
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* CANVAS PROPERTIES & ELEMENT LAYERS LIST */
              <div className="space-y-5">
                <div>
                  <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-2">
                    Canvas Background
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.background || '#FCFBF9'}
                      onChange={(e) =>
                        updateConfigWithHistory({ ...config, background: e.target.value })
                      }
                      className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                    />
                    <span className="font-mono text-xs text-slate-700">{config.background}</span>
                  </div>
                </div>

                <div>
                  <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-2">
                    Border Frame
                  </div>
                  <select
                    value={config.borderStyle || 'classic_gold'}
                    onChange={(e) =>
                      updateConfigWithHistory({ ...config, borderStyle: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white"
                  >
                    <option value="classic_gold">Classic Gold</option>
                    <option value="orange_modern">Orange Gold Frame</option>
                    <option value="modern_minimal">Modern Minimal</option>
                    <option value="corporate_blue">Corporate Blue</option>
                    <option value="elegant_black">Elegant Black</option>
                    <option value="academic">Academic</option>
                    <option value="creative_gradient">Creative Gradient</option>
                    <option value="none">None</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                      Canvas Elements ({config.elements.length})
                    </span>
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                    {config.elements.map((el) => (
                      <button
                        key={el.id}
                        type="button"
                        onClick={() => setSelectedElementId(el.id)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/40 text-left flex items-center justify-between gap-2 transition-colors"
                      >
                        <span className="truncate font-medium text-slate-700 text-[11px]">
                          {el.label || el.text || `${el.type.toUpperCase()} (${el.id})`}
                        </span>
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0">
                          {el.type}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Unsaved Changes Confirmation Modal */}
      {showUnsavedModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Unsaved Template Changes</h3>
              <button
                onClick={() => setShowUnsavedModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              You have unsaved edits in <strong>{template.name}</strong>. Would you like to save your changes before leaving?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUnsavedModal(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUnsavedModal(false);
                  navigate('/templates');
                }}
                className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-700"
              >
                Discard & Leave
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleSave();
                  setShowUnsavedModal(false);
                  navigate('/templates');
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
              >
                Save & Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
