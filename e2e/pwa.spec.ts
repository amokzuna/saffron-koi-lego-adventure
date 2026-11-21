import { expect, test } from '@playwright/test';

test('the web app manifest and icons are served for installation', async ({ request }) => {
  const res = await request.get('/manifest.webmanifest');
  expect(res.ok()).toBe(true);
  const manifest = await res.json();
  expect(manifest).toMatchObject({ display: 'fullscreen', start_url: '/', scope: '/' });
  const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
  expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']));
  expect(manifest.icons.some((i: { purpose: string }) => i.purpose === 'maskable')).toBe(true);
  for (const icon of [...manifest.icons, { src: '/icons/apple-touch-icon.png' }]) {
    const iconRes = await request.get(icon.src);
    expect(iconRes.ok()).toBe(true);
    expect(iconRes.headers()['content-type']).toContain('image/png');
  }
});

test('after the first visit the game works offline', async ({ page, context, browserName, isMobile }) => {
  test.skip(browserName !== 'chromium' || isMobile, 'service worker check runs once on desktop Chromium');
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // Reload once so the page is controlled by the service worker.
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('button', { name: /^Play/ })).toBeVisible();
  await page.getByRole('button', { name: /^Play/ }).click();
  await expect(page.getByTestId('hud-coins')).toBeVisible();
  await expect(page.getByRole('status')).toBeHidden();
  await context.setOffline(false);
});

test('the Install App button appears only when the browser offers installation', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'beforeinstallprompt is a Chromium event');
  await page.goto('/');
  await expect(page.getByTestId('install-button')).toHaveCount(0);

  // Simulate the browser offering installation.
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt') as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
    event.prompt = async () => {
      (window as unknown as { __prompted: boolean }).__prompted = true;
    };
    event.userChoice = Promise.resolve({ outcome: 'accepted' });
    window.dispatchEvent(event);
  });
  await expect(page.getByTestId('install-button')).toContainText('Install App');
  await page.getByTestId('install-button').click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __prompted?: boolean }).__prompted)).toBe(true);
  await expect(page.getByTestId('install-button')).toHaveCount(0);
});

test.describe('on iPhone', () => {
  test.use({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' });

  test('Add to Home Screen shows step-by-step instructions', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('install-button').click();
    await expect(page.getByTestId('ios-install-help')).toContainText('Add to Home Screen');
    await page.getByRole('button', { name: 'Got it' }).click();
    await expect(page.getByTestId('ios-install-help')).toHaveCount(0);
  });
});
