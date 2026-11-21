import { expect, test, type Page } from '@playwright/test';

test.skip(({ isMobile }) => isMobile, 'keyboard-driven progression flows run on desktop');

const PROGRESS_KEY = 'lego-adventure:progress';
const record = { completed: true, bestStars: 2, bestTimeMs: 45_000, bestCoins: 20, bestBricks: 2 };

function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

async function seedProgress(page: Page, levels: Record<string, unknown>) {
  await page.goto('/');
  await page.evaluate(([key, value]) => localStorage.setItem(key!, value!), [PROGRESS_KEY, JSON.stringify({ version: 1, levels })]);
  await page.reload();
}

const tile = (page: Page, id: string) => page.getByTestId(`level-tile-${id}`);

/**
 * Runs right while hopping until `testId` is visible. Hop timing depends on real time, so if a slow
 * machine drops the bot into a pit or enemy, it continues after game over like a player would.
 */
async function hopRightUntil(page: Page, testId: string, maxHops = 120) {
  await page.keyboard.down('ArrowRight');
  for (let i = 0; i < maxHops; i++) {
    if (await page.getByTestId(testId).isVisible()) break;
    if (await page.getByTestId('game-over').isVisible()) {
      await page.keyboard.up('ArrowRight');
      await page.getByRole('button', { name: /Continue from/ }).click();
      await page.keyboard.down('ArrowRight');
    }
    await page.keyboard.down('Space');
    await page.waitForTimeout(450);
    await page.keyboard.up('Space');
    await page.waitForTimeout(60);
  }
  await page.keyboard.up('ArrowRight');
}

test('a new player sees World 1 with only Level 1 unlocked', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('play-level')).toHaveText('Level 1: Welcome Adventure');
  await page.getByRole('button', { name: 'Level Select' }).click();

  await expect(tile(page, 'w1-1')).toHaveAttribute('data-status', 'available');
  await expect(tile(page, 'w1-1')).toContainText('Next');
  for (const id of ['w1-2', 'w1-3', 'w1-4']) {
    await expect(tile(page, id)).toHaveAttribute('data-status', 'locked');
    await expect(tile(page, id)).toBeDisabled();
  }
  for (const id of ['w2-1', 'w3-1', 'w4-1', 'w5-4']) await expect(tile(page, id)).toHaveAttribute('data-status', 'locked');
  await expect(page.getByTestId('world-3-coming-soon')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /View Ending/ })).toHaveCount(0);
});

test('completing Level 1 unlocks Level 2, saves progress, and Next Level continues', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/');
  await page.getByRole('button', { name: /^Play/ }).click();
  await expect(page.getByTestId('hud-coins')).toBeVisible();

  // Run right while hopping: Level 1 has only small gaps and a low wall.
  await hopRightUntil(page, 'level-complete');
  await expect(page.getByTestId('level-complete')).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId('progress-messages')).toContainText('Unlocked: Mushroom Valley');

  await page.getByRole('button', { name: /Next Level/ }).click();
  await expect(page.getByText('Mushroom Valley')).toBeVisible();
  await expect(page.getByTestId('level-complete')).toBeHidden();

  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Level Map' }).click();
  await page.getByRole('button', { name: 'Leave to Level Map' }).click();
  await expect(tile(page, 'w1-1')).toHaveAttribute('data-status', 'completed');
  await expect(tile(page, 'w1-2')).toHaveAttribute('data-status', 'available');
  await expect(tile(page, 'w1-3')).toHaveAttribute('data-status', 'locked');

  await page.reload();
  await expect(page.getByRole('button', { name: /^Continue/ })).toBeVisible();
  await expect(page.getByTestId('play-level')).toHaveText('Level 2: Mushroom Valley');
  expect(errors).toEqual([]);
});

test('completed levels can be replayed and corrupt saves reset safely', async ({ page }) => {
  await seedProgress(page, { 'w1-1': record });
  await page.getByRole('button', { name: 'Level Select' }).click();
  await expect(tile(page, 'w1-1')).toContainText('Best 0:45.0');
  await tile(page, 'w1-1').click();
  await expect(page.getByText('Welcome Adventure')).toBeVisible();

  await page.evaluate((key) => localStorage.setItem(key, '{broken'), PROGRESS_KEY);
  await page.goto('/');
  await expect(page.getByTestId('play-level')).toHaveText('Level 1: Welcome Adventure');
});

test('the Level 4 boss fight starts when entering the arena', async ({ page }) => {
  const errors = trackErrors(page);
  await seedProgress(page, { 'w1-1': record, 'w1-2': record, 'w1-3': record });
  await page.getByRole('button', { name: 'Level Select' }).click();
  await expect(tile(page, 'w1-4')).toHaveAttribute('data-status', 'available');
  await tile(page, 'w1-4').click();
  await expect(page.getByTestId('hud-coins')).toBeVisible();

  // Hop right through the warm-up; the boss bar appears once the arena locks.
  await hopRightUntil(page, 'boss-bar');
  await expect(page.getByTestId('boss-bar')).toBeVisible();
  await expect(page.getByTestId('boss-bar')).toHaveAttribute('data-hp', '3');
  await expect(page.getByTestId('boss-bar')).toContainText('Grassland Guardian');
  expect(errors).toEqual([]);
});

test('finishing World 1 unlocks World 2', async ({ page }) => {
  await seedProgress(page, { 'w1-1': record, 'w1-2': record, 'w1-3': record, 'w1-4': record });
  await expect(page.getByTestId('play-level')).toHaveText('Level 5: Hidden Forest');
  await page.getByRole('button', { name: 'Level Select' }).click();
  await expect(tile(page, 'w2-1')).toHaveAttribute('data-status', 'available');
  await expect(tile(page, 'w2-2')).toHaveAttribute('data-status', 'locked');
});

for (const [id, name] of [
  ['w2-1', 'Hidden Forest'],
  ['w2-2', 'Jungle Bridges'],
  ['w2-3', 'The Dark Cave'],
] as const) {
  test(`World 2 level ${name} loads and plays without errors`, async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto(`/?level=${id}`);
    await expect(page.getByTestId('hud-coins')).toBeVisible();
    await expect(page.getByText(name)).toBeVisible();
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(1500);
    await page.keyboard.up('ArrowRight');
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('pause-menu')).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('the Forest Protector fight starts when entering the arena', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/?level=w2-4');
  await expect(page.getByTestId('hud-coins')).toBeVisible();
  await hopRightUntil(page, 'boss-bar');
  await expect(page.getByTestId('boss-bar')).toContainText('Forest Protector');
  expect(errors).toEqual([]);
});

test('completing the whole campaign unlocks the ending', async ({ page }) => {
  const ids = ['w1-1', 'w1-2', 'w1-3', 'w1-4', 'w2-1', 'w2-2', 'w2-3', 'w2-4', 'w3-1', 'w3-2', 'w3-3', 'w3-4', 'w4-1', 'w4-2', 'w4-3', 'w4-4', 'w5-1', 'w5-2', 'w5-3', 'w5-4'];
  await seedProgress(page, Object.fromEntries(ids.map((id) => [id, record])));
  await expect(page.getByTestId('menu-stars')).toContainText('40 / 60');
  await page.getByRole('button', { name: 'Level Select' }).click();
  await page.getByRole('button', { name: /View Ending/ }).click();
  await expect(page.getByTestId('ending')).toContainText('The Brick Kingdom is safe!');
  await expect(page.getByTestId('ending')).toContainText('20 / 20');
});

for (const [id, name] of [
  ['w3-2', 'Ancient Pyramid'],
  ['w4-2', 'Ice Slides'],
  ['w5-2', 'Lava Bridges'],
] as const) {
  test(`late-world level ${name} loads and plays without errors`, async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto(`/?level=${id}`);
    await expect(page.getByText(name)).toBeVisible();
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(1200);
    await page.keyboard.up('ArrowRight');
    expect(errors).toEqual([]);
  });
}
