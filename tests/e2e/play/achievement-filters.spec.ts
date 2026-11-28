/* eslint-disable max-lines-per-function -- Gespeicherter Fortschritt, echte Filter-/Seiteneingaben und Gerätewechsel bilden einen vollständigen Nutzerablauf. */
import { test, expect, waitForGame } from '../support/support';
import { ACHIEVEMENTS, DESTRUCTION_TARGETS } from '../../../game/play/content/achievements';
import { DESTRUCTION_VARIANTS } from '../../../game/play/content/achievement-categories';
import { ROOM_COMPLETIONS } from '../../../game/play/content/achievement-rooms';
import { AchievementProgress, EMPTY_ACHIEVEMENTS } from '../../../game/play/album/achievements';
import type { Page } from '@playwright/test';

async function savedAlbum(page: Page, mode: 'empty' | 'mixed' | 'complete') {
  const progress = new AchievementProgress();

  progress.restore({
    ...EMPTY_ACHIEVEMENTS,
    reconciliations: mode === 'complete' ? 1000 : mode === 'mixed' ? 24 : 0,
    ruined: mode === 'empty' ? [] : DESTRUCTION_TARGETS.map((entry) => entry.id),
    ruinedVariants: mode === 'empty' ? [] : DESTRUCTION_VARIANTS,
    completedRooms: mode === 'complete' ? ROOM_COMPLETIONS : [],
    unlocked: mode === 'complete' ? ACHIEVEMENTS.map((entry) => entry.id) : [],
  });
  const data = progress.snapshot();

  await page.addInitScript((achievements) => {
    localStorage.setItem('pixels-world.storage', '{"album":true,"offline":false}');
    localStorage.setItem(
      'pixels-world.album',
      JSON.stringify({ version: 2, discovered: [], achievements }),
    );
  }, data);
  await page.goto('/play.html');
  await waitForGame(page, false);
  await page.locator('[data-pause-album]').click();
  await page.getByRole('tab', { name: 'Erfolge', exact: true }).click();

  return data;
}

async function allPages(page: Page) {
  const ids: string[] = [];
  const next = page.locator('.album-screen [data-action="page-next"]');

  for (let index = 0; index < ACHIEVEMENTS.length; index++) {
    ids.push(
      ...(await page
        .locator('.achievement-tile')
        .evaluateAll((tiles) => tiles.map((tile) => (tile as HTMLElement).dataset.achievement!))),
    );

    if (await next.isDisabled()) break;
    await next.click();
  }

  return ids;
}

for (const viewport of [
  { width: 1280, height: 900 },
  { width: 390, height: 844 },
  { width: 568, height: 320 },
]) {
  test(`Erfolgsfilter ${viewport.width}: korrekte Partition, Seitenreset und Fokus @smoke`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const data = await savedAlbum(page, 'mixed');
    const before = await page.evaluate(() => localStorage.getItem('pixels-world.album'));
    const expectedOpen = ACHIEVEMENTS.filter((entry) => !data.unlocked.includes(entry.id)).map(
      (entry) => entry.id,
    );
    const expectedCompleted = ACHIEVEMENTS.filter((entry) => data.unlocked.includes(entry.id)).map(
      (entry) => entry.id,
    );
    const open = page.getByRole('button', { name: 'Offen', exact: true });
    const completed = page.getByRole('button', { name: 'Abgeschlossen', exact: true });

    await page.locator('[data-action="page-next"]').click();
    await open.click();
    await expect(open).toHaveAttribute('aria-pressed', 'true');
    await expect(open).toBeFocused();
    await expect(page.locator('.album-pagination')).toContainText('Seite 1 von');
    expect(await allPages(page)).toEqual(expectedOpen);
    await expect(page.locator('.achievement-tile:not(:disabled)')).toHaveCount(0);
    await completed.click();
    await expect(completed).toHaveAttribute('aria-pressed', 'true');
    expect(await allPages(page)).toEqual(expectedCompleted);
    await expect(page.locator('.achievement-tile:disabled')).toHaveCount(0);
    await expect(page.locator('.album-progress')).toHaveAttribute(
      'aria-label',
      `${data.unlocked.length} von ${ACHIEVEMENTS.length} freigeschaltet`,
    );
    await page.getByRole('tab', { name: 'Wohnzimmer', exact: true }).click();
    await page.getByRole('tab', { name: 'Erfolge', exact: true }).click();
    await expect(completed).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Alle', exact: true }).click();
    expect(await allPages(page)).toEqual(ACHIEVEMENTS.map((entry) => entry.id));
    expect(await page.evaluate(() => localStorage.getItem('pixels-world.album'))).toBe(before);
    expect(await page.evaluate(() => scrollY)).toBe(0);
    await expect(page.locator('main > header .pause-toggle')).toBeInViewport({ ratio: 1 });
  });
}

for (const mode of ['empty', 'complete'] as const) {
  test(`Erfolgsfilter: Leerzustand ${mode} bleibt lokalisiert und bedienbar @smoke`, async ({
    page,
  }) => {
    await savedAlbum(page, mode);
    const filter = mode === 'empty' ? 'completed' : 'open';

    await page.locator(`[data-achievement-filter="${filter}"]`).click();
    await expect(page.locator('.achievement-filter-empty')).toHaveText(
      mode === 'empty' ? 'Noch keine abgeschlossenen Erfolge.' : 'Alle Erfolge sind abgeschlossen!',
    );
    await expect(page.locator('.achievement-tile')).toHaveCount(0);
    await expect(page.locator('.album-pagination')).toHaveCount(0);
    await page.locator('main > header .pause-toggle').click();
    await page.locator('[data-menu-settings]').click();
    await page.locator('[data-language="en"]').click();
    await page.locator('main > header .pause-toggle').click();
    await page.locator('[data-pause-album]').click();
    await expect(page.locator(`[data-achievement-filter="${filter}"]`)).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByRole('group', { name: 'Filter achievements' })).toBeVisible();
    await expect(page.locator('.achievement-filter-empty')).toHaveText(
      mode === 'empty' ? 'No completed achievements yet.' : 'All achievements are completed!',
    );
    await page.getByRole('button', { name: 'All', exact: true }).click();
    await expect(page.locator('.achievement-tile')).toHaveCount(4);
  });
}
