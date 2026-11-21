import { describe, expect, it } from 'vitest';
import { MAX_FILE_BYTES, sniffImageType, validateImageDimensions, validateImageFile } from './imageValidation';

const bytes = (...values: (number | string)[]) =>
  new Uint8Array(values.flatMap((v) => (typeof v === 'string' ? [...v].map((c) => c.charCodeAt(0)) : [v])));

const PNG = bytes(0x89, 'PNG', 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0);
const JPEG = bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0);
const WEBP = bytes('RIFF', 0, 0, 0, 0, 'WEBP');
const GIF = bytes('GIF89a', 0, 0, 0, 0, 0, 0);

describe('sniffImageType', () => {
  it('recognises PNG, JPEG, and WebP by content', () => {
    expect(sniffImageType(PNG)).toBe('image/png');
    expect(sniffImageType(JPEG)).toBe('image/jpeg');
    expect(sniffImageType(WEBP)).toBe('image/webp');
  });

  it('rejects other formats and short headers', () => {
    expect(sniffImageType(GIF)).toBeNull();
    expect(sniffImageType(bytes('hello world!'))).toBeNull();
    expect(sniffImageType(new Uint8Array([0x89]))).toBeNull();
  });
});

describe('validateImageFile', () => {
  it('accepts a supported image within the size limit', () => {
    expect(validateImageFile({ size: 1000, header: PNG })).toBeNull();
  });

  it('rejects empty, oversized, and unsupported files with helpful messages', () => {
    expect(validateImageFile({ size: 0, header: PNG })).toMatch(/empty/);
    expect(validateImageFile({ size: MAX_FILE_BYTES + 1, header: PNG })).toMatch(/under 10 MB/);
    expect(validateImageFile({ size: 1000, header: GIF })).toMatch(/PNG, JPG, or WebP/);
  });
});

describe('validateImageDimensions', () => {
  it('enforces minimum and maximum sizes', () => {
    expect(validateImageDimensions(64, 64)).toBeNull();
    expect(validateImageDimensions(63, 200)).toMatch(/at least 64/);
    expect(validateImageDimensions(9000, 100)).toMatch(/too large/);
  });
});
