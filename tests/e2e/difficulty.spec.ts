import { TouchDriver } from './touch-support';
import { test, expect, state, until, waitForGame, loadIntro, holdUntil } from './support';
import { startDifficulty } from './difficulty-support';
import { openPause } from './pause-support';

// eslint-disable-next-line max-lines-per-function -- Auswahl vor Spielbeginn, eingefrorene laufende Runde und nächste Runde bilden einen gemeinsamen Benutzerablauf.
test('Schwierigkeit gilt ab Rundenstart und bleibt nach Reload erhalten', async ({ page }) => {
  await startDifficulty(page, 'hard');
  const active = await state(page);

  expect(active.objects.filter((o) => o.kind !== 'picture')).toHaveLength(14);
  expect(active.goalView).toMatchObject({
    ballVisible: true,
    markerVisible: false,
    markerWidth: 0,
  });
  expect(active.round.returnAtMs).toBeGreaterThanOrEqual(45_000);
  expect(active.round.returnAtMs).toBeLessThanOrEqual(78_750);
  expect(active.hud.scoreText).toContain('Schwer');
  await openPause(page);
  await page.getByLabel('Schwierigkeitsgrad', { exact: true }).selectOption('easy');
  await expect(page.locator('[data-difficulty-current]')).toContainText('Aktuelle Runde: Schwer');
  await expect(page.locator('#difficulty-help')).toContainText('Mehr Zeit, weniger Chaosobjekte');
  const paused = await state(page);

  await page.clock.runFor(5000);
  expect((await state(page)).round).toEqual(paused.round);
  expect((await state(page)).objects).toEqual(paused.objects);
  expect((await state(page)).difficulty).toBe('hard');
  expect((await state(page)).goalView).toEqual(paused.goalView);
  await page.locator('[data-pause-restart]').click();
  await until(page, (s) => s.started && s.difficulty === 'easy');
  const next = await state(page);

  expect(next.objects.filter((o) => o.kind !== 'picture')).toHaveLength(6);
  expect(next.goalView).toMatchObject({ ballVisible: true, markerVisible: true, markerWidth: 36 });
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
  await expect(page.locator('#difficulty-help')).toContainText('More time, fewer objects');
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
    expect((await state(page)).objects.filter((o) => o.kind !== 'picture')).toHaveLength(6);
    await until(page, (s) => s.pixel.grounded);
    expect((await state(page)).pixel.velocityY).toBe(0);
  });
});

for (const room of ['living-room', 'cozy-remix']) {
  test(`Schwer: einzelne Slotvasen auf der Regaltreppe im ${room}`, async ({
    page,
    // eslint-disable-next-line max-lines-per-function -- Die komplette Regaltreppe wird mit echten Sprüngen und Anschubsen bis zum Herunterwerfen jeder zusätzlichen Vase gespielt.
  }, testInfo) => {
    await startDifficulty(page, 'hard', `/?room=${room}`);
    const shelves = (await state(page)).shelves;

    expect(shelves.find((s) => s.id === 'middle-shelf')?.stability).toBe('fragile');
    expect(shelves.find((s) => s.id === 'upper-shelf')?.stability).toBe('stable');
    expect(
      shelves.filter((s) => s.id.startsWith('difficulty-shelf-')).map((s) => s.stability),
    ).toEqual(['fragile', 'normal', 'fragile', 'normal']);
    await page.screenshot({ path: testInfo.outputPath('regaltreppe-vorher.png') });
    await holdUntil(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 265);
    await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 370) < 2);
    await holdUntil(page, ['ArrowLeft'], (s) => s.pixel.x <= 195);
    await holdUntil(page, ['Space', 'ArrowLeft'], (s) => s.pixel.x <= 30);
    await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 330) < 2);
    await holdUntil(
      page,
      ['ArrowRight'],
      (s) => s.vases.find((v) => v.id.startsWith('difficulty-shelf-1:'))?.state !== 'resting',
    );
    await until(
      page,
      (s) => s.vases.find((v) => v.id.startsWith('difficulty-shelf-1:'))?.state === 'broken',
    );
    await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= 90);

    for (const [id, landingX, y, edgeX] of [
      ['difficulty-shelf-2:', 310, 250, 330],
      ['difficulty-shelf-3:', 490, 170, 510],
      ['difficulty-shelf-4:', 670, 90, 690],
    ] as const) {
      await holdUntil(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= landingX);
      await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - y) < 2);
      await holdUntil(
        page,
        ['ArrowLeft'],
        (s) => s.vases.find((v) => v.id.startsWith(id))?.state !== 'resting',
      );
      await until(page, (s) => (s.vases.find((v) => v.id.startsWith(id))?.bottom ?? 0) > y + 8);
      await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= edgeX);
    }

    expect(
      (await state(page)).vases
        .filter((v) => v.id.startsWith('difficulty-shelf-'))
        .every((v) => v.state !== 'resting'),
    ).toBe(true);
    await testInfo.attach('regaltreppe-gespielt', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
  });
}

// eslint-disable-next-line max-lines-per-function -- Alle drei Grade werden über die sichtbare Optionswahl in derselben mobilen Darstellung gestartet.
test.describe('Zielhinweis auf Touch-Geräten', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  for (const difficulty of ['easy', 'normal', 'hard'] as const) {
    // eslint-disable-next-line max-lines-per-function -- Mobile Darstellung und sichtbarer Zustand werden gemeinsam geprüft und aufgenommen.
    test(`Lieblingsball und ${difficulty}-Zielhinweis im Hochformat`, async ({ page }) => {
      await startDifficulty(page, difficulty);
      expect((await state(page)).goalView).toMatchObject({
        ballVisible: true,
        markerVisible: difficulty !== 'hard',
        markerWidth: { easy: 36, normal: 22, hard: 0 }[difficulty],
      });
      await test.info().attach('zielhinweis-handheld', {
        body: await page.screenshot(),
        contentType: 'image/png',
      });
    });
  }
});
