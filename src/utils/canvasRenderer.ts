import { Point, Stroke } from '../types';

/**
 * Renders smooth ink strokes on a 2D canvas context.
 * Uses midpoint quadratic bezier smoothing to simulate fluid handwriting.
 */
export function drawStrokeOnContext(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  scaleX: number = 1,
  scaleY: number = 1
) {
  const points = stroke.points;
  if (!points || points.length === 0) return;

  ctx.save();
  ctx.strokeStyle = stroke.color || '#000000';
  ctx.fillStyle = stroke.color || '#000000';
  ctx.lineWidth = stroke.width * Math.min(scaleX, scaleY);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (points.length === 1) {
    // Single dot
    const p = points[0];
    ctx.beginPath();
    ctx.arc(p.x * scaleX, p.y * scaleY, (ctx.lineWidth / 2), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (points.length === 2) {
    ctx.beginPath();
    ctx.moveTo(points[0].x * scaleX, points[0].y * scaleY);
    ctx.lineTo(points[1].x * scaleX, points[1].y * scaleY);
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x * scaleX, points[0].y * scaleY);

  for (let i = 1; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;

    ctx.quadraticCurveTo(
      current.x * scaleX,
      current.y * scaleY,
      midX * scaleX,
      midY * scaleY
    );
  }

  // Draw to the final point
  const lastPoint = points[points.length - 1];
  ctx.lineTo(lastPoint.x * scaleX, lastPoint.y * scaleY);
  ctx.stroke();

  ctx.restore();
}

/**
 * Exports strokes to a high-resolution JPEG with a SOLID WHITE BACKGROUND.
 * @param strokes The list of captured strokes
 * @param originalWidth Logical width of the drawing area
 * @param originalHeight Logical height of the drawing area
 * @param targetWidth Output image resolution width (default: 2400)
 */
export function exportHighResJpeg(
  strokes: Stroke[],
  originalWidth: number,
  originalHeight: number,
  targetWidth: number = 2400
): Promise<{ dataUrl: string; base64: string; blob: Blob }> {
  return new Promise((resolve, reject) => {
    try {
      const aspectRatio = originalHeight / originalWidth;
      const targetHeight = Math.round(targetWidth * aspectRatio);

      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = targetWidth;
      offscreenCanvas.height = targetHeight;

      const ctx = offscreenCanvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not create offscreen canvas 2D context');
      }

      // CRITICAL: Fill with 100% solid white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Smooth rendering settings
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const scaleX = targetWidth / originalWidth;
      const scaleY = targetHeight / originalHeight;

      // Draw all strokes
      for (const stroke of strokes) {
        drawStrokeOnContext(ctx, stroke, scaleX, scaleY);
      }

      // Export as high-quality JPEG
      const dataUrl = offscreenCanvas.toDataURL('image/jpeg', 0.96);
      const base64 = dataUrl.split(',')[1];

      offscreenCanvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ dataUrl, base64, blob });
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        },
        'image/jpeg',
        0.96
      );
    } catch (err) {
      reject(err);
    }
  });
}
