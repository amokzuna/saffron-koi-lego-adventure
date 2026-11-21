import { defineConfig, devices } from '@playwright/test';

/** Cross-browser projects are opt-in (`npm run test:e2e:cross`) because they need extra browser downloads. */
const crossBrowser = process.env.CROSS_BROWSER === '1';
const CORE_FLOWS = /(smoke|settings|hero)\.spec\.ts/;

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  // Several tests drive real-time platforming; limit parallel browsers so frame timing stays representative.
  workers: 2,
  use: { baseURL: 'http://localhost:4173' },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-landscape', use: { ...devices['Pixel 7 landscape'] } },
    // Core flows on Firefox, Safari (WebKit), and iPhone. Requires `npx playwright install firefox webkit`.
    ...(crossBrowser
      ? [
          { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testMatch: CORE_FLOWS },
          { name: 'webkit', use: { ...devices['Desktop Safari'] }, testMatch: CORE_FLOWS },
          { name: 'iphone-landscape', use: { ...devices['iPhone 13 landscape'] }, testMatch: CORE_FLOWS },
        ]
      : []),
  ],
});
