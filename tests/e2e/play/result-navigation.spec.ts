/* eslint-disable max-lines-per-function -- Echte Runden, persistierter Fortschritt und frische Folgeaktionen bilden einen zusammenhängenden Bedienvertrag. */
import {
  test,
  expect,
  start,
  state,
  until,
  besideCouch,
  waitForGame,
  framesPass,
} from '../support/support';
import { finishAlbumRound } from './album-support';
import { seedRoundRandom, useIdleFrames } from '../support/round-clock';
import { observe, until as untilRoom, move, finishCharm } from './kitchen-support';

for (const viewport of [
  { width: 1280, height: 900, touch: false },
  { width: 390, height: 844, touch: true },
  { width: 568, height: 320, touch: true },
  { width: 320, height: 400, touch: true },
]) {
  test.describe(`Ergebnisnavigation ${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport, hasTouch: viewport.touch, isMobile: viewport.touch });

    for (const success of [false, true])
      test(`${success ? 'Levelauswahl nach Erfolg' : 'Neuer Versuch nach Niederlage'} erhält Fortschritt @smoke`, async ({
        page,
        // eslint-disable-next-line complexity -- Beide Ausgänge und Geräte teilen denselben Abschluss; das kleine Hochformat prüft zusätzlich echtes Scrollen.
      }) => {
        await page.addInitScript(() => {
          localStorage.setItem('pixels-world.storage', '{"album":true,"offline":false}');
          localStorage.setItem('pixels-world.album', '{"version":1,"discovered":["vase.blue"]}');
        });
        await seedRoundRandom(page);
        await start(page, '/?round-profile=fast');
        await besideCouch(page);
        await until(page, (snapshot) => snapshot.couch.damage === 1);
        await finishAlbumRound(page, success);
        await framesPass(page, 1);
        const before = await state(page);
        const progress = await page.evaluate(() => localStorage.getItem('pixels-world.album'));
        const primary = page.locator('.room-selection-return');

        await expect(primary).toBeVisible();
        await expect(primary).toHaveText(success ? 'Levelauswahl' : 'Neuer Versuch');
        await expect(primary).toHaveAttribute('data-result-action', success ? 'levels' : 'retry');
        await expect(page.locator('[data-control="reset"]')).toHaveCount(0);
        await expect(page.locator('[data-control="jump"]')).toBeHidden();
        await expect(page.locator('.touch-directions')).toBeHidden();
        await expect(page.locator('.mobile-notice')).toBeHidden();
        const overlaps = await primary.evaluate((button) => {
          const bounds = button.getBoundingClientRect();

          return Array.from(
            document.querySelectorAll<HTMLElement>('.album-banner, .mobile-dialogue'),
          )
            .filter(
              (node) => !node.closest('[hidden]') && getComputedStyle(node).display !== 'none',
            )
            .filter((node) => {
              const box = node.getBoundingClientRect();

              return (
                box.width > 0 &&
                box.height > 0 &&
                bounds.left < box.right &&
                bounds.right > box.left &&
                bounds.top < box.bottom &&
                bounds.bottom > box.top
              );
            })
            .map((node) => node.className);
        });

        expect(overlaps).toEqual([]);
        expect(await primary.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
        const box = (await primary.boundingBox())!;
        const canvas = (await page.locator('canvas').boundingBox())!;

        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.x).toBeGreaterThanOrEqual(canvas.x);
        expect(box.y).toBeGreaterThanOrEqual(canvas.y);
        expect(box.x + box.width).toBeLessThanOrEqual(canvas.x + canvas.width + 1);
        expect(box.y + box.height).toBeLessThanOrEqual(canvas.y + canvas.height + 1);
        await page.screenshot({
          path: `/private/tmp/pixels399-${success ? 'success' : 'failed'}-${viewport.width}.png`,
        });

        if (viewport.width === 320) {
          const panel = page.locator('.mobile-dialogue');
          const hint = panel.locator('.mobile-hint');

          expect(await panel.evaluate((node) => node.clientHeight)).toBeGreaterThanOrEqual(64);
          expect(await panel.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
          await hint.scrollIntoViewIfNeeded();
          expect(await panel.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
          const area = (await panel.boundingBox())!;
          const text = (await hint.boundingBox())!;

          expect(text.y).toBeGreaterThanOrEqual(area.y);
          expect(text.y + text.height).toBeLessThanOrEqual(area.y + area.height);
          await page.screenshot({
            path: `/private/tmp/pixels399-details-${success ? 'success' : 'failed'}-320.png`,
          });
        }

        if (viewport.touch) await primary.tap();
        else {
          await page.locator('#game').focus();
          await page.keyboard.down('Space');
        }

        await until(page, (snapshot) => snapshot.generation > before.generation);

        if (!viewport.touch) await page.keyboard.down('Space');
        await page.clock.runFor(600);

        if (!viewport.touch) await page.keyboard.up('Space');
        const fresh = await state(page);

        expect(fresh.generation).toBe(before.generation + 1);
        expect(fresh.room.id).toBe(before.room.id);
        expect(fresh.result).toBeNull();
        expect(fresh.chaos.score).toBe(0);
        expect(fresh.objects.every((object) => object.damage === 0 && object.events === 0)).toBe(
          true,
        );
        expect(fresh.started).toBe(!success);
        expect(await page.evaluate(() => localStorage.getItem('pixels-world.album'))).toBe(
          progress,
        );

        if (success) await expect(page.locator('.room-selection')).toBeVisible();
        else {
          await expect(page.locator('.room-selection')).toBeHidden();
          expect(fresh.pixel.grounded).toBe(true);
        }
      });
  });
}

test('Neuer Versuch bleibt auch nach Auswahl eines anderen Zimmers im gespielten Level @smoke', async ({
  page,
}) => {
  await seedRoundRandom(page);
  await page.goto('/play.html?round-profile=fast');
  await waitForGame(page, false);
  await page.locator('[data-menu-play]').click();
  await page.locator('[data-room-choice="kitchen"]').click();
  await page.locator('[data-room-start]').click();
  await untilRoom(
    page,
    (snapshot) => snapshot.ready && snapshot.room.id === 'kitchen' && snapshot.intro.visible,
  );
  await page.locator('#game').focus();
  await move(page, ['Space'], (snapshot) => snapshot.started && snapshot.pixel.grounded);
  await useIdleFrames(page);
  const current = await observe(page);

  await page.clock.runFor(current.round.returnAtMs);
  await untilRoom(
    page,
    (snapshot) =>
      snapshot.homecoming.stage === 'dialogue' && snapshot.pixelReturn.stage === 'seated',
  );
  await move(page, ['Space'], (snapshot) => snapshot.reconciliation.stage === 'reading');
  await finishCharm(page, false);
  await untilRoom(page, (snapshot) => snapshot.result !== null);
  await page.getByRole('button', { name: 'Neuer Versuch', exact: true }).click();
  await untilRoom(page, (snapshot) => snapshot.generation > current.generation);
  expect((await observe(page)).room.id).toBe('kitchen');
  expect((await observe(page)).started).toBe(true);
  expect((await observe(page)).result).toBeNull();
  expect((await observe(page)).chaos.score).toBe(0);
});
