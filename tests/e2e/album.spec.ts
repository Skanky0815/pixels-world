/* eslint-disable max-lines-per-function -- Vollständige Nutzerabläufe prüfen Sammlung, echten Schaden, Dialogpause und Persistenz gemeinsam. */
import {
  test,
  expect,
  loadIntro,
  start,
  state,
  until,
  besideCouch,
  reset,
  waitForGame,
} from './support';
import { openPause } from './pause-support';
import type { Page } from '@playwright/test';

async function openFromMenu(page: Page) {
  await openPause(page);
  await page.locator('[data-pause-album]').click();
  await expect(page.locator('.album-dialog')).toBeVisible();
}

async function scratch(page: Page) {
  await start(page);
  await besideCouch(page);
  await until(page, (s) => s.couch.damage === 1);
}

for (const mobile of [false, true]) {
  test.describe(mobile ? 'Album auf Touch' : 'Album auf Desktop', () => {
    test.use({
      hasTouch: mobile,
      isMobile: mobile,
      viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 },
    });
    test('Leeres Album zeigt Raum-Tabs und geheimnisvolle Plätze ohne Spoiler @smoke', async ({
      page,
    }) => {
      await loadIntro(page);
      await page
        .locator('.start-screen')
        .getByRole('button', { name: 'Album öffnen', exact: true })
        .click();
      const album = page.locator('.album-dialog');

      await expect(album).toBeVisible();
      await expect(album.locator('.album-overall')).toHaveText('Insgesamt: 0 von 14');
      await expect(album.locator('.album-tile:disabled')).toHaveCount(9);
      await album.getByRole('button', { name: 'Nächste Seite', exact: true }).click();
      await expect(album.locator('.album-pagination')).toContainText('Seite 2 von 2');
      await expect(album.locator('.album-tile:disabled')).toHaveCount(5);
      await expect(
        album.getByRole('button', { name: 'Nächste Seite', exact: true }),
      ).toBeDisabled();
      await album.getByRole('button', { name: 'Vorige Seite', exact: true }).click();
      await expect(album.locator('img')).toHaveCount(0);
      await expect(album).not.toContainText(/Vase|Sofa|Vorhang|Katzengras|Bücher/);
      await album.getByRole('tab', { name: 'Küche später' }).click();
      await expect(album).toContainText('Dieser Raum hat noch keine Album-Einträge.');
      await expect(album.locator('.album-overall')).toHaveText('Insgesamt: 0 von 14');
      await album.getByRole('tab', { name: 'Wohnzimmer', exact: true }).click();
      await page.keyboard.press('ArrowRight');
      await expect(album.getByRole('tab', { name: 'Küche später' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await page.keyboard.press('ArrowLeft');
      await expect(album.locator('.album-tile')).toHaveCount(9);
      const before = await state(page);

      await page.clock.runFor(2000);
      expect((await state(page)).round).toEqual(before.round);
      expect((await state(page)).started).toBe(false);
      const box = await album.boundingBox();

      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
      await test
        .info()
        .attach('album-geheim', { body: await page.screenshot(), contentType: 'image/png' });
      await page.keyboard.press('Escape');
      await expect(album).toBeHidden();
      await expect(page.locator('.pause-menu')).toBeHidden();
      expect((await state(page)).started).toBe(false);
    });
  });
}

test('Echter Schaden deckt ein Objekt auf; Pause, Reset, Reload, Sprache und Album-Löschen @smoke', async ({
  page,
}) => {
  await scratch(page);
  await openFromMenu(page);
  const album = page.locator('.album-dialog');

  await expect(album.locator('.album-overall')).toHaveText('Insgesamt: 1 von 14');
  await expect(album.locator('.album-story')).toContainText('Das gemütliche Sofa');
  await expect(album.locator('.album-tile:disabled')).toHaveCount(8);
  await expect(album.locator('.album-story img')).toHaveAttribute('alt', 'Das gemütliche Sofa');
  const paused = await state(page);

  expect(paused.chaos.score).toBe(3);
  await page.clock.runFor(3000);
  expect((await state(page)).round).toEqual(paused.round);
  expect((await state(page)).chaos).toEqual(paused.chaos);
  await test
    .info()
    .attach('album-entdeckt', { body: await page.screenshot(), contentType: 'image/png' });
  await page.keyboard.press('Escape');
  await expect(album).toBeHidden();
  await expect(page.locator('.pause-menu')).toBeVisible();
  await page.locator('[data-language="en"]').click();
  await page.locator('[data-pause-album]').click();
  await expect(album.locator('.album-story')).toContainText('The cozy couch');
  await expect(album).toHaveAttribute('aria-label', 'Album of mischief');
  await album.locator('[data-action="close"]').click();
  await page.locator('[data-pause-resume]').click();
  await reset(page);
  await page.reload();
  await waitForGame(page);
  await page.locator('[data-start-album]').click();
  await expect(page.locator('.album-overall')).toHaveText('Overall: 1 of 14');
  await page.locator('.album-dialog [data-action="reset"]').click();
  await page.locator('.album-dialog [data-action="cancel"]').click();
  await expect(page.locator('.album-overall')).toHaveText('Overall: 1 of 14');
  await page.locator('.album-dialog [data-action="reset"]').click();
  await page.locator('.album-dialog [data-action="confirm"]').click();
  await expect(page.locator('.album-overall')).toHaveText('Overall: 0 of 14');
  await expect(page.locator('.album-dialog img')).toHaveCount(0);
  await page.reload();
  await waitForGame(page);
  await page.locator('[data-start-album]').click();
  await expect(page.locator('.album-overall')).toHaveText('Overall: 0 of 14');
  await expect(page.locator('.album-dialog')).toHaveCount(1);
});

test('Blockierter Speicher behält echte Entdeckungen bis zum Seitenende', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('blocked');
      },
    }),
  );
  await scratch(page);
  await openFromMenu(page);
  await expect(page.locator('.album-overall')).toHaveText('Insgesamt: 1 von 14');
  await expect(page.locator('.album-dialog footer [role="status"]')).toContainText(
    'Speichern ist nicht verfügbar',
  );
  await page.locator('.album-dialog [data-action="close"]').click();
  await page.locator('[data-pause-resume]').click();
  await reset(page);
  await openFromMenu(page);
  await expect(page.locator('.album-overall')).toHaveText('Insgesamt: 1 von 14');
});

test('Korrupte Album-Daten blockieren weder Einführung noch Sammlung', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pixels-world.album', '{'));
  await loadIntro(page);
  await page.locator('[data-start-album]').click();
  await expect(page.locator('.album-overall')).toHaveText('Insgesamt: 0 von 14');
  await expect(page.locator('.album-dialog footer [role="status"]')).toContainText('ungültig');
});

test('Veröffentlichtes Album zählt keine unerreichbare DEV-Variante', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'pixels-world.album',
      JSON.stringify({ version: 1, discovered: ['couch.worn'] }),
    ),
  );
  await page.goto('http://127.0.0.1:4175/pixels-world/play.html');
  await expect
    .poll(
      async () => {
        await page.clock.runFor(32);

        return page.locator('[data-start-album]').count();
      },
      { intervals: [0] },
    )
    .toBe(1);
  await page.locator('[data-start-album]').click();
  await expect(page.locator('.album-overall')).toHaveText('Insgesamt: 0 von 13');
  await expect(page.locator('.album-tile:disabled')).toHaveCount(9);
  await expect(page.locator('.album-dialog img')).toHaveCount(0);
});

test.describe('Mobile Buchseiten', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  test('Übersicht, Einzelobjekt und Querformat bleiben innerhalb des Bildschirms', async ({
    page,
  }) => {
    await scratch(page);
    await page.locator('.album-toggle').click();
    const album = page.locator('.album-dialog');

    await expect(page.locator('.pause-menu')).toBeHidden();
    const paused = await state(page);

    await page.clock.runFor(2000);
    expect((await state(page)).round).toEqual(paused.round);

    await expect(album.locator('.album-index')).toBeVisible();
    await expect(album.locator('.album-story')).toBeHidden();
    await album.getByRole('button', { name: 'Das gemütliche Sofa', exact: true }).click();
    await expect(album.locator('.album-story')).toBeVisible();
    await expect(album.locator('.album-index')).toBeHidden();
    await album.getByRole('button', { name: 'Zur Übersicht', exact: true }).click();
    await expect(album.locator('.album-index')).toBeVisible();
    await page.setViewportSize({ width: 844, height: 390 });
    await page.clock.runFor(64);
    const box = await album.boundingBox();

    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(390);
    expect(await album.evaluate((el) => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
    await album.locator('[data-action="close"]').click();
    await expect(album).toBeHidden();
    await expect(page.locator('.pause-menu')).toBeHidden();
    expect((await state(page)).active).toBe(true);
    await expect(page.locator('.album-toggle')).toHaveCount(1);
  });
});
