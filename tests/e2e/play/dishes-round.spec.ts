/* eslint-disable max-lines-per-function -- Reale Eingaben und ihre zusammengehörigen Zustandsprüfungen bilden vollständige Abläufe. */
import { test, expect, waitForGame } from '../support/support';
import { observe, until, move, climbToCounter } from './kitchen-support';

test(
  'Öffentliche Küche wählen, friedlich abschließen und Küchen-Erfolg erhalten',
  { tag: '@smoke' },
  async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('pixels-world.difficulty', 'hard'));
    await page.goto('/play.html?room-seed=pantry-hard-17');
    await waitForGame(page, false);
    await page.locator('[data-menu-play]').click();
    await page.locator('[data-room-choice="kitchen"]').click();
    await expect(page.locator('[data-room-choice="kitchen"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.locator('[data-room-choice="living-room"]')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await page.locator('[data-room-start="kitchen"]').click();
    await until(page, (s) => s.room.id === 'kitchen');
    await page.locator('#game').focus();
    await move(page, ['Space'], (s) => s.started && s.pixel.grounded);
    expect((await observe(page)).room.id).toBe('kitchen');
    expect((await observe(page)).room.artReady).toBe(true);
    await climbToCounter(page);
    await until(page, (s) => s.homecoming.stage === 'dialogue' && s.pixelReturn.stage === 'seated');
    await move(page, ['Space'], (s) => s.result !== null);
    const result = await observe(page);

    expect(result.chaos.score).toBe(0);
    expect(result.result?.peaceful).toBe(true);
    await expect(page.locator('.album-banner')).toHaveAttribute('data-entry', 'goal.food-bowl');
    await page.clock.runFor(3100);
    await expect(page.locator('.album-banner')).toHaveAttribute(
      'data-entry',
      'achievement.peaceful-kitchen-v1',
    );
    expect(result.album.confirmed).toContain('goal.food-bowl');
    expect(result.dishes.every((dish) => dish.state === 'resting')).toBe(true);
  },
);
