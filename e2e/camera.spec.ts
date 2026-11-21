import { expect, test } from '@playwright/test';

// Chromium's fake camera supplies a test-pattern video so the capture flow can run headless.
test.use({
  launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] },
  permissions: ['camera'],
});

test('take a photo with the camera and build a minifig from it', async ({ page, isMobile, browserName }) => {
  test.skip(isMobile || browserName !== 'chromium', 'desktop Chromium (phones use the native camera picker)');
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Customize Hero' }).click();
  await page.getByRole('button', { name: /Take Photo/ }).click();
  await expect(page.getByTestId('camera-dialog')).toBeVisible();
  const capture = page.getByRole('button', { name: /Capture/ });
  await expect(capture).toBeEnabled({ timeout: 10_000 });
  await capture.click();
  await expect(page.getByTestId('camera-dialog')).toBeHidden();
  await expect(page.getByTestId('crop-canvas')).toBeVisible();
  await expect(page.getByTestId('suggestion-note')).toBeVisible();
  await page.getByRole('button', { name: 'Save Hero' }).click();
  await expect(page.getByTestId('hero-name')).toBeVisible();
  expect(errors).toEqual([]);
});
