import React, { useRef, useState } from 'react';
import { TemplateConfig, TemplateElement } from '../types';
import { replacePlaceholders } from '../api/templates';

interface TemplateCanvasProps {
  config: TemplateConfig;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<TemplateElement>) => void;
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

export const TemplateCanvas: React.FC<TemplateCanvasProps> = ({
  config,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
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
  const [dragStartPos, setDragStartPos] = useState<{ mouseX: number; mouseY: number; elX: number; elY: number } | null>(null);

  // Resizing state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<'se' | 'sw' | 'ne' | 'nw' | null>(null);
  const [resizeStart, setResizeStart] = useState<{ mouseX: number; mouseY: number; w: number; h: number; x: number; y: number } | null>(null);

  const canvasWidth = 800;
  const canvasHeight = 566;

  // Handle Drag Start
  const handleElementMouseDown = (e: React.MouseEvent, el: TemplateElement) => {
    if (isPreviewMode) return;
    e.stopPropagation();
    onSelectElement(el.id);

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
  const handleResizeHandleMouseDown = (e: React.MouseEvent, el: TemplateElement, handle: 'se' | 'sw' | 'ne' | 'nw') => {
    if (isPreviewMode) return;
    e.stopPropagation();
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
    if (isDragging && dragElementId && dragStartPos) {
      const deltaX = (e.clientX - dragStartPos.mouseX) / zoom;
      const deltaY = (e.clientY - dragStartPos.mouseY) / zoom;
      const newX = Math.round(Math.max(0, Math.min(canvasWidth - 20, dragStartPos.elX + deltaX)));
      const newY = Math.round(Math.max(0, Math.min(canvasHeight - 20, dragStartPos.elY + deltaY)));
      onUpdateElement(dragElementId, { x: newX, y: newY });
    } else if (isResizing && selectedElementId && resizeStart) {
      const deltaX = (e.clientX - resizeStart.mouseX) / zoom;
      const deltaY = (e.clientY - resizeStart.mouseY) / zoom;

      let newW = resizeStart.w;
      let newH = resizeStart.h;

      if (resizeHandle === 'se') {
        newW = Math.max(20, Math.round(resizeStart.w + deltaX));
        newH = Math.max(15, Math.round(resizeStart.h + deltaY));
        onUpdateElement(selectedElementId, { width: newW, height: newH });
      }
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

  // Render Distinctive Decorative Borders
  const renderBorderFrames = () => {
    switch (config.borderStyle) {
      case 'classic_gold':
        return (
          <>
            <div className="absolute inset-4 sm:inset-5 border-[3px] border-slate-900 pointer-events-none" />
            <div className="absolute inset-5 sm:inset-6 border-[1.5px] border-amber-600/90 pointer-events-none" />
            <div className="absolute inset-6 sm:inset-7 border-[0.75px] border-slate-800/40 pointer-events-none" />
            {/* Corner Ornamental Diamonds */}
            <div className="absolute top-5 left-5 w-3 h-3 bg-amber-600 rotate-45 pointer-events-none" />
            <div className="absolute top-5 right-5 w-3 h-3 bg-amber-600 rotate-45 pointer-events-none" />
            <div className="absolute bottom-5 left-5 w-3 h-3 bg-amber-600 rotate-45 pointer-events-none" />
            <div className="absolute bottom-5 right-5 w-3 h-3 bg-amber-600 rotate-45 pointer-events-none" />
          </>
        );

      case 'modern_minimal':
        return (
          <>
            <div className="absolute inset-5 border border-slate-200 pointer-events-none" />
            <div className="absolute top-5 bottom-5 left-5 w-3.5 bg-teal-600 pointer-events-none" />
          </>
        );

      case 'corporate_blue':
        return (
          <>
            <div className="absolute inset-5 border-[3px] border-blue-900 pointer-events-none" />
            <div className="absolute inset-6 border border-blue-300 pointer-events-none" />
          </>
        );

      case 'elegant_black':
        return (
          <>
            <div className="absolute inset-5 border-[3px] border-zinc-950 pointer-events-none" />
            <div className="absolute inset-6 border-[0.75px] border-zinc-400 pointer-events-none" />
          </>
        );

      case 'academic':
        return (
          <>
            <div className="absolute inset-5 border-[3px] border-amber-900 pointer-events-none" />
            <div className="absolute inset-6 border border-amber-600/60 pointer-events-none" />
          </>
        );

      case 'creative_gradient':
        return (
          <>
            <div className="absolute inset-4 border-[3px] border-violet-500 pointer-events-none" />
            <div className="absolute inset-5 border border-pink-400 pointer-events-none" />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={() => {
        if (!isDragging && !isResizing) {
          onSelectElement(null);
          setEditingTextId(null);
        }
      }}
      className="relative select-none shadow-2xl transition-all origin-top"
      style={{
        width: `${canvasWidth}px`,
        height: `${canvasHeight}px`,
        backgroundColor: config.background || '#FFFFFF',
        transform: `scale(${zoom})`,
        transformOrigin: 'top center',
      }}
    >
      {/* Decorative Borders */}
      {renderBorderFrames()}

      {/* Elements Rendering */}
      {config.elements.map((el) => {
        const isSelected = selectedElementId === el.id && !isPreviewMode;
        const isEditingThisText = editingTextId === el.id;

        const displayedText = isPreviewMode
          ? replacePlaceholders(el.text || '', sampleContext)
          : el.text || '';

        return (
          <div
            key={el.id}
            onMouseDown={(e) => handleElementMouseDown(e, el)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (el.type === 'text') setEditingTextId(el.id);
            }}
            className={`absolute transition-shadow ${
              isSelected ? 'ring-2 ring-indigo-600 ring-offset-1 cursor-move' : 'cursor-pointer hover:ring-1 hover:ring-indigo-300'
            }`}
            style={{
              left: `${el.x}px`,
              top: `${el.y}px`,
              width: `${el.width}px`,
              height: `${el.height}px`,
              zIndex: el.zIndex || 1,
            }}
          >
            {/* ELEMENT TYPE: TEXT */}
            {el.type === 'text' && (
              <div
                className="w-full h-full flex flex-col justify-center"
                style={{
                  fontFamily: el.fontFamily || 'Helvetica',
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
                    className="w-full h-full bg-white/90 p-1 rounded border border-indigo-500 text-slate-900 focus:outline-none resize-none font-sans text-xs"
                  />
                ) : (
                  <span className="whitespace-pre-wrap select-none truncate">
                    {displayedText}
                  </span>
                )}
              </div>
            )}

            {/* ELEMENT TYPE: SHAPE */}
            {el.type === 'shape' && (
              <div className="w-full h-full flex items-center justify-center">
                {el.shapeType === 'line' ? (
                  <div
                    className="w-full"
                    style={{
                      height: `${el.strokeWidth || 2}px`,
                      backgroundColor: el.fillColor || el.strokeColor || '#D97706',
                    }}
                  />
                ) : el.shapeType === 'circle' ? (
                  <div
                    className="w-full h-full rounded-full"
                    style={{
                      backgroundColor: el.fillColor || '#D97706',
                      borderColor: el.strokeColor || 'transparent',
                      borderWidth: `${el.strokeWidth || 0}px`,
                    }}
                  />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundColor: el.fillColor || '#D97706',
                      borderColor: el.strokeColor || 'transparent',
                      borderWidth: `${el.strokeWidth || 0}px`,
                    }}
                  />
                )}
              </div>
            )}

            {/* ELEMENT TYPE: IMAGE / LOGO / SIGNATURE */}
            {(el.type === 'image' || el.type === 'logo' || el.type === 'signature') && (
              <div className="w-full h-full flex items-center justify-center overflow-hidden">
                {el.src ? (
                  <img
                    src={el.src}
                    alt={el.type}
                    className="w-full h-full object-contain pointer-events-none"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 border border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400 text-[10px] font-mono">
                    {el.type.toUpperCase()}
                  </div>
                )}
              </div>
            )}

            {/* RESIZE HANDLE (Bottom-Right) */}
            {isSelected && (
              <div
                onMouseDown={(e) => handleResizeHandleMouseDown(e, el, 'se')}
                className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-indigo-600 border-2 border-white rounded-full cursor-se-resize shadow-md"
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
