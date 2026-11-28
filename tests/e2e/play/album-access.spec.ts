/* eslint-disable max-lines-per-function -- Reale Einstiege, Fokus und laufende Runde bilden einen zusammenhängenden Navigationsvertrag. */
import { test, expect, waitForGame, start, state, until, besideCouch } from '../support/support';
import { finishAlbumRound } from './album-support';
import { seedRoundRandom } from '../support/round-clock';

for (const viewport of [
  { width: 1280, height: 900, touch: false },
  { width: 390, height: 844, touch: true },
]) {
  test.describe(`Albumzugang ${viewport.width}`, () => {
    test.use({ viewport, hasTouch: viewport.touch, isMobile: viewport.touch });
    test('Nur das Hauptmenü öffnet das Album; Rückkehr setzt die Runde nicht fort @smoke', async ({
      page,
    }) => {
      await page.goto('/play.html');
      await waitForGame(page, false);
      const header = page.locator('main > header');
      const albumAction = page.locator('[data-pause-album]');
      const album = page.locator('.album-screen');

      await expect(header.getByRole('button')).toHaveCount(1);
      await expect(header.getByRole('button')).toHaveAccessibleName('Hauptmenü');
      await expect(albumAction).toBeVisible();
      await albumAction.click();
      await expect(album).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(albumAction).toBeFocused();
      await page.locator('[data-menu-play]').click();
      await expect(page.locator('.room-selection')).toBeVisible();
      await expect(albumAction).toBeHidden();
      await page.locator('[data-room-start]').click();
      await expect(page.locator('.start-screen')).toBeVisible();
      await expect(albumAction).toBeHidden();
      await header.locator('.pause-toggle').click();
      await albumAction.click();
      await page.keyboard.press('Escape');
      expect((await state(page)).started).toBe(false);
      await page.locator('[data-pause-resume]').click();
      await page.keyboard.down('Space');
      await until(page, (snapshot) => snapshot.started);
      await page.keyboard.up('Space');
      await header.locator('.pause-toggle').click();
      const paused = await state(page);

      await albumAction.click();
      await page.keyboard.down('ArrowRight');
      await page.keyboard.down('Space');
      await page.clock.runFor(2000);
      expect((await state(page)).round).toEqual(paused.round);
      expect((await state(page)).pixel).toEqual(paused.pixel);
      await page.keyboard.up('ArrowRight');
      await page.keyboard.up('Space');
      await page.screenshot({ path: `/private/tmp/pixels398-album-${viewport.width}.png` });
      await page.keyboard.press('Escape');
      await expect(albumAction).toBeFocused();
      expect((await state(page)).active).toBe(false);
      await page.screenshot({ path: `/private/tmp/pixels398-menu-${viewport.width}.png` });
      await page.locator('[data-pause-resume]').click();
      await until(page, (snapshot) => snapshot.round.elapsedMs > paused.round.elapsedMs);
      expect((await state(page)).generation).toBe(paused.generation);
    });
  });
}

for (const success of [false, true])
  test(`Album nach ${success ? 'Erfolg' : 'Niederlage'} bleibt nur über das Hauptmenü erreichbar @smoke`, async ({
    page,
  }) => {
    await seedRoundRandom(page);
    await start(page, '/?round-profile=fast');
    await besideCouch(page);
    await until(page, (snapshot) => snapshot.couch.damage === 1);
    await finishAlbumRound(page, success);
    const before = await state(page);

    await expect(page.locator('[data-pause-album]')).toBeHidden();
    await expect(page.locator('main > header').getByRole('button')).toHaveCount(1);
    await page.locator('main > header .pause-toggle').click();
    await page.locator('[data-pause-album]').click();
    await expect(page.locator('.album-screen')).toBeVisible();
    await page.keyboard.press('Escape');
    expect((await state(page)).active).toBe(false);
    expect((await state(page)).result).toEqual(before.result);
    await page.locator('[data-pause-resume]').click();
    expect((await state(page)).generation).toBe(before.generation);
    expect((await state(page)).result).toEqual(before.result);
  });
