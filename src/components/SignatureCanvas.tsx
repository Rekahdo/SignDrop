import { useRef, useEffect, useState, useCallback } from 'react';
import { RotateCcw, RotateCw, Trash2, PenLine } from 'lucide-react';
import { Point, Stroke } from '../types';
import { drawStrokeOnContext } from '../utils/canvasRenderer';

interface SignatureCanvasProps {
  onStrokesChange?: (strokes: Stroke[], canvasWidth: number, canvasHeight: number) => void;
  strokes: Stroke[];
  setStrokes: React.Dispatch<React.SetStateAction<Stroke[]>>;
}

export function SignatureCanvas({
  onStrokesChange,
  strokes,
  setStrokes,
}: SignatureCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef<Point[]>([]);
  const [history, setHistory] = useState<Stroke[][]>([]);
  const [strokeWidth, setStrokeWidth] = useState<number>(3.5);
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: 400,
  });

  // Re-draw all strokes onto the visible canvas
  const redrawCanvas = useCallback(
    (strokesToDraw: Stroke[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvasDimensions.width;
      const height = canvasDimensions.height;

      // Reset transform and clear
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Scale context for retina/high-DPI display
      ctx.scale(dpr, dpr);

      // Solid white background on the canvas
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // Draw baseline guideline
      const guidelineY = height * 0.78;
      ctx.save();
      ctx.strokeStyle = '#e4e4e7'; // zinc-200
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(32, guidelineY);
      ctx.lineTo(width - 32, guidelineY);
      ctx.stroke();
      ctx.restore();

      // Sign mark "✕" and helper text on canvas
      ctx.save();
      ctx.font = '600 13px system-ui, sans-serif';
      ctx.fillStyle = '#a1a1aa'; // zinc-400
      ctx.fillText('✕', 36, guidelineY - 8);
      ctx.font = '500 11px system-ui, sans-serif';
      ctx.fillStyle = '#d4d4d8'; // zinc-300
      ctx.fillText('Sign on or above this line', 56, guidelineY - 8);
      ctx.restore();

      // Draw all ink strokes (pure black ink)
      for (const stroke of strokesToDraw) {
        drawStrokeOnContext(ctx, stroke, 1, 1);
      }
    },
    [canvasDimensions]
  );

  // Resize canvas to fill container while preserving aspect ratio & high-DPI crispness
  useEffect(() => {
    const updateSize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const rect = container.getBoundingClientRect();
      const logicalWidth = Math.floor(rect.width);
      // Adaptive height: between 260px and 420px
      const logicalHeight = Math.min(420, Math.max(260, Math.floor(logicalWidth * 0.48)));

      const dpr = window.devicePixelRatio || 1;

      canvas.width = logicalWidth * dpr;
      canvas.height = logicalHeight * dpr;
      canvas.style.width = `${logicalWidth}px`;
      canvas.style.height = `${logicalHeight}px`;

      setCanvasDimensions({ width: logicalWidth, height: logicalHeight });
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Whenever canvasDimensions or strokes change, redraw
  useEffect(() => {
    redrawCanvas(strokes);
    if (onStrokesChange) {
      onStrokesChange(strokes, canvasDimensions.width, canvasDimensions.height);
    }
  }, [strokes, canvasDimensions, redrawCanvas, onStrokesChange]);

  // Pointer position helper
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      time: Date.now(),
    };
  };

  // Start Drawing
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Only primary button (left click or touch/pen)
    if (e.button !== 0) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    // Capture pointer to continue drawing even if finger/mouse slides outside canvas boundary
    e.currentTarget.setPointerCapture(e.pointerId);

    isDrawingRef.current = true;
    currentPointsRef.current = [coords];

    const newStroke: Stroke = {
      points: [coords],
      color: '#000000', // Pure black ink
      width: strokeWidth,
    };

    setStrokes((prev) => [...prev, newStroke]);
    // Clear redo history on new action
    setHistory([]);
  };

  // Drawing in progress
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    currentPointsRef.current.push(coords);

    setStrokes((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const lastStroke = updated[updated.length - 1];
      updated[updated.length - 1] = {
        ...lastStroke,
        points: [...lastStroke.points, coords],
      };
      return updated;
    });
  };

  // End Drawing
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    currentPointsRef.current = [];

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore if not captured
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    handlePointerUp(e);
  };

  // Undo last stroke
  const handleUndo = () => {
    if (strokes.length === 0) return;
    const lastStroke = strokes[strokes.length - 1];
    setHistory((prev) => [...prev, [lastStroke]]);
    setStrokes((prev) => prev.slice(0, prev.length - 1));
  };

  // Redo stroke
  const handleRedo = () => {
    if (history.length === 0) return;
    const strokeToRestore = history[history.length - 1][0];
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setStrokes((prev) => [...prev, strokeToRestore]);
  };

  // Clear canvas
  const handleClear = () => {
    if (strokes.length === 0) return;
    setStrokes([]);
    setHistory([]);
  };

  const isEmpty = strokes.length === 0;

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Top Bar above canvas: Pen Stroke Controls & Undo/Redo */}
      <div className="flex items-center justify-between px-1 text-xs text-zinc-500">
        {/* Stroke Width Selector */}
        <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200/80 p-1 rounded-lg">
          <span className="text-[11px] font-semibold text-zinc-500 px-1.5 flex items-center gap-1">
            <PenLine className="w-3.5 h-3.5 text-zinc-700" />
            <span className="hidden sm:inline">Ink:</span>
          </span>
          {[
            { label: 'Fine', width: 2 },
            { label: 'Medium', width: 3.5 },
            { label: 'Bold', width: 5.5 },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setStrokeWidth(item.width)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                strokeWidth === item.width
                  ? 'bg-white text-zinc-950 font-bold shadow-xs border border-zinc-200/60'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Undo, Redo, Quick Wipe */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleUndo}
            disabled={strokes.length === 0}
            className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
            title="Undo stroke"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={history.length === 0}
            className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
            title="Redo stroke"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={isEmpty}
            className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
            title="Wipe canvas"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Signature Canvas Container */}
      <div
        ref={containerRef}
        className="relative w-full rounded-2xl border-2 border-dashed border-zinc-200 bg-white overflow-hidden shadow-xs hover:border-zinc-300 transition-colors"
        style={{ minHeight: '260px' }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          className="signature-canvas block w-full h-full select-none"
        />

        {/* Empty state floating prompt */}
        {isEmpty && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 text-center select-none">
            <div className="w-12 h-12 rounded-full bg-zinc-50 border border-zinc-200/80 flex items-center justify-center text-zinc-400 mb-2">
              <PenLine className="w-6 h-6 stroke-[1.5]" />
            </div>
            <p className="text-sm font-semibold text-zinc-700">Draw your signature here</p>
            <p className="text-xs text-zinc-400 mt-0.5">Use your finger, stylus, or mouse</p>
          </div>
        )}

        {/* Live Stroke Counter badge */}
        {!isEmpty && (
          <div className="absolute top-3 right-3 pointer-events-none">
            <span className="text-[10px] font-medium bg-zinc-100/90 text-zinc-600 px-2 py-0.5 rounded-full border border-zinc-200 backdrop-blur-xs">
              {strokes.length} {strokes.length === 1 ? 'stroke' : 'strokes'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
