/* eslint-disable max-lines-per-function -- Echte Schäden und wiederholter Reset prüfen die verborgene Punktanzeige bei unveränderter Wertung. */
import { test, expect, state, start, until, reset, besideCouch } from './support';

test('Während der Runde bleiben Punktzahlen verborgen; Schäden und Reset werden weiter korrekt gewertet', async ({
  page,
}) => {
  await start(page);
  expect((await state(page)).chaos.score).toBe(0);

  for (let round = 0; round < 3; round++) {
    await besideCouch(page);
    await until(page, (s) => s.couch.damage === 1);
    expect((await state(page)).chaos.score).toBe(3);
    await expect(page.locator('.mobile-hud')).not.toContainText(/CHAOS:|\+\d/);
    await expect(page.locator('.game-feedback-layer')).not.toContainText(/\+\d/);
    await expect(page.locator('.mobile-hud .mobile-notice')).toContainText('Kratzen');
    await reset(page);
    expect((await state(page)).chaos.score).toBe(0);
  }
});
