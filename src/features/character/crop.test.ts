import { describe, expect, it } from 'vitest';
import { MAX_ZOOM, clampCrop, cropSourceRect, initialCrop, panCrop, zoomCrop } from './crop';

const landscape = { width: 400, height: 200 };
const portrait = { width: 200, height: 400 };

describe('crop math', () => {
  it('starts with the largest centered square for landscape images', () => {
    expect(cropSourceRect(landscape, initialCrop(landscape))).toEqual({ x: 100, y: 0, size: 200 });
  });

  it('biases portrait images toward the top', () => {
    const rect = cropSourceRect(portrait, initialCrop(portrait));
    expect(rect.size).toBe(200);
    expect(rect.y).toBe(50);
  });

  it('zooming shrinks the region around the same center', () => {
    const crop = zoomCrop(landscape, initialCrop(landscape), 2);
    expect(cropSourceRect(landscape, crop)).toEqual({ x: 150, y: 50, size: 100 });
  });

  it('clamps zoom and keeps the crop inside the image', () => {
    const crop = clampCrop(landscape, { zoom: 99, centerX: -500, centerY: 9999 });
    expect(crop.zoom).toBe(MAX_ZOOM);
    const rect = cropSourceRect(landscape, crop);
    expect(rect.x).toBe(0);
    expect(rect.y + rect.size).toBe(200);
  });

  it('dragging right moves the crop left in image space, scaled to the viewport', () => {
    const start = initialCrop(landscape); // 200px crop shown in a 100px viewport -> 2 image px per screen px
    const moved = panCrop(landscape, start, 10, 0, 100);
    expect(moved.centerX).toBe(start.centerX - 20);
  });
});
