export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MIN_DIMENSION = 64;
export const MAX_DIMENSION = 8192;

export type SupportedImageType = 'image/png' | 'image/jpeg' | 'image/webp';

/** Number of leading bytes needed to recognise every supported format. */
export const HEADER_BYTES = 12;

/** Detects the real image format from the file's leading bytes (independent of name/extension). */
export function sniffImageType(header: Uint8Array): SupportedImageType | null {
  const b = header;
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) {
    return 'image/png';
  }
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  const ascii = (start: number, end: number) => String.fromCharCode(...b.slice(start, end));
  if (b.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  return null;
}

/** Checks size and format before decoding. Returns a user-facing error, or null if OK. */
export function validateImageFile(file: { size: number; header: Uint8Array }): string | null {
  if (file.size === 0) return 'That file is empty. Please choose a PNG, JPG, or WebP image.';
  if (file.size > MAX_FILE_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return `That image is ${mb} MB. Please choose one under ${MAX_FILE_BYTES / (1024 * 1024)} MB.`;
  }
  if (!sniffImageType(file.header)) return 'That file isn’t a supported image. Please choose a PNG, JPG, or WebP file.';
  return null;
}

/** Checks decoded dimensions. Returns a user-facing error, or null if OK. */
export function validateImageDimensions(width: number, height: number): string | null {
  if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
    return `That image is only ${width}×${height} pixels. Please use one at least ${MIN_DIMENSION}×${MIN_DIMENSION} so your face is recognizable.`;
  }
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    return `That image is ${width}×${height} pixels, which is too large to process. Please use one under ${MAX_DIMENSION} pixels per side.`;
  }
  return null;
}
