import { expect, test, type Page } from '@playwright/test';
import { createFacePng, createPng } from './helpers/png';

function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

async function openSetup(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Customize Hero' }).click();
  await expect(page.getByRole('heading', { name: 'Customize Hero' })).toBeVisible();
}

async function uploadViaButton(page: Page, buffer: Buffer, name = 'face.png', mimeType = 'image/png') {
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: /Upload Photo|Upload a Different Photo/ }).click();
  await (await chooser).setFiles({ name, mimeType, buffer });
}

const menuPreview = (page: Page) => page.getByTestId('hero-preview').first();

test('upload, crop, and save a photo-face hero that persists and plays', async ({ page }) => {
  const errors = trackErrors(page);
  await openSetup(page);
  await expect(page.getByText('never uploaded').first()).toBeVisible();

  await uploadViaButton(page, createFacePng());
  await expect(page.getByTestId('crop-canvas')).toBeVisible();
  // A new photo starts as a minifig built from its colors; switch to the photo face.
  await expect(page.getByTestId('hero-preview').first()).toHaveAttribute('data-face-mode', 'minifig');
  await page.getByLabel(/Photo face/).check();
  await expect(page.getByTestId('hero-preview').first()).toHaveAttribute('data-has-portrait', 'true');

  // Crop interactions: keyboard pan and zoom slider.
  await page.getByTestId('crop-canvas').focus();
  await page.keyboard.press('+');
  await page.keyboard.press('ArrowLeft');
  await page.getByRole('slider', { name: 'Zoom' }).fill('1.5');

  await page.getByLabel(/Classic yellow/).check();
  await page.getByLabel('Green').first().check();
  await page.getByLabel('Hero name').fill('  Tester  ');
  await page.getByRole('button', { name: 'Save Hero' }).click();

  await expect(page.getByTestId('hero-name')).toHaveText('Tester');
  await expect(menuPreview(page)).toHaveAttribute('data-has-portrait', 'true');

  await page.reload();
  await expect(page.getByTestId('hero-name')).toHaveText('Tester');
  await expect(menuPreview(page)).toHaveAttribute('data-has-portrait', 'true');

  await page.getByRole('button', { name: /^Play/ }).click();
  await expect(page.getByTestId('hud-coins')).toBeVisible();
  await expect(page.getByRole('status')).toBeHidden();
  expect(errors).toEqual([]);
});

test('invalid uploads show helpful errors and keep the current hero', async ({ page }) => {
  await openSetup(page);

  await uploadViaButton(page, Buffer.from('definitely not an image'), 'fake.png');
  await expect(page.getByTestId('upload-error')).toContainText('isn’t a supported image');

  await uploadViaButton(page, createPng(32, 32, () => [255, 0, 0]), 'tiny.png');
  await expect(page.getByTestId('upload-error')).toContainText('at least 64×64');

  const huge = Buffer.concat([createPng(64, 64, () => [0, 0, 0]), Buffer.alloc(11 * 1024 * 1024)]);
  await uploadViaButton(page, huge, 'huge.png');
  await expect(page.getByTestId('upload-error')).toContainText('under 10 MB');

  await expect(page.getByTestId('crop-canvas')).toHaveCount(0);
  await expect(page.getByTestId('hero-preview').first()).toHaveAttribute('data-has-portrait', 'false');
});

test('cancel discards edits; remove photo and reset to default persist', async ({ page }) => {
  await openSetup(page);
  await uploadViaButton(page, createFacePng());
  await page.getByLabel(/Photo face/).check();
  await page.getByLabel('Hero name').fill('Keeper');
  await page.getByRole('button', { name: 'Save Hero' }).click();
  await expect(page.getByTestId('hero-name')).toHaveText('Keeper');

  // Cancel leaves the saved hero untouched.
  await page.getByRole('button', { name: 'Customize Hero' }).click();
  await page.getByLabel('Hero name').fill('Discarded');
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByTestId('hero-name')).toHaveText('Keeper');

  // Remove the photo.
  await page.getByRole('button', { name: 'Customize Hero' }).click();
  await page.getByRole('button', { name: 'Remove Photo' }).click();
  await expect(page.getByTestId('hero-preview').first()).toHaveAttribute('data-has-portrait', 'false');
  await page.getByRole('button', { name: 'Save Hero' }).click();
  await page.reload();
  await expect(page.getByTestId('hero-name')).toHaveText('Keeper');
  await expect(menuPreview(page)).toHaveAttribute('data-has-portrait', 'false');

  // Empty names are rejected; reset restores the default hero.
  await page.getByRole('button', { name: 'Customize Hero' }).click();
  await page.getByLabel('Hero name').fill('   ');
  await page.getByRole('button', { name: 'Save Hero' }).click();
  await expect(page.getByText('Please enter a name')).toBeVisible();
  await page.getByRole('button', { name: 'Reset to Default Hero' }).click();
  await page.getByRole('button', { name: 'Save Hero' }).click();
  await expect(page.getByTestId('hero-name')).toHaveText('Hero');
});

test('corrupt saved hero data falls back to the default hero', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('lego-adventure:hero', '{not json'));
  await page.reload();
  await expect(page.getByTestId('hero-name')).toHaveText('Hero');

  // Profile claims a portrait that doesn't exist in IndexedDB.
  await page.evaluate(() =>
    localStorage.setItem('lego-adventure:hero', JSON.stringify({ version: 1, name: 'Ghost', torsoColor: 'red', legsColor: 'blue', style: 'toy', hasPortrait: true })),
  );
  await page.reload();
  await expect(page.getByTestId('hero-name')).toHaveText('Ghost');
  await expect(page.getByText('couldn’t be loaded')).toBeVisible();
  await expect(menuPreview(page)).toHaveAttribute('data-has-portrait', 'false');
  expect(errors).toEqual([]);
});

test('a photo builds a minifig (skin, hair) and only the picked options are saved, not the photo', async ({ page }) => {
  const errors = trackErrors(page);
  await openSetup(page);
  await uploadViaButton(page, createFacePng());
  await expect(page.getByTestId('suggestion-note')).toBeVisible();

  const preview = page.getByTestId('hero-preview').first();
  await expect(preview).toHaveAttribute('data-face-mode', 'minifig');
  await expect(preview).toHaveAttribute('data-hair-style', 'short');
  await expect(preview).not.toHaveAttribute('data-skin-tone', 'classic');
  await expect(page.getByLabel('Short')).toBeChecked();

  await page.getByLabel('Glasses').check();
  await page.getByLabel('Long').check();
  await page.getByLabel('Hero name').fill('Brick Me');
  await page.getByRole('button', { name: 'Save Hero' }).click();
  await expect(page.getByTestId('hero-name')).toHaveText('Brick Me');

  await page.reload();
  await expect(menuPreview(page)).toHaveAttribute('data-face-mode', 'minifig');
  await expect(menuPreview(page)).toHaveAttribute('data-has-portrait', 'false');
  await expect(menuPreview(page)).toHaveAttribute('data-hair-style', 'long');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('lego-adventure:hero') ?? '{}'));
  expect(stored).toMatchObject({ version: 2, faceMode: 'minifig', hasPortrait: false, glasses: true, hairStyle: 'long' });

  await page.getByRole('button', { name: 'Customize Hero' }).click();
  await expect(page.getByLabel('Glasses')).toBeChecked();
  await expect(page.getByLabel(/Photo face/)).toBeDisabled();
  expect(errors).toEqual([]);
});

test('a blocked camera explains what to do', async ({ page, isMobile }) => {
  test.skip(isMobile, 'phones use the native camera picker');
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: () => Promise.reject(new DOMException('denied', 'NotAllowedError')) },
    });
  });
  await openSetup(page);
  await page.getByRole('button', { name: /Take Photo/ }).click();
  await expect(page.getByTestId('camera-error')).toContainText('Camera access was blocked');
  // The setup screen behind the dialog is inert (not focusable or clickable) while the dialog is open.
  expect(await page.evaluate(() => (document.querySelector('.setup-panel') as HTMLElement & { inert: boolean }).inert)).toBe(true);
  await page.getByTestId('camera-dialog').getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByTestId('camera-dialog')).toBeHidden();
  expect(await page.evaluate(() => (document.querySelector('.setup-panel') as HTMLElement & { inert: boolean }).inert)).toBe(false);
});

test('on phones, Take Photo opens the native camera picker', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'touch devices');
  await openSetup(page);
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: /Take Photo/ }).click();
  await (await chooser).setFiles({ name: 'selfie.png', mimeType: 'image/png', buffer: createFacePng() });
  await expect(page.getByTestId('crop-canvas')).toBeVisible();
  await expect(page.getByTestId('suggestion-note')).toBeVisible();
});

test('the hero preview stays visible while scrolling through the options', async ({ page }) => {
  await openSetup(page);
  await uploadViaButton(page, createFacePng());
  const lastOption = page.getByLabel('Hero name');
  await lastOption.scrollIntoViewIfNeeded();
  await page.getByLabel('Glasses').check();
  const viewport = page.viewportSize()!;
  const box = (await page.getByTestId('setup-preview').boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(-1);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
  await expect(page.getByTestId('hero-preview').first()).toBeInViewport();
});
