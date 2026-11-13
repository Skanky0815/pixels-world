/* eslint-disable max-lines-per-function -- Echte Auswahl, Modal-Dialoge und Rundenreset bilden die Integrationsgrenze des neuen Einstiegs. */
import { test, expect, state, until, besideCouch, waitForGame } from './support';

test(
  'Zimmerauswahl: Tastatur, echte Menüs und Rückkehr setzen eine beschädigte Runde zurück',
  { tag: '@smoke' },
  async ({ page }) => {
    await page.goto('/play.html');
    await waitForGame(page, false);
    const rooms = page.locator('.room-selection');

    await expect(rooms).toBeVisible();
    await expect(page.locator('main > header')).toHaveCount(1);
    await expect(page.locator('main > footer')).toHaveCount(1);
    await expect(rooms.locator('.room-choice')).toHaveCount(4);
    await expect(rooms.locator('.room-choice:disabled')).toHaveCount(3);
    await expect
      .poll(() =>
        rooms
          .locator('img')
          .evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
      )
      .toBe(true);
    const waiting = await state(page);

    await page.locator('#game').focus();
    await page.keyboard.down('ArrowRight');
    await page.keyboard.down('Space');
    await page.clock.runFor(1000);
    expect((await state(page)).started).toBe(false);
    expect((await state(page)).round.elapsedMs).toBe(0);
    expect((await state(page)).pixel.x).toBe(waiting.pixel.x);
    await page.keyboard.up('ArrowRight');
    await page.keyboard.up('Space');
    await page.locator('main > header .album-toggle').click();
    await expect(page.locator('.album-dialog')).toBeVisible();
    await page.locator('.album-dialog [data-action="close"]').click();
    await page.locator('main > header .pause-toggle').click();
    await page.locator('[data-language="en"]').click();
    await page.locator('[data-pause-resume]').click();
    await expect(rooms).toContainText('Where to today, Pixel?');
    await expect(rooms).toContainText('Kitchen');
    await rooms.locator('[data-room-choice]').focus();
    await page.keyboard.press('Tab');
    await expect(rooms.locator('[data-room-start]')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('.start-screen')).toBeVisible();
    expect((await state(page)).started).toBe(false);
    await page.locator('[data-start-rooms]').focus();
    await page.keyboard.press('Space');
    await until(page, (s) => !s.intro.visible);
    await expect(rooms).toBeVisible();
    await rooms.locator('[data-room-start]').click();
    await page.keyboard.down('Space');
    await until(page, (s) => s.started);
    await page.keyboard.up('Space');
    await besideCouch(page);
    await until(page, (s) => s.couch.damage === 1);
    const played = await state(page);

    await page.locator('.pause-toggle').click();
    await page.locator('[data-pause-rooms]').click();
    await until(page, (s) => s.generation > played.generation);
    await expect(rooms).toBeVisible();
    expect((await state(page)).chaos.score).toBe(0);
    expect((await state(page)).couch.damage).toBe(0);
    await expect(page.locator('canvas')).toHaveCount(1);
    await expect(page.locator('.pause-menu')).toHaveCount(1);
    expect((await state(page)).started).toBe(false);
    await rooms.locator('[data-room-start]').click();
    expect((await state(page)).room.id).toBe('living-room');
    expect((await state(page)).round.elapsedMs).toBe(0);
  },
);

for (const viewport of [
  { width: 568, height: 320 },
  { width: 390, height: 844 },
]) {
  test.describe(`Zimmerauswahl mit Touch ${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport, hasTouch: true, isMobile: true });
    test(
      'Vier Zimmer und beide Menübuttons passen; Antippen führt zur Einführung',
      { tag: '@smoke' },
      async ({ page }) => {
        await page.goto('/play.html');
        await waitForGame(page, false);
        const rooms = page.locator('.room-selection');

        expect(
          await rooms.evaluate(
            (root) =>
              root.scrollHeight <= root.clientHeight + 1 && root.scrollWidth <= root.clientWidth,
          ),
        ).toBe(true);
        await expect(page.locator('main > header .pause-toggle')).toBeInViewport({ ratio: 1 });
        await expect(page.locator('main > header .album-toggle')).toBeInViewport({ ratio: 1 });
        await expect(rooms.locator('[data-room-start]')).toBeInViewport({ ratio: 1 });
        await page.locator('main > header .pause-toggle').tap();
        await expect(page.locator('.pause-menu')).toBeVisible();
        await page.locator('[data-pause-resume]').tap();
        await rooms.locator('[data-room-start]').tap();
        await expect(page.locator('.start-screen')).toBeVisible();
        await page.locator('[data-start-rooms]').tap();
        await until(page, (s) => !s.intro.visible);
        await expect(rooms).toBeVisible();
      },
    );
  });
}
