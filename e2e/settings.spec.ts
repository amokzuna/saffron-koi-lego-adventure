import { expect, test } from '@playwright/test';

test('settings persist and are reachable from the main menu and pause menu', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByLabel('Mute all sound').check();
  await page.getByLabel('Music').fill('20');
  await page.getByLabel('Reduce motion').selectOption('on');
  await page.getByRole('button', { name: 'Back' }).click();

  await page.reload();
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByLabel('Mute all sound')).toBeChecked();
  await expect(page.getByLabel('Reduce motion')).toHaveValue('on');
  await expect(page.getByLabel('Music')).toHaveValue('20');
  await page.getByRole('button', { name: 'Back' }).click();

  await page.getByRole('button', { name: /^Play/ }).click();
  await expect(page.getByTestId('hud-coins')).toBeVisible();
  await page.getByTestId('pause-button').click();
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByTestId('pause-settings')).toBeVisible();
  await page.getByLabel('Mute all sound').uncheck();
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByTestId('pause-menu')).toBeVisible();
  await page.getByRole('button', { name: 'Resume' }).click();
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(800);
  await page.keyboard.up('ArrowRight');
  expect(errors).toEqual([]);
});

test('keyboard focus stays inside the pause dialog', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard navigation');
  await page.goto('/?level=w1-1');
  await expect(page.getByTestId('hud-coins')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Resume' })).toBeFocused();
  for (let i = 0; i < 6; i++) await page.keyboard.press('Tab');
  const insideDialog = await page.evaluate(() => !!document.activeElement?.closest('[data-testid="pause-menu"]'));
  expect(insideDialog).toBe(true);
});

test('on-screen controls can be turned off', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'touch controls');
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByLabel('On-screen controls').selectOption('never');
  await page.getByRole('button', { name: 'Back' }).click();
  await page.getByRole('button', { name: /^Play/ }).click();
  await expect(page.getByTestId('hud-coins')).toBeVisible();
  await expect(page.getByTestId('touch-controls')).toHaveCount(0);
});

test('deleting all saved data resets progress, hero, and settings', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('lego-adventure:progress', JSON.stringify({ version: 1, levels: { 'w1-1': { completed: true, bestStars: 3, bestTimeMs: 1, bestCoins: 1, bestBricks: 3 } } }));
    localStorage.setItem('lego-adventure:hero', JSON.stringify({ version: 1, name: 'Saved', torsoColor: 'red', legsColor: 'blue', style: 'toy', hasPortrait: false }));
  });
  await page.reload();
  await expect(page.getByTestId('hero-name')).toHaveText('Saved');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Delete all saved data…' }).click();
  await page.getByRole('button', { name: 'Yes, delete everything' }).click();
  await expect(page.getByTestId('hero-name')).toHaveText('Hero');
  await expect(page.getByTestId('play-level')).toHaveText('Level 1: Welcome Adventure');
});
