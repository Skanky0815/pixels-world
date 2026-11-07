import { TouchDriver } from './touch-support';
import { test, expect, state, until, waitForGame, loadIntro, holdUntil } from './support';
import { startDifficulty } from './difficulty-support';
import { openPause } from './pause-support';

// eslint-disable-next-line max-lines-per-function -- Auswahl vor Spielbeginn, eingefrorene laufende Runde und nächste Runde bilden einen gemeinsamen Benutzerablauf.
test('Schwierigkeit gilt ab Rundenstart und bleibt nach Reload erhalten', async ({ page }) => {
  await startDifficulty(page, 'hard');
  const active = await state(page);

  expect(active.objects).toHaveLength(10);
  expect(active.round.returnAtMs).toBeGreaterThanOrEqual(45_000);
  expect(active.round.returnAtMs).toBeLessThanOrEqual(78_750);
  expect(active.hud.scoreText).toContain('Schwer');
  await openPause(page);
  await page.getByLabel('Schwierigkeitsgrad', { exact: true }).selectOption('easy');
  await expect(page.locator('[data-difficulty-current]')).toContainText('Aktuelle Runde: Schwer');
  const paused = await state(page);

  await page.clock.runFor(5000);
  expect((await state(page)).round).toEqual(paused.round);
  expect((await state(page)).objects).toEqual(paused.objects);
  expect((await state(page)).difficulty).toBe('hard');
  await page.locator('[data-pause-restart]').click();
  await until(page, (s) => s.started && s.difficulty === 'easy');
  const next = await state(page);

  expect(next.objects).toHaveLength(4);
  expect(next.round.returnAtMs).toBeGreaterThanOrEqual(90_000);
  expect(next.round.returnAtMs).toBeLessThanOrEqual(157_500);
  expect(next.hud.scoreText).toContain('Leicht');
  await page.reload();
  await waitForGame(page);
  expect((await state(page)).difficulty).toBe('easy');
  expect((await state(page)).started).toBe(false);
  await page.getByRole('button', { name: 'Optionen', exact: true }).click();
  await expect(page.getByLabel('Schwierigkeitsgrad', { exact: true })).toHaveValue('easy');
  await page.locator('[data-language="en"]').click();
  await expect(page.getByLabel('Difficulty', { exact: true })).toHaveValue('easy');
  await expect(page.getByRole('option', { name: 'Hard', exact: true })).toHaveCount(1);
});

// eslint-disable-next-line max-lines-per-function -- Die Gerätegruppe begrenzt die Emulation auf den Touch-Einstieg.
test.describe('Schwierigkeitswahl mit Touch', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 844, height: 390 } });
  test('Optionen bleiben vor dem Start im Handheld erreichbar', async ({
    page,
    // eslint-disable-next-line max-lines-per-function -- Native Optionen und der reale Weiter-Button starten dieselbe gewählte Runde ohne Tastatur.
  }, testInfo) => {
    await loadIntro(page);
    await page.getByRole('button', { name: 'Optionen', exact: true }).tap();
    await page.getByLabel('Schwierigkeitsgrad', { exact: true }).selectOption('easy');
    const bounds = await page.locator('.pause-menu').boundingBox();

    expect(bounds && bounds.x >= 0 && bounds.y >= 0 && bounds.height <= 390).toBe(true);
    await testInfo.attach('optionen-handheld', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
    await page.locator('[data-pause-resume]').tap();
    const touch = await TouchDriver.create(page);

    await touch.press('jump');
    await until(page, (s) => s.started && s.difficulty === 'easy');
    await touch.lift();
    expect((await state(page)).objects).toHaveLength(4);
    await until(page, (s) => s.pixel.grounded);
    expect((await state(page)).pixel.velocityY).toBe(0);
  });
});

for (const room of ['living-room', 'cozy-remix']) {
  test(`Schwer: einzelne verschiedenfarbige Vasen auf der Regaltreppe im ${room}`, async ({
    page,
    // eslint-disable-next-line max-lines-per-function -- Die komplette Regaltreppe wird mit echten Sprüngen und Anschubsen bis zum Herunterwerfen jeder zusätzlichen Vase gespielt.
  }, testInfo) => {
    await startDifficulty(page, 'hard', `/?room=${room}`);
    await page.screenshot({ path: testInfo.outputPath('regaltreppe-vorher.png') });
    await holdUntil(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 265);
    await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 370) < 2);
    await holdUntil(page, ['ArrowLeft'], (s) => s.pixel.x <= 195);
    await holdUntil(page, ['Space', 'ArrowLeft'], (s) => s.pixel.x <= 30);
    await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 330) < 2);
    await holdUntil(
      page,
      ['ArrowRight'],
      (s) => s.vases.find((v) => v.id === 'difficulty-vase-1')?.state !== 'resting',
    );
    await until(page, (s) => s.vases.find((v) => v.id === 'difficulty-vase-1')?.state === 'broken');
    await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= 90);

    for (const [id, landingX, y, edgeX] of [
      ['difficulty-vase-2', 310, 250, 330],
      ['difficulty-vase-3', 490, 170, 510],
      ['difficulty-vase-4', 670, 90, 690],
    ] as const) {
      await holdUntil(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= landingX);
      await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - y) < 2);
      await holdUntil(
        page,
        ['ArrowLeft'],
        (s) => s.vases.find((v) => v.id === id)?.state !== 'resting',
      );
      await until(page, (s) => (s.vases.find((v) => v.id === id)?.bottom ?? 0) > y + 8);
      await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= edgeX);
    }

    expect(
      (await state(page)).vases
        .filter((v) => v.id.startsWith('difficulty-vase-'))
        .every((v) => v.state !== 'resting'),
    ).toBe(true);
    await testInfo.attach('regaltreppe-gespielt', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
  });
}
