import { albumEntries } from '../../src/content/album/index.ts';
/* eslint-disable max-lines-per-function -- Vollständige Nutzerabläufe prüfen Sammlung, echten Schaden, Dialogpause und Persistenz gemeinsam. */
import {
  introAction,
  test,
  expect,
  loadIntro,
  start,
  state,
  until,
  besideCouch,
  besidePlant,
  holdUntil,
  reset,
  waitForGame,
  waitForLoadingScreen,
} from './support';
import { openPause } from './pause-support';
import { seedRoundRandom, useIdleFrames, advanceRoundTo } from './round-clock';
import { finishAlbumRound } from './album-support';
import type { Page } from '@playwright/test';

// Existing persistence/layout contracts start with a returning player's saved choice.
test.beforeEach(async ({ page }, info) => {
  if (info.title.startsWith('Blockierter Speicher')) return;
  await page.addInitScript(() =>
    localStorage.setItem('pixels-world.storage', '{"album":true,"offline":false}'),
  );
});

async function openFromMenu(page: Page) {
  await openPause(page);
  await page.locator('[data-pause-album]').click();
  await expect(page.locator('.album-dialog')).toBeVisible();
}

async function scratch(page: Page) {
  await seedRoundRandom(page);
  await start(page, '/?round-profile=fast');
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
      await (await introAction(page, 'album')).click();
      const album = page.locator('.album-dialog');

      await expect(album).toBeVisible();
      await expect(album.locator('.album-overall')).toHaveText(
        `Insgesamt: 0 von ${albumEntries(true).length}`,
      );
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
      await album.getByRole('tab', { name: 'Schlafzimmer später' }).click();
      await expect(album).toContainText('Dieser Raum hat noch keine Album-Einträge.');
      await expect(album.locator('.album-overall')).toHaveText(
        `Insgesamt: 0 von ${albumEntries(true).length}`,
      );
      await album.getByRole('tab', { name: 'Wohnzimmer', exact: true }).click();
      await page.keyboard.press('ArrowRight');
      await expect(album.getByRole('tab', { name: 'Küche' })).toHaveAttribute(
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

    if (mobile)
      test('Gescheitertes Minispiel verwirft neue Funde und bewahrt bestätigte Einträge @smoke', async ({
        page,
      }) => {
        await page.addInitScript(() => {
          if (!localStorage.getItem('pixels-world.album'))
            localStorage.setItem(
              'pixels-world.album',
              JSON.stringify({ version: 1, discovered: ['vase.blue'] }),
            );
        });
        await scratch(page);
        expect((await state(page)).album.pending).toEqual(['couch.cozy']);
        const result = await finishAlbumRound(page, false);

        await expect(page.locator('.album-banner')).toBeHidden();
        expect(result.outcome).toBe('failed');
        expect(result.newDiscoveries).toBe(0);
        expect(result.albumText).toBe('Neue Album-Einträge: 0 · Versöhnung nicht geschafft.');
        expect((await state(page)).album).toEqual({ pending: [], confirmed: [], completed: true });
        expect(
          await page.evaluate(
            () => JSON.parse(localStorage.getItem('pixels-world.album')!).discovered,
          ),
        ).toEqual(['vase.blue']);

        await page.locator('.result-discoveries').scrollIntoViewIfNeeded();
        await expect(page.locator('.result-discoveries')).toHaveText(result.albumText);

        await test.info().attach('album-failed-result', {
          body: await page.screenshot(),
          contentType: 'image/png',
        });
        await page.locator('.album-toggle').click();
        await expect(page.locator('.album-overall')).toHaveText(
          `Insgesamt: 1 von ${albumEntries(true).length}`,
        );
        await expect(page.locator('.album-dialog')).not.toContainText('Das gemütliche Sofa');
        await page.reload();
        await waitForGame(page);
        await (await introAction(page, 'album')).click();
        await expect(page.locator('.album-overall')).toHaveText(
          `Insgesamt: 1 von ${albumEntries(true).length}`,
        );
      });
  });
}

test('Erst erfolgreiche Versöhnung bestätigt mehrere Funde; Pause, Reset, Reload, Sprache und Album-Löschen @smoke', async ({
  page,
}) => {
  await scratch(page);
  await besidePlant(page);
  await until(page, (s) => s.plant.damage === 1);
  await holdUntil(page, ['ArrowLeft'], (s) => s.pixel.x <= 45);
  await openFromMenu(page);
  const album = page.locator('.album-dialog');

  await expect(album.locator('.album-overall')).toHaveText(
    `Insgesamt: 0 von ${albumEntries(true).length}`,
  );
  await expect(album.locator('img')).toHaveCount(0);
  expect((await state(page)).album).toMatchObject({
    pending: ['couch.cozy', 'plant.catgrass'],
    completed: false,
  });
  const before = await state(page);

  await page.clock.runFor(2000);
  expect((await state(page)).round).toEqual(before.round);
  await album.locator('[data-action="close"]').click();
  await page.locator('[data-pause-resume]').click();
  await useIdleFrames(page);
  await advanceRoundTo(page, (await state(page)).round.returnAtMs);
  await until(page, (s) => s.homecoming.stage === 'dialogue', 500);
  expect((await state(page)).album.completed).toBe(false);
  expect(await page.evaluate(() => localStorage.getItem('pixels-world.album'))).toBeNull();
  const result = await finishAlbumRound(page, true);

  expect(result.outcome).toBe('success');
  expect(result.newDiscoveries).toBe(2);
  expect(result.albumText).toBe('Neue Album-Einträge: 2');
  const banner = page.locator('.album-banner');

  await expect(banner).toBeVisible();
  await expect(banner).toHaveAttribute('data-entry', 'couch.cozy');
  await expect(banner).toContainText('Neuer Album-Eintrag freigeschaltet');
  await expect(banner.locator('strong')).toHaveText('Das gemütliche Sofa');
  await bannerFits(page);
  await test
    .info()
    .attach('album-banner-desktop', { body: await page.screenshot(), contentType: 'image/png' });
  const field = await page.locator('#game').boundingBox();

  await page.clock.runFor(3100);
  await expect(banner).toHaveAttribute('data-entry', 'plant.catgrass');
  await openFromMenu(page);
  await page.clock.runFor(4000);
  await expect(banner).toHaveAttribute('data-entry', 'plant.catgrass');
  await page.locator('.album-dialog [data-action="close"]').click();
  await page.locator('[data-pause-resume]').click();
  await page.clock.runFor(3300);
  const unlocked: string[] = await page.evaluate(
    () => JSON.parse(localStorage.getItem('pixels-world.album')!).achievements.unlocked,
  );

  expect(unlocked[0]).toBe('achievement.angel-1');

  // Production timings can also tip the plant; every newly earned banner must finish.
  for (const id of unlocked) {
    await expect(banner).toHaveAttribute('data-entry', id);
    await expect(banner).toContainText('Neuer Erfolg freigeschaltet');
    await page.clock.runFor(3300);
  }

  await expect(banner).toBeHidden();
  expect(await page.locator('#game').boundingBox()).toEqual(field);
  expect((await state(page)).result?.newDiscoveries).toBe(2);
  expect((await state(page)).album).toEqual({
    pending: [],
    confirmed: ['couch.cozy', 'plant.catgrass'],
    completed: true,
  });
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('pixels-world.album')!).discovered),
  ).toEqual(['couch.cozy', 'plant.catgrass']);
  await openFromMenu(page);
  await expect(album.locator('.album-overall')).toHaveText(
    `Insgesamt: 2 von ${albumEntries(true).length}`,
  );
  await expect(album.locator('.album-story')).toContainText('Das gemütliche Sofa');
  await expect(album.locator('.album-tile:disabled')).toHaveCount(7);
  await expect(album.locator('.album-story img')).toHaveAttribute('alt', 'Das gemütliche Sofa');
  const paused = await state(page);

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
  await (await introAction(page, 'album')).click();
  await expect(page.locator('.album-overall')).toHaveText(
    `Overall: 2 of ${albumEntries(true).length}`,
  );
  await page.locator('.album-dialog [data-action="close"]').click();
  await openPause(page);
  await page.locator('.pause-menu [data-album-reset="ask"]').click();
  await page.locator('.pause-menu [data-album-reset="cancel"]').click();
  await expect(page.locator('.pause-menu [data-album-reset="ask"]')).toBeVisible();
  await page.locator('.pause-menu [data-album-reset="ask"]').click();
  await page.locator('.pause-menu [data-album-reset="confirm"]').click();
  await page.locator('[data-pause-resume]').click();
  await (await introAction(page, 'album')).click();
  await expect(page.locator('.album-overall')).toHaveText(
    `Overall: 0 of ${albumEntries(true).length}`,
  );
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('pixels-world.album')!).achievements),
  ).toEqual({
    reconciliations: 0,
    ruined: [],
    ruinedVariants: [],
    completedRooms: [],
    unlocked: [],
  });
  await expect(page.locator('.album-dialog img')).toHaveCount(0);
  await page.reload();
  await waitForGame(page);
  await (await introAction(page, 'album')).click();
  await expect(page.locator('.album-overall')).toHaveText(
    `Overall: 0 of ${albumEntries(true).length}`,
  );
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
  await openPause(page);
  await page.locator('[data-remember-album]').check();
  await page.locator('[data-pause-resume]').click();
  await finishAlbumRound(page, true);
  await expect(page.locator('.album-banner')).toHaveAttribute('data-entry', 'couch.cozy');
  await openFromMenu(page);
  await expect(page.locator('.album-overall')).toHaveText(
    `Insgesamt: 1 von ${albumEntries(true).length}`,
  );
  await expect(page.locator('.album-dialog footer [role="status"]')).toContainText(
    'Speichern ist nicht verfügbar',
  );
  await page.locator('.album-dialog [data-action="close"]').click();
  await page.locator('[data-pause-resume]').click();
  await reset(page);
  await openFromMenu(page);
  await expect(page.locator('.album-overall')).toHaveText(
    `Insgesamt: 1 von ${albumEntries(true).length}`,
  );
});

test('Neustart und Reload verwerfen Vormerkungen und behalten vorhandene Album-Einträge', async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('pixels-world.album'))
      localStorage.setItem(
        'pixels-world.album',
        JSON.stringify({ version: 1, discovered: ['vase.blue'] }),
      );
  });
  await scratch(page);
  expect((await state(page)).album.pending).toEqual(['couch.cozy']);
  await reset(page);
  expect((await state(page)).album.pending).toEqual([]);
  await besideCouch(page);
  await until(page, (s) => s.couch.damage === 1);
  await page.reload();
  await waitForGame(page);
  expect((await state(page)).album.pending).toEqual([]);
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('pixels-world.album')!).discovered),
  ).toEqual(['vase.blue']);
  await (await introAction(page, 'album')).click();
  await expect(page.locator('.album-overall')).toHaveText(
    `Insgesamt: 1 von ${albumEntries(true).length}`,
  );
  await expect(page.locator('.album-dialog')).not.toContainText('Das gemütliche Sofa');
});

test('Korrupte Album-Daten blockieren weder Einführung noch Sammlung', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pixels-world.album', '{'));
  await loadIntro(page);
  await (await introAction(page, 'album')).click();
  await expect(page.locator('.album-overall')).toHaveText(
    `Insgesamt: 0 von ${albumEntries(true).length}`,
  );
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
  await waitForLoadingScreen(page);
  await (await introAction(page, 'album')).click();
  await expect(page.locator('.album-overall')).toHaveText('Insgesamt: 0 von 13');
  await expect(page.locator('.album-tile:disabled')).toHaveCount(9);
  await expect(page.locator('.album-dialog img')).toHaveCount(0);
});

test.describe('Mobile Buchseiten', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  test('Übersicht, Einzelobjekt und Querformat bleiben innerhalb des Bildschirms', async ({
    page,
  }) => {
    await page.addInitScript(() =>
      localStorage.setItem(
        'pixels-world.album',
        JSON.stringify({ version: 1, discovered: ['couch.cozy'] }),
      ),
    );
    await start(page);
    await page.locator('.album-toggle').click();
    const album = page.locator('.album-dialog');

    await expect(page.locator('.pause-menu')).toBeHidden();
    const paused = await state(page);

    expect(paused.round.phase).toBe('chaos');
    expect(paused.active).toBe(false);
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
    await album.getByRole('button', { name: 'Nächste Seite', exact: true }).click();
    await expect(album.locator('.album-pagination')).toContainText('Seite 2 von 3');
    await album.locator('[data-action="close"]').click();
    await expect(album).toBeHidden();
    await expect(page.locator('.pause-menu')).toBeHidden();
    expect((await state(page)).active).toBe(true);
    await expect(page.locator('.album-toggle')).toHaveCount(1);
    await page.clock.runFor(160);
    expect((await state(page)).round.elapsedMs).toBeGreaterThan(paused.round.elapsedMs);
  });
});

async function bannerFits(page: Page) {
  const banner = await page.locator('.album-banner').boundingBox();
  const game = await page.locator('#game').boundingBox();

  expect(banner!.x).toBeGreaterThanOrEqual(game!.x);
  expect(banner!.y).toBeGreaterThanOrEqual(game!.y);
  expect(banner!.x + banner!.width).toBeLessThanOrEqual(game!.x + game!.width);
  expect(banner!.y + banner!.height).toBeLessThanOrEqual(game!.y + game!.height);

  for (const selector of ['.room-selection-return', '.mobile-dialogue', '.touch-actions button']) {
    for (const element of await page.locator(selector).all()) {
      if (!(await element.isVisible())) continue;
      const box = await element.boundingBox();

      expect(
        box!.x + box!.width <= banner!.x ||
          box!.x >= banner!.x + banner!.width ||
          box!.y + box!.height <= banner!.y ||
          box!.y >= banner!.y + banner!.height,
      ).toBe(true);
    }
  }
}

test.describe('Album-Banner auf dem Handy', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  test('Einzelfund bleibt bei Drehung erreichbar und respektiert reduzierte Bewegung', async ({
    page,
  }) => {
    await page.addInitScript(() => localStorage.setItem('pixels-world.reduced-motion', 'true'));
    await scratch(page);
    await finishAlbumRound(page, true);
    const banner = page.locator('.album-banner');

    await expect(banner).toBeVisible();
    await expect(banner).toHaveAttribute('data-entry', 'couch.cozy');
    await expect(banner).toHaveCSS('animation-name', 'none');
    expect(
      await banner
        .locator('img')
        .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
    ).toBe(true);
    await bannerFits(page);
    await test
      .info()
      .attach('album-banner-hoch', { body: await page.screenshot(), contentType: 'image/png' });

    for (const viewport of [
      { width: 320, height: 568 },
      { width: 568, height: 320 },
      { width: 844, height: 390 },
    ]) {
      await page.setViewportSize(viewport);
      await page.clock.runFor(100);
      await bannerFits(page);
    }

    await test
      .info()
      .attach('album-banner-quer', { body: await page.screenshot(), contentType: 'image/png' });
    await page.locator('.album-toggle').click();
    await page.clock.runFor(4000);
    await page.keyboard.press('Escape');
    await expect(banner).toBeVisible();
    await page.clock.runFor(3300);
    await expect(banner).toHaveAttribute('data-entry', 'achievement.angel-1');
    await page.clock.runFor(3300);
    await expect(banner).toHaveAttribute('data-entry', 'achievement.category-couches-v1');
    await page.clock.runFor(3300);
    await expect(banner).toBeHidden();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.clock.runFor(100);
    await page.locator('.room-selection-return').focus();
    await page.keyboard.press('Space');
    await page.clock.runFor(160);
    await expect(page.locator('.room-selection')).toBeVisible();
    await expect(banner).toHaveCount(1);
    await expect(banner).toBeHidden();
  });
});
