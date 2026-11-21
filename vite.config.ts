/// <reference types="vitest/config" />
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/** Lists files in public/ (they are copied to the site root as-is). */
function publicFiles(dir = 'public'): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? publicFiles(path) : [relative('public', path).split('\\').join('/')];
  });
}

/**
 * Emits dist/sw.js from pwa/service-worker.js with this build's precache list and a content-based version,
 * so every deploy updates installed copies and nothing stale is served. No plugin dependency needed.
 */
function pwaServiceWorker(): Plugin {
  return {
    name: 'pwa-service-worker',
    apply: 'build',
    generateBundle(_options, bundle) {
      const files = ['/', ...Object.keys(bundle).filter((f) => !f.endsWith('.map')).map((f) => `/${f}`), ...publicFiles().map((f) => `/${f}`)];
      const unique = [...new Set(files)].sort();
      const version = createHash('sha256').update(unique.join('\n')).digest('hex').slice(0, 12);
      const template = readFileSync('pwa/service-worker.js', 'utf8');
      if (!template.includes("'__VERSION__'") || !template.includes('__PRECACHE__;')) throw new Error('service-worker.js placeholders missing');
      const source = template.replace("'__VERSION__'", `'${version}'`).replace('__PRECACHE__;', `${JSON.stringify(unique)};`);
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

export default defineConfig({
  plugins: [react(), pwaServiceWorker()],
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: (id) => (id.includes('node_modules/phaser') ? 'phaser' : undefined),
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
