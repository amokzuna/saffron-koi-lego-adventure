import { expect, test, type Page } from '@playwright/test';

async function startGame(page: Page, levelId?: string) {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  if (levelId) {
    await page.goto(`/?level=${levelId}`);
  } else {
    await page.goto('/');
    await page.getByRole('button', { name: /^(Play|Continue)/ }).click();
  }
  await expect(page.getByTestId('hud-coins')).toBeVisible();
  await expect(page.getByRole('status')).toBeHidden();
  await expect(page.locator('canvas')).toBeVisible();
  return errors;
}

const hearts = async (page: Page) => Number(await page.getByTestId('hud-hearts').getAttribute('data-hearts'));
const coinCount = async (page: Page) => Number((await page.getByTestId('hud-coins').innerText()).split('/')[0]);

test.describe('desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'keyboard flow');

  test('play, collect, pause, restart, and exit', async ({ page }) => {
    const errors = await startGame(page);
    expect(await coinCount(page)).toBe(0);

    // The first coins sit on the ground just right of spawn.
    await page.keyboard.down('ArrowRight');
    await expect.poll(() => coinCount(page), { timeout: 3000 }).toBeGreaterThan(0);
    await page.keyboard.up('ArrowRight');

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('pause-menu')).toBeVisible();
    const pausedTime = await page.getByTestId('hud-time').innerText();
    await page.waitForTimeout(500);
    expect(await page.getByTestId('hud-time').innerText()).toBe(pausedTime);

    await page.getByRole('button', { name: 'Resume' }).click();
    await expect(page.getByTestId('pause-menu')).toBeHidden();

    await page.getByTestId('pause-button').click();
    await page.getByRole('button', { name: 'Restart Level' }).click();
    await expect(page.getByTestId('pause-menu')).toBeHidden();
    await expect.poll(() => coinCount(page)).toBe(0);

    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Level Map' }).click();
    await expect(page.getByTestId('confirm-exit')).toBeVisible();
    await page.getByRole('button', { name: 'Leave to Level Map' }).click();
    await expect(page.getByRole('heading', { name: 'Level Select' })).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('sandbox: hazards and enemies cost hearts, the goal shows a rated result', async ({ page }) => {
    const errors = await startGame(page, 'sandbox');
    expect(await hearts(page)).toBe(3);

    // Walking right: checkpoint, spikes (-1), walker (-1), extra heart (+1), brick, goal.
    await page.keyboard.down('ArrowRight');
    await expect(page.getByTestId('level-complete')).toBeVisible({ timeout: 15_000 });
    await page.keyboard.up('ArrowRight');

    await expect(page.getByTestId('result-hearts-lost')).toHaveText('2');
    expect(await hearts(page)).toBe(2);
    await expect(page.getByTestId('result-stars')).toHaveAttribute('data-stars', '3');
    await expect(page.getByText('Find the build brick')).toBeVisible();

    await page.getByRole('button', { name: 'Play Again' }).click();
    await expect(page.getByTestId('level-complete')).toBeHidden();
    await expect.poll(() => hearts(page)).toBe(3);
    expect(errors).toEqual([]);
  });

  test('sandbox: running out of hearts offers continue and restart', async ({ page }) => {
    const errors = await startGame(page, 'sandbox');

    // A pit sits just left of spawn; each fall costs a heart even while invulnerable.
    await page.keyboard.down('ArrowLeft');
    await expect(page.getByTestId('game-over')).toBeVisible({ timeout: 10_000 });
    await page.keyboard.up('ArrowLeft');
    expect(await hearts(page)).toBe(0);
    await expect(page.getByTestId('pause-button')).toBeDisabled();

    await page.getByRole('button', { name: 'Continue from Start' }).click();
    await expect(page.getByTestId('game-over')).toBeHidden();
    await expect.poll(() => hearts(page)).toBe(3);

    // Timer runs again after continuing.
    const t1 = await page.getByTestId('hud-time').innerText();
    await page.waitForTimeout(500);
    expect(await page.getByTestId('hud-time').innerText()).not.toBe(t1);
    expect(errors).toEqual([]);
  });
});

test.describe('mobile', () => {
  test.skip(({ isMobile }) => !isMobile, 'touch flow');

  test('touch controls move the hero and do not scroll the page', async ({ page }) => {
    const errors = await startGame(page);
    const right = page.getByRole('button', { name: 'Move right' });
    await expect(right).toBeVisible();
    await expect(page.getByRole('button', { name: 'Jump' })).toBeVisible();

    await right.dispatchEvent('pointerdown', { pointerId: 7, pointerType: 'touch', isPrimary: true });
    await expect.poll(() => coinCount(page), { timeout: 3000 }).toBeGreaterThan(0);
    await right.dispatchEvent('pointerup', { pointerId: 7, pointerType: 'touch', isPrimary: true });

    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    await page.getByTestId('pause-button').tap();
    await expect(page.getByTestId('pause-menu')).toBeVisible();
    await page.getByRole('button', { name: 'Resume' }).tap();
    await expect(page.getByTestId('pause-menu')).toBeHidden();
    expect(errors).toEqual([]);
  });
});

test.describe('mobile portrait', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('rotate hint pauses the game until dismissed', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /^Play/ }).click();
    await expect(page.getByTestId('rotate-hint')).toBeVisible();
    await expect(page.getByTestId('touch-controls')).toBeHidden();
    const time = await page.getByTestId('hud-time').innerText();
    await page.waitForTimeout(600);
    expect(await page.getByTestId('hud-time').innerText()).toBe(time);

    await page.getByRole('button', { name: 'Play in Portrait Anyway' }).tap();
    await expect(page.getByTestId('pause-menu')).toBeVisible();
    await page.getByRole('button', { name: 'Resume' }).tap();
    await expect(page.getByTestId('touch-controls')).toBeVisible();
  });
});

test('falling into a pit plays the falling sound', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard flow');
  // Record every pitch the game schedules; the fall sound opens with a unique 1180 Hz glide.
  await page.addInitScript(() => {
    const w = window as unknown as { __pitches: number[] };
    w.__pitches = [];
    const original = AudioParam.prototype.setValueAtTime;
    AudioParam.prototype.setValueAtTime = function (value: number, time: number) {
      w.__pitches.push(value);
      return original.call(this, value, time);
    };
  });
  await page.goto('/?level=sandbox');
  await expect(page.getByTestId('hud-coins')).toBeVisible();
  await page.mouse.click(10, 300); // user gesture unlocks audio
  await page.keyboard.down('ArrowLeft');
  await expect.poll(() => page.getByTestId('hud-hearts').getAttribute('data-hearts'), { intervals: [50] }).not.toBe('3');
  await page.keyboard.up('ArrowLeft');
  await expect.poll(() => page.evaluate(() => (window as unknown as { __pitches: number[] }).__pitches.includes(1180))).toBe(true);
});
