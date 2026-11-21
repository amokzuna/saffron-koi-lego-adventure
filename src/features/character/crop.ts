/**
 * Square crop described in source-image pixels: a zoom level and the crop center.
 * zoom = 1 shows the largest square that fits; higher zoom shows a smaller region.
 */
export interface CropState {
  zoom: number;
  centerX: number;
  centerY: number;
}

export interface ImageSize {
  width: number;
  height: number;
}

export interface SourceRect {
  x: number;
  y: number;
  size: number;
}

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 5;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function cropSize(image: ImageSize, zoom: number): number {
  return Math.min(image.width, image.height) / clamp(zoom, MIN_ZOOM, MAX_ZOOM);
}

/** Keeps zoom in range and the crop square fully inside the image. */
export function clampCrop(image: ImageSize, crop: CropState): CropState {
  const zoom = clamp(crop.zoom, MIN_ZOOM, MAX_ZOOM);
  const half = cropSize(image, zoom) / 2;
  return {
    zoom,
    centerX: clamp(crop.centerX, half, image.width - half),
    centerY: clamp(crop.centerY, half, image.height - half),
  };
}

/**
 * Initial crop: full-width square, biased toward the upper part of portrait photos
 * where faces usually are.
 */
export function initialCrop(image: ImageSize): CropState {
  const size = Math.min(image.width, image.height);
  const centerY = image.height > image.width ? size / 2 + (image.height - size) * 0.25 : image.height / 2;
  return clampCrop(image, { zoom: 1, centerX: image.width / 2, centerY });
}

export function cropSourceRect(image: ImageSize, crop: CropState): SourceRect {
  const c = clampCrop(image, crop);
  const size = cropSize(image, c.zoom);
  return { x: c.centerX - size / 2, y: c.centerY - size / 2, size };
}

/** Moves the crop by a drag of (dx, dy) screen pixels in a viewport `viewportPx` wide. */
export function panCrop(image: ImageSize, crop: CropState, dx: number, dy: number, viewportPx: number): CropState {
  const pxPerScreenPx = cropSize(image, crop.zoom) / viewportPx;
  return clampCrop(image, { ...crop, centerX: crop.centerX - dx * pxPerScreenPx, centerY: crop.centerY - dy * pxPerScreenPx });
}

export function zoomCrop(image: ImageSize, crop: CropState, zoom: number): CropState {
  return clampCrop(image, { ...crop, zoom });
}
