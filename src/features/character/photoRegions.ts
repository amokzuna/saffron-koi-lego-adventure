import { analyzePhoto, suggestMinifig, type MinifigSuggestion, type PixelRegion } from './analyzePhoto';
import { cropSourceRect, type CropState } from './crop';
import type { DecodedImage } from './decodeImage';

const FACE_SAMPLE = 64;

function readRegion(image: DecodedImage, sx: number, sy: number, sw: number, sh: number, w: number, h: number): PixelRegion {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(image.source, sx, sy, sw, sh, 0, 0, w, h);
  return { pixels: ctx.getImageData(0, 0, w, h).data, width: w, height: h };
}

/** Samples the cropped face and the area just below it (clothing, if visible) and suggests minifig options. */
export function suggestFromPhoto(image: DecodedImage, crop: CropState): MinifigSuggestion {
  const rect = cropSourceRect(image, crop);
  const face = readRegion(image, rect.x, rect.y, rect.size, rect.size, FACE_SAMPLE, FACE_SAMPLE);
  const belowY = rect.y + rect.size;
  const belowH = Math.min(rect.size * 0.6, image.height - belowY);
  const below = belowH >= rect.size * 0.15 ? readRegion(image, rect.x, belowY, rect.size, belowH, 48, 32) : null;
  return suggestMinifig(analyzePhoto(face, below));
}
