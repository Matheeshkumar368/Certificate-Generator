import React, { useRef, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { TemplateConfig, TemplateElement } from '../types';
import { replacePlaceholders } from '../api/templates';

interface TemplateCanvasProps {
  config: TemplateConfig;
  selectedElementId?: string | null;
  onSelectElement?: (id: string | null) => void;
  onUpdateElement?: (id: string, updates: Partial<TemplateElement>) => void;
  isPreviewMode?: boolean;
  sampleContext?: {
    recipient_name?: string;
    recipient_email?: string;
    event_name?: string;
    event_date?: string;
    organization?: string;
    certificate_id?: string;
    issue_date?: string;
  };
  zoom?: number;
}

export const resolveCssFontFamily = (fontFamily?: string): string => {
  if (!fontFamily) return "'Plus Jakarta Sans', Helvetica, Arial, sans-serif";
  const lower = fontFamily.toLowerCase();
  if (lower.includes('times')) return "'Times New Roman', Times, Georgia, serif";
  if (lower.includes('playfair')) return "'Playfair Display', Georgia, serif";
  if (lower.includes('cinzel')) return "'Cinzel', Georgia, serif";
  if (lower.includes('courier') || lower.includes('mono'))
    return "'Courier New', Courier, monospace";
  return "'Plus Jakarta Sans', Helvetica, Arial, sans-serif";
};

export const TemplateCanvas: React.FC<TemplateCanvasProps> = ({
  config,
  selectedElementId = null,
  onSelectElement = () => {},
  onUpdateElement = () => {},
  isPreviewMode = false,
  sampleContext = {
    recipient_name: 'Matheesh Kumar',
    recipient_email: 'matheesh@example.com',
    event_name: 'Python Workshop',
    event_date: '08 October 2026',
    organization: 'Aereo Learning',
    certificate_id: 'CERT-DEMO-001',
    issue_date: '08 October 2026',
  },
  zoom = 1,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragElementId, setDragElementId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{
    mouseX: number;
    mouseY: number;
    elX: number;
    elY: number;
  } | null>(null);

  // Resizing state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<'se' | 'sw' | 'ne' | 'nw' | null>(null);
  const [resizeStart, setResizeStart] = useState<{
    mouseX: number;
    mouseY: number;
    w: number;
    h: number;
    x: number;
    y: number;
  } | null>(null);

  const canvasWidth = config.canvas_width || 800;
  const canvasHeight = config.canvas_height || 566;

  // Handle Drag Start
  const handleElementMouseDown = (e: React.MouseEvent, el: TemplateElement) => {
    if (isPreviewMode) return;
    e.stopPropagation();
    onSelectElement(el.id);
    if (editingTextId && editingTextId !== el.id) {
      setEditingTextId(null);
    }

    setIsDragging(true);
    setDragElementId(el.id);
    setDragStartPos({
      mouseX: e.clientX,
      mouseY: e.clientY,
      elX: el.x,
      elY: el.y,
    });
  };

  // Handle Resize Start
  const handleResizeHandleMouseDown = (
    e: React.MouseEvent,
    el: TemplateElement,
    handle: 'se' | 'sw' | 'ne' | 'nw'
  ) => {
    if (isPreviewMode) return;
    e.stopPropagation();
    onSelectElement(el.id);
    setIsResizing(true);
    setResizeHandle(handle);
    setResizeStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      w: el.width,
      h: el.height,
      x: el.x,
      y: el.y,
    });
  };

  // Global Mouse Move on Canvas
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPreviewMode) return;
    if (isDragging && dragElementId && dragStartPos) {
      const deltaX = (e.clientX - dragStartPos.mouseX) / zoom;
      const deltaY = (e.clientY - dragStartPos.mouseY) / zoom;
      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;
      const newX = Math.round(Math.max(0, Math.min(canvasWidth - 20, dragStartPos.elX + deltaX)));
      const newY = Math.round(Math.max(0, Math.min(canvasHeight - 10, dragStartPos.elY + deltaY)));
      onUpdateElement(dragElementId, { x: newX, y: newY });
    } else if (isResizing && selectedElementId && resizeStart && resizeHandle) {
      const deltaX = (e.clientX - resizeStart.mouseX) / zoom;
      const deltaY = (e.clientY - resizeStart.mouseY) / zoom;

      let newX = resizeStart.x;
      let newY = resizeStart.y;
      let newW = resizeStart.w;
      let newH = resizeStart.h;

      if (resizeHandle.includes('e')) {
        newW = Math.max(24, Math.round(resizeStart.w + deltaX));
      }
      if (resizeHandle.includes('s')) {
        newH = Math.max(12, Math.round(resizeStart.h + deltaY));
      }
      if (resizeHandle.includes('w')) {
        const candidateW = Math.max(24, Math.round(resizeStart.w - deltaX));
        newX = Math.round(resizeStart.x + (resizeStart.w - candidateW));
        newW = candidateW;
      }
      if (resizeHandle.includes('n')) {
        const candidateH = Math.max(12, Math.round(resizeStart.h - deltaY));
        newY = Math.round(resizeStart.y + (resizeStart.h - candidateH));
        newH = candidateH;
      }

      onUpdateElement(selectedElementId, { x: newX, y: newY, width: newW, height: newH });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragElementId(null);
    setDragStartPos(null);
    setIsResizing(false);
    setResizeHandle(null);
    setResizeStart(null);
  };

  // Render Distinctive Decorative Borders matching PDF generator coordinates
  const renderBorderFrames = () => {
    switch (config.borderStyle) {
      case 'classic_gold':
        return (
          <>
            <div className="absolute inset-[22px] border-[3px] border-[#0F172A] pointer-events-none" />
            <div className="absolute inset-[26px] border-[1.5px] border-[#D97706] pointer-events-none" />
            <div className="absolute inset-[30px] border-[0.75px] border-[#1E293B]/60 pointer-events-none" />
            {/* Corner Ornamental Diamonds */}
            <div className="absolute top-[25px] left-[25px] w-3 h-3 bg-[#B45309] rotate-45 pointer-events-none" />
            <div className="absolute top-[25px] right-[25px] w-3 h-3 bg-[#B45309] rotate-45 pointer-events-none" />
            <div className="absolute bottom-[25px] left-[25px] w-3 h-3 bg-[#B45309] rotate-45 pointer-events-none" />
            <div className="absolute bottom-[25px] right-[25px] w-3 h-3 bg-[#B45309] rotate-45 pointer-events-none" />
          </>
        );

      case 'modern_minimal':
        return (
          <>
            <div className="absolute inset-[25px] border border-[#E2E8F0] pointer-events-none" />
            <div className="absolute top-[25px] bottom-[25px] left-[25px] w-[10px] bg-[#0D9488] pointer-events-none" />
          </>
        );

      case 'corporate_blue':
        return (
          <>
            <div className="absolute inset-[24px] border-[3px] border-[#1E3A8A] pointer-events-none" />
            <div className="absolute inset-[28px] border border-[#93C5FD] pointer-events-none" />
          </>
        );

      case 'elegant_black':
        return (
          <>
            <div className="absolute inset-[24px] border-[2.5px] border-[#09090B] pointer-events-none" />
            <div className="absolute inset-[30px] border-[0.75px] border-[#71717A] pointer-events-none" />
          </>
        );

      case 'academic':
        return (
          <>
            <div className="absolute inset-[24px] border-[3px] border-[#78350F] pointer-events-none" />
            <div className="absolute inset-[29px] border border-[#D97706] pointer-events-none" />
          </>
        );

      case 'creative_gradient':
        return (
          <>
            <div className="absolute inset-[22px] border-[2.5px] border-[#8B5CF6] pointer-events-none" />
            <div className="absolute inset-[27px] border border-[#EC4899] pointer-events-none" />
          </>
        );

      case 'orange_modern':
        return (
          <>
            <div className="absolute inset-[22px] border-[3px] border-[#EA580C] pointer-events-none" />
            <div className="absolute inset-[27px] border border-[#FDBA74] pointer-events-none" />
          </>
        );

      default:
        return null;
    }
  };

  const sortedElements = [...(config.elements || [])].sort(
    (a, b) => (a.zIndex || 1) - (b.zIndex || 1)
  );

  return (
    <div
      ref={canvasRef}
      data-testid="certificate-canvas"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isPreviewMode) {
          onSelectElement(null);
          setEditingTextId(null);
        }
      }}
      className="relative select-none shadow-2xl transition-all origin-top overflow-hidden"
      style={{
        width: `${canvasWidth}px`,
        height: `${canvasHeight}px`,
        backgroundColor: config.background || '#FCFBF9',
        transform: `scale(${zoom})`,
        transformOrigin: 'top center',
      }}
    >
      {/* Decorative Borders */}
      {renderBorderFrames()}

      {/* Elements Rendering */}
      {sortedElements.map((el) => {
        const isSelected = selectedElementId === el.id && !isPreviewMode;
        const isEditingThisText = editingTextId === el.id && !isPreviewMode;

        const displayedText = isPreviewMode
          ? replacePlaceholders(el.text || '', sampleContext, {
              idDisplayFormat: el.idDisplayFormat,
            })
          : el.text || '';

        const effectiveShapeType =
          el.type === 'line'
            ? 'line'
            : el.type === 'seal'
            ? 'seal'
            : el.shapeType || 'rectangle';

        return (
          <div
            key={el.id}
            data-element-id={el.id}
            data-element-type={el.type}
            onMouseDown={(e) => handleElementMouseDown(e, el)}
            onClick={(e) => {
              e.stopPropagation();
              if (!isPreviewMode) {
                onSelectElement(el.id);
              }
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (!isPreviewMode && (el.type === 'text' || el.type === 'signature')) {
                setEditingTextId(el.id);
              }
            }}
            className={`absolute transition-shadow ${
              isPreviewMode
                ? ''
                : isSelected
                ? 'ring-2 ring-indigo-600 ring-offset-1 cursor-move z-50'
                : 'cursor-pointer hover:ring-1 hover:ring-indigo-400/80'
            }`}
            style={{
              left: `${el.x}px`,
              top: `${el.y}px`,
              width: `${el.width}px`,
              height: `${el.height}px`,
              zIndex: isSelected ? 50 : el.zIndex || 1,
            }}
          >
            {/* ELEMENT TYPE: TEXT */}
            {el.type === 'text' && (
              <div
                className="w-full h-full flex flex-col justify-center overflow-hidden"
                style={{
                  fontFamily: resolveCssFontFamily(el.fontFamily),
                  fontSize: `${el.fontSize || 16}px`,
                  fontWeight: el.fontWeight || 'normal',
                  fontStyle: el.fontStyle || 'normal',
                  color: el.color || '#000000',
                  textAlign: el.alignment || 'center',
                  lineHeight: el.lineHeight || 1.2,
                }}
              >
                {isEditingThisText ? (
                  <textarea
                    autoFocus
                    value={el.text || ''}
                    onChange={(e) => onUpdateElement(el.id, { text: e.target.value })}
                    onBlur={() => setEditingTextId(null)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full h-full bg-white/95 p-1 rounded border border-indigo-500 text-slate-900 focus:outline-none resize-none font-sans text-xs"
                  />
                ) : (
                  <span className="whitespace-pre-wrap break-words select-none w-full block">
                    {displayedText}
                  </span>
                )}
              </div>
            )}

            {/* ELEMENT TYPE: SIGNATURE */}
            {el.type === 'signature' && (
              <div className="w-full h-full flex flex-col items-center justify-end overflow-hidden pb-0.5">
                {el.src ? (
                  <img
                    src={el.src}
                    alt="Signature"
                    className="w-full h-full object-contain pointer-events-none"
                  />
                ) : isEditingThisText ? (
                  <input
                    autoFocus
                    type="text"
                    value={el.text || ''}
                    onChange={(e) => onUpdateElement(el.id, { text: e.target.value })}
                    onBlur={() => setEditingTextId(null)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full h-full bg-white/95 px-2 rounded border border-indigo-500 text-slate-900 focus:outline-none text-xs"
                  />
                ) : (
                  <>
                    <div
                      className="w-full truncate px-1 select-none"
                      style={{
                        fontFamily: "'Playfair Display', 'Times New Roman', Georgia, serif",
                        fontSize: `${el.fontSize || 18}px`,
                        fontWeight: el.fontWeight || 'bold',
                        fontStyle: 'italic',
                        color: el.color || '#1E3A8A',
                        textAlign: el.alignment || 'center',
                      }}
                    >
                      {displayedText || 'Authorized Signatory'}
                    </div>
                    <div className="w-4/5 h-[1px] bg-slate-400 mt-0.5 pointer-events-none" />
                  </>
                )}
              </div>
            )}

            {/* ELEMENT TYPE: SHAPE / LINE / SEAL */}
            {(el.type === 'shape' || el.type === 'line' || el.type === 'seal') && (
              <div className="w-full h-full flex items-center justify-center">
                {effectiveShapeType === 'line' ? (
                  <div
                    className="w-full pointer-events-none"
                    style={{
                      height: `${Math.max(1, el.strokeWidth || 2)}px`,
                      backgroundColor: el.fillColor || el.strokeColor || '#D97706',
                    }}
                  />
                ) : effectiveShapeType === 'seal' ? (
                  <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
                    <div className="absolute -bottom-1.5 left-1/4 w-2.5 h-4 bg-indigo-950 -rotate-12 rounded-xs" />
                    <div className="absolute -bottom-1.5 right-1/4 w-2.5 h-4 bg-indigo-950 rotate-12 rounded-xs" />
                    <div
                      className="w-full h-full rounded-full p-1 shadow-md flex items-center justify-center relative z-10"
                      style={{
                        backgroundColor: el.fillColor || '#D97706',
                      }}
                    >
                      <div
                        className="w-full h-full rounded-full border-2 flex flex-col items-center justify-center text-amber-950 font-bold text-[8px] leading-tight text-center"
                        style={{
                          borderColor: el.strokeColor || '#FEF3C7',
                        }}
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-950 mb-0.5" />
                        <span>OFFICIAL</span>
                      </div>
                    </div>
                  </div>
                ) : effectiveShapeType === 'circle' ? (
                  <div
                    className="w-full h-full rounded-full pointer-events-none"
                    style={{
                      backgroundColor: el.fillColor || '#D97706',
                      borderColor: el.strokeColor || 'transparent',
                      borderStyle: 'solid',
                      borderWidth: `${el.strokeWidth || 0}px`,
                    }}
                  />
                ) : (
                  <div
                    className="w-full h-full pointer-events-none"
                    style={{
                      backgroundColor: el.fillColor || '#D97706',
                      borderColor: el.strokeColor || 'transparent',
                      borderStyle: 'solid',
                      borderWidth: `${el.strokeWidth || 0}px`,
                    }}
                  />
                )}
              </div>
            )}

            {/* ELEMENT TYPE: IMAGE / LOGO */}
            {(el.type === 'image' || el.type === 'logo') && (
              <div className="w-full h-full flex items-center justify-center overflow-hidden">
                {el.src ? (
                  <img
                    src={el.src}
                    alt={el.type}
                    className="w-full h-full object-contain pointer-events-none"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 border border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400 text-[10px] font-mono pointer-events-none">
                    {el.type.toUpperCase()}
                  </div>
                )}
              </div>
            )}

            {/* 4 CORNER RESIZE HANDLES */}
            {isSelected && (
              <>
                <div
                  onMouseDown={(e) => handleResizeHandleMouseDown(e, el, 'nw')}
                  className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-full cursor-nw-resize shadow-xs"
                />
                <div
                  onMouseDown={(e) => handleResizeHandleMouseDown(e, el, 'ne')}
                  className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-full cursor-ne-resize shadow-xs"
                />
                <div
                  onMouseDown={(e) => handleResizeHandleMouseDown(e, el, 'sw')}
                  className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-full cursor-sw-resize shadow-xs"
                />
                <div
                  onMouseDown={(e) => handleResizeHandleMouseDown(e, el, 'se')}
                  className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-indigo-600 border-2 border-white rounded-full cursor-se-resize shadow-md"
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};
