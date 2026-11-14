/* eslint-disable max-lines-per-function -- Tatsächlicher Rundenabschluss und Gerätewechsel prüfen den zusammenhängenden Erfolgsvertrag. */
import {
  test,
  expect,
  start,
  until,
  besideCouch,
  loadIntro,
  introAction,
  waitForGame,
} from './support';
import { finishAlbumRound } from './album-support';
import { seedRoundRandom } from './round-clock';
import { changeLanguage } from './pause-support';
import type { Page } from '@playwright/test';

async function seed(page: Page, count: number, ruined: string[]) {
  await page.addInitScript(
    ({ count, ruined }) => {
      localStorage.setItem('pixels-world.storage', '{"album":true,"offline":false}');

      if (!localStorage.getItem('pixels-world.album'))
        localStorage.setItem(
          'pixels-world.album',
          JSON.stringify({
            version: 2,
            discovered: [],
            achievements: { reconciliations: count, ruined, unlocked: ['achievement.angel-1'] },
          }),
        );
    },
    { count, ruined },
  );
}

async function savedProgress(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('pixels-world.album')!).achievements);
}

test('Echte letzte Schadensstufe bestätigt zwei Erfolge einmalig und reiht sie hinter dem Albumfund ein @smoke', async ({
  page,
}) => {
  await seed(page, 9, ['vase', 'curtain', 'plant', 'books', 'picture', 'shelf']);
  await seedRoundRandom(page);
  await start(page, '/?round-profile=fast');
  await besideCouch(page);
  await until(page, (s) => s.couch.damage === 6);
  expect((await savedProgress(page)).reconciliations).toBe(9);
  expect((await savedProgress(page)).ruined).not.toContain('couch');
  await finishAlbumRound(page, true);
  const progress = await savedProgress(page);
  const banner = page.locator('.album-banner');

  expect(progress.reconciliations).toBe(10);
  expect(progress.ruined).toHaveLength(7);
  expect(progress.unlocked).toEqual([
    'achievement.angel-1',
    'achievement.angel-10',
    'achievement.destruction-v1',
  ]);
  await expect(banner).toHaveAttribute('data-entry', 'couch.cozy');
  await page.clock.runFor(3100);
  await expect(banner).toHaveAttribute('data-entry', 'achievement.angel-10');
  await expect(banner).toContainText('Unschuldsengel II');
  await expect
    .poll(() =>
      banner
        .locator('img')
        .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
    )
    .toBe(true);
  await page.clock.runFor(3100);
  await expect(banner).toHaveAttribute('data-entry', 'achievement.destruction-v1');
  await expect(banner).toContainText('Meister der Zerstörung');
  await page.clock.runFor(3100);
  await expect(banner).toBeHidden();
  expect(await savedProgress(page)).toEqual(progress);
  await page.reload();
  await waitForGame(page);
  expect(await savedProgress(page)).toEqual(progress);
  await (await introAction(page, 'album')).click();
  await page.getByRole('tab', { name: 'Erfolge', exact: true }).click();
  await expect(page.locator('.achievement-index')).toContainText('3 von 5 freigeschaltet');
  await expect(page.locator('.album-overall')).toHaveText('10 erfolgreiche Versöhnungen');
});

for (const mobile of [false, true])
  test.describe(mobile ? 'Erfolge auf dem Handy' : 'Erfolge auf Desktop', () => {
    test.use({
      hasTouch: mobile,
      isMobile: mobile,
      viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 },
    });
    test('Reiter, gesperrte Details, Fortschritt und Sprache bleiben erreichbar', async ({
      page,
    }) => {
      await seed(page, 24, ['vase', 'couch', 'curtain', 'plant']);
      await loadIntro(page);
      await (await introAction(page, 'album')).click();
      await page.getByRole('tab', { name: 'Erfolge', exact: true }).click();
      const album = page.locator('.album-dialog');

      await expect(album.locator('.achievement-tile')).toHaveCount(5);
      await expect(album.locator('.album-progress')).toHaveAttribute(
        'aria-label',
        '2 von 5 freigeschaltet',
      );
      await page.getByRole('button', { name: /Unschuldsengel IV/ }).click();
      await expect(album.locator('.achievement-count')).toHaveText('24 / 100 Versöhnungen');
      await expect(album.locator('.achievement-state')).toHaveText('Noch gesperrt');
      await expect(album.locator('progress')).toHaveAttribute('value', '24');

      for (const viewport of mobile
        ? [
            { width: 320, height: 568 },
            { width: 844, height: 390 },
            { width: 568, height: 320 },
          ]
        : [{ width: 1280, height: 900 }]) {
        await page.setViewportSize(viewport);
        await page.clock.runFor(64);
        await page.getByRole('tab', { name: 'Erfolge', exact: true }).click();
        await assertFits(album);
        await page.getByRole('button', { name: /Meister der Zerstörung/ }).click();
        await expect(album.locator('.achievement-targets li')).toHaveCount(7);
        await expect(album.locator('.achievement-count')).toHaveText('4 / 7 Objektarten');
        await assertFits(album);
        await album.locator('.achievement-targets li').last().scrollIntoViewIfNeeded();
        await expect(album.locator('.achievement-targets li').last()).toBeInViewport();
      }

      await test.info().attach(mobile ? 'erfolge-handy' : 'erfolge-desktop', {
        body: await page.screenshot(),
        contentType: 'image/png',
      });
      await page.keyboard.press('Escape');
      await changeLanguage(page, 'en');
      await (await introAction(page, 'album')).click();
      await page.getByRole('tab', { name: 'Achievements', exact: true }).click();
      await page.getByRole('button', { name: /Little angel III/ }).click();
      await expect(album.locator('.achievement-count')).toHaveText('24 / 50 reconciliations');
      await expect(album.locator('.achievement-state')).toHaveText('Locked');
      await page.keyboard.press('Escape');
    });
  });

async function assertFits(album: ReturnType<Page['locator']>) {
  const geometry = await album.evaluate((el) => {
    const panel = el.querySelector('#album-room')!;
    const active = el.querySelector('.achievement-index')!;
    const story = el.querySelector('.achievement-story')!;

    return {
      dialogScroll: el.scrollHeight - el.clientHeight,
      width: el.scrollWidth - el.clientWidth,
      panelHeight: panel.clientHeight,
      indexOverflow:
        getComputedStyle(active).display !== 'none' ? active.scrollHeight - active.clientHeight : 0,
      storyOverflow:
        getComputedStyle(story).display !== 'none' ? story.scrollHeight - story.clientHeight : 0,
      landscape: matchMedia('(orientation: landscape)').matches,
    };
  });

  expect(geometry.width).toBeLessThanOrEqual(1);
  expect(geometry.dialogScroll).toBeLessThanOrEqual(1);
  expect(geometry.indexOverflow).toBeLessThanOrEqual(1);

  if (geometry.landscape) expect(geometry.storyOverflow).toBeLessThanOrEqual(1);
}
