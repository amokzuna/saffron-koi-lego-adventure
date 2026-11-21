import { HEADER_BYTES, validateImageDimensions, validateImageFile } from './imageValidation';
import type { PortraitSource } from './types';

/** Longest side of the in-memory editing copy; larger photos are downscaled for smooth cropping. */
const EDIT_MAX_SIDE = 2048;

export interface DecodedImage {
  source: PortraitSource;
  width: number;
  height: number;
}

export type DecodeResult = { ok: true; image: DecodedImage } | { ok: false; error: string };

async function decodeBlob(blob: Blob): Promise<DecodedImage> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(blob);
    return { source: bitmap, width: bitmap.width, height: bitmap.height };
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function downscale(image: DecodedImage): DecodedImage {
  const longest = Math.max(image.width, image.height);
  if (longest <= EDIT_MAX_SIDE) return image;
  const ratio = EDIT_MAX_SIDE / longest;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * ratio);
  canvas.height = Math.round(image.height * ratio);
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image.source, 0, 0, canvas.width, canvas.height);
  if (image.source instanceof ImageBitmap) image.source.close();
  return { source: canvas, width: canvas.width, height: canvas.height };
}

/** Validates and decodes a user-selected file entirely in the browser. Nothing is uploaded. */
export async function decodeUserImage(file: Blob): Promise<DecodeResult> {
  const header = new Uint8Array(await file.slice(0, HEADER_BYTES).arrayBuffer());
  const fileError = validateImageFile({ size: file.size, header });
  if (fileError) return { ok: false, error: fileError };

  let image: DecodedImage;
  try {
    image = await decodeBlob(file);
  } catch {
    return { ok: false, error: 'We couldn’t read that image. It may be damaged — please try a different file.' };
  }
  const sizeError = validateImageDimensions(image.width, image.height);
  if (sizeError) {
    if (image.source instanceof ImageBitmap) image.source.close();
    return { ok: false, error: sizeError };
  }
  return { ok: true, image: downscale(image) };
}

/** Decodes a stored portrait blob (already validated when it was saved). */
export async function decodeStoredImage(blob: Blob): Promise<PortraitSource> {
  return (await decodeBlob(blob)).source;
}
