import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { MAX_ZOOM, MIN_ZOOM, cropSourceRect, panCrop, zoomCrop, type CropState } from '../../features/character/crop';
import type { DecodedImage } from '../../features/character/decodeImage';

interface Props {
  image: DecodedImage;
  crop: CropState;
  onChange: (crop: CropState) => void;
}

const KEY_STEP_PX = 12;

/** Square crop editor: drag (mouse or touch) or arrow keys to move, slider or +/- keys to zoom. */
export function CropEditor({ image, crop, onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cssSize = canvas.clientWidth || 240;
    const px = Math.round(cssSize * Math.min(window.devicePixelRatio || 1, 3));
    if (canvas.width !== px) canvas.width = canvas.height = px;
    const ctx = canvas.getContext('2d')!;
    const rect = cropSourceRect(image, crop);
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, px, px);
    ctx.drawImage(image.source, rect.x, rect.y, rect.size, rect.size, 0, 0, px, px);
  }, [image, crop]);

  const viewport = () => canvasRef.current?.clientWidth || 240;

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Capture is a nicety; dragging still works within the canvas.
    }
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    onChange(panCrop(image, crop, e.clientX - d.x, e.clientY - d.y, viewport()));
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
  };
  const endDrag = () => {
    drag.current = null;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLCanvasElement>) => {
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [KEY_STEP_PX, 0],
      ArrowRight: [-KEY_STEP_PX, 0],
      ArrowUp: [0, KEY_STEP_PX],
      ArrowDown: [0, -KEY_STEP_PX],
    };
    const move = moves[e.key];
    if (move) {
      e.preventDefault();
      onChange(panCrop(image, crop, move[0], move[1], viewport()));
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      onChange(zoomCrop(image, crop, crop.zoom * 1.15));
    } else if (e.key === '-') {
      e.preventDefault();
      onChange(zoomCrop(image, crop, crop.zoom / 1.15));
    }
  };

  return (
    <div className="crop-editor">
      <div className="crop-frame">
        <canvas
          ref={canvasRef}
          className="crop-canvas"
          tabIndex={0}
          role="img"
          aria-label="Photo crop area. Drag or use arrow keys to move; plus and minus keys to zoom."
          data-testid="crop-canvas"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={onKeyDown}
        />
        <div className="crop-guide" aria-hidden="true" />
      </div>
      <label className="zoom-control">
        <span>Zoom</span>
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.01}
          value={crop.zoom}
          onChange={(e) => onChange(zoomCrop(image, crop, Number(e.target.value)))}
        />
      </label>
      <p className="muted small">Drag to position your face inside the square. Everything inside becomes your hero’s face.</p>
    </div>
  );
}
