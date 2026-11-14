import { DESTRUCTION_VARIANTS } from '../../src/content/achievement-categories';
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
import { changeLanguage, openPause } from './pause-support';
import type { Page } from '@playwright/test';

async function seed(page: Page, count: number, ruined: string[], variants: readonly string[] = []) {
  await page.addInitScript(
    ({ count, ruined, variants }) => {
      localStorage.setItem('pixels-world.storage', '{"album":true,"offline":false}');

      if (!localStorage.getItem('pixels-world.album'))
        localStorage.setItem(
          'pixels-world.album',
          JSON.stringify({
            version: 2,
            discovered: [],
            achievements: {
              reconciliations: count,
              ruined,
              ruinedVariants: variants,
              unlocked: ['achievement.angel-1'],
            },
          }),
        );
    },
    { count, ruined, variants },
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
    'achievement.category-couches-v1',
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
  await expect(banner).toHaveAttribute('data-entry', 'achievement.category-couches-v1');
  await expect(banner).toContainText('Alle Sofas');
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
  await expect(page.locator('.achievement-index')).toContainText('4 von 12 freigeschaltet');
  await expect(page.locator('.album-overall')).toHaveText('10 erfolgreiche Versöhnungen');
});

for (const mobile of [false, true])
  test.describe(mobile ? 'Erfolge auf dem Handy' : 'Erfolge auf Desktop', () => {
    test.use({
      hasTouch: mobile,
      isMobile: mobile,
      viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 },
    });
    test('Gesperrte Erfolge, Seiten und freigespielte Details bleiben bedienbar', async ({
      page,
    }) => {
      await seed(
        page,
        24,
        ['vase', 'couch', 'curtain', 'plant', 'books', 'picture', 'shelf'],
        DESTRUCTION_VARIANTS,
      );
      await loadIntro(page);
      await (await introAction(page, 'album')).click();
      await page.getByRole('tab', { name: 'Erfolge', exact: true }).click();
      const album = page.locator('.album-dialog');

      await expect(album.locator('.achievement-tile')).toHaveCount(4);
      await expect(album.locator('.album-progress')).toHaveAttribute(
        'aria-label',
        '10 von 12 freigeschaltet',
      );
      await expect(page.getByRole('button', { name: /Unschuldsengel IV/ })).toBeDisabled();
      const second = page.getByRole('button', { name: /Unschuldsengel II Freigeschaltet/ });

      await second.focus();
      await page.keyboard.press('Tab');
      await expect(album.locator('[data-action="page-next"]')).toBeFocused();
      await second.click();
      await expect(album.locator('.achievement-count')).toHaveText('10 / 10 Versöhnungen');
      await expect(album.locator('.achievement-state')).toContainText('Freigeschaltet');
      await expect(album.locator('progress')).toHaveAttribute('value', '10');

      for (const viewport of mobile
        ? [
            { width: 320, height: 568 },
            { width: 844, height: 390 },
            { width: 568, height: 320 },
          ]
        : [{ width: 1280, height: 900 }]) {
        await page.setViewportSize(viewport);
        await page.clock.runFor(64);
        await firstAchievementPage(album);
        await assertFits(album);
        await album.locator('[data-action="page-next"]').click();
        await assertFits(album);
        await page.getByRole('button', { name: /Alle Vasen/ }).click();
        await expect(album.locator('.achievement-count')).toHaveText('4 / 4 Varianten');
        await expect(album.locator('.achievement-targets li')).toHaveCount(4);
        await assertFits(album);
        await page.getByRole('tab', { name: 'Erfolge', exact: true }).click();
        await expect(album.locator('.album-pagination')).toContainText('Seite 2 von 3');
        await album.locator('[data-action="page-next"]').click();
        await assertFits(album);
        await page.getByRole('button', { name: /Meister der Zerstörung/ }).click();
        await expect(album.locator('.achievement-targets li')).toHaveCount(7);
        await expect(album.locator('.achievement-count')).toHaveText('7 / 7 Objektarten');
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
      await expect(page.getByRole('tab', { name: 'Achievements', exact: true })).toBeVisible();
      await firstAchievementPage(album);
      await expect(page.getByRole('button', { name: /Little angel III/ })).toBeDisabled();
      await page.getByRole('button', { name: /Little angel II Unlocked/ }).click();
      await expect(album.locator('.achievement-count')).toHaveText('10 / 10 reconciliations');
      await expect(album.locator('.achievement-state')).toContainText('Unlocked');
      await page.keyboard.press('Escape');
      await openPause(page);
      await page.locator('[data-album-reset="ask"]').click();
      await page.locator('[data-album-reset="confirm"]').click();
      await page.locator('[data-pause-album]').click();
      await page.getByRole('tab', { name: 'Achievements', exact: true }).click();
      await expect(album.locator('.achievement-tile:not(:disabled)')).toHaveCount(0);
      await expect(album.locator('.achievement-state')).toHaveCount(0);
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

async function firstAchievementPage(album: ReturnType<Page['locator']>) {
  await album.locator('#album-tab-achievements').click();

  for (let index = 0; index < 2; index++)
    if (await album.locator('[data-action="page-previous"]').isEnabled())
      await album.locator('[data-action="page-previous"]').click();
}
