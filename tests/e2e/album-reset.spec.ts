/* eslint-disable max-lines-per-function -- Eine echte laufende Runde verbindet Bestätigung, Sprachwechsel, Pause und getrennte Speicherzustände. */
import {
  introAction,
  test,
  expect,
  start,
  state,
  until,
  besideCouch,
  waitForGame,
} from './support';
import { openPause } from './pause-support';

// Existing persistence/layout contracts start with a returning player's saved choice.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('pixels-world.storage', '{"album":true,"offline":false}'),
  );
});

test(
  'Album nur in Optionen löschen: Abbrechen und Schließen bewahren Funde, Bestätigen erhält die Runde',
  { tag: '@smoke' },
  async ({ page }) => {
    await page.addInitScript(() => {
      if (!localStorage.getItem('pixels-world.album'))
        localStorage.setItem(
          'pixels-world.album',
          JSON.stringify({ version: 1, discovered: ['vase.blue'] }),
        );
    });
    await start(page);
    await besideCouch(page);
    await until(page, (s) => s.couch.damage === 1);
    await openPause(page);
    const options = page.locator('.pause-menu');
    const paused = await state(page);

    expect(paused.album.pending).toEqual(['couch.cozy']);
    await options.locator('[data-album-reset="ask"]').click();
    await expect(options.locator('[data-album-reset="cancel"]')).toBeFocused();
    await page.keyboard.press('Escape');
    await openPause(page);
    await expect(options.locator('#album-reset-question')).toHaveCount(0);
    expect(
      await page.evaluate(() => JSON.parse(localStorage.getItem('pixels-world.album')!).discovered),
    ).toEqual(['vase.blue']);
    await options.locator('[data-album-reset="ask"]').click();
    await options.getByRole('button', { name: 'English', exact: true }).click();
    await expect(options.locator('#album-reset-question')).toContainText(
      'Clear all confirmed album discoveries?',
    );
    await options.getByRole('button', { name: 'Cancel', exact: true }).click();
    expect(
      await page.evaluate(() => JSON.parse(localStorage.getItem('pixels-world.album')!).discovered),
    ).toEqual(['vase.blue']);
    const beforeDelete = await state(page);

    await options.getByRole('button', { name: 'Reset album', exact: true }).click();
    await options.getByRole('button', { name: 'Clear discoveries', exact: true }).click();
    await page.clock.runFor(1000);
    const afterDelete = await state(page);

    expect(afterDelete.active).toBe(false);
    expect(afterDelete.generation).toBe(beforeDelete.generation);
    expect(afterDelete.round).toEqual(beforeDelete.round);
    expect(afterDelete.chaos).toEqual(beforeDelete.chaos);
    expect(afterDelete.album.pending).toEqual(['couch.cozy']);
    expect(
      await page.evaluate(() => JSON.parse(localStorage.getItem('pixels-world.album')!).discovered),
    ).toEqual([]);
    await options.getByRole('button', { name: 'Close options', exact: true }).click();
    await page.locator('.album-toggle').click();
    await expect(page.locator('.album-overall')).toHaveText('Overall: 0 of 14');
    await expect(page.locator('.album-dialog img')).toHaveCount(0);
    await expect(page.locator('.album-dialog [data-album-reset]')).toHaveCount(0);
    await page.reload();
    await waitForGame(page);
    await (await introAction(page, 'album')).click();
    await expect(page.locator('.album-overall')).toHaveText('Overall: 0 of 14');
    await expect(page.locator('[data-pause-album-reset]')).toHaveCount(1);
  },
);
