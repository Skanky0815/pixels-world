import { test, expect, loadIntro, state, until, reset } from './support';

test('Kurze Einführung zeigt Ziel und Steuerung; vor dem Start bleiben Uhr, Schäden und Pixel stehen', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Zusammenhängendes Start-/Neustartszenario mit echten Tasten und vollständiger Zustandsprüfung.
}) => {
  await loadIntro(page);
  const before = await state(page);
  const intro = page.getByRole('region', { name: 'Spieleinführung' });

  await expect(intro).toBeVisible();
  await expect(intro.getByRole('heading', { name: 'Bereit, Pixel?' })).toBeVisible();
  await expect(intro.locator('img')).toHaveCount(0);
  await expect(intro.locator('.keyboard-prompt')).toHaveText('␣ Starten');
  await expect(intro.locator('.keyboard-prompt')).toHaveAccessibleName(
    'Leertaste drücken, um zu starten',
  );
  await expect(intro.getByRole('img', { name: 'Leertaste', exact: true })).toHaveText('␣');
  await expect(intro).toContainText('Springen und vom Vorhang abspringen');
  await expect(intro.getByRole('complementary', { name: 'Dein Hauptziel' })).toContainText(
    'Lieblingsball',
  );
  await expect(intro.locator('.start-goal-text')).not.toContainText('Sekunden');
  await page.keyboard.down('ArrowRight');
  await page.keyboard.down('ArrowUp');
  await page.keyboard.down('r');
  await page.clock.runFor(10_000);
  const waiting = await state(page);

  expect(waiting.started).toBe(false);
  expect(waiting.round.elapsedMs).toBe(0);
  expect(waiting.pixel).toEqual(before.pixel);
  expect(waiting.objects).toEqual(before.objects);
  expect(waiting.vases).toEqual(before.vases);
  expect(waiting.chaos).toEqual(before.chaos);
  expect(waiting.generation).toBe(before.generation);

  for (const key of ['ArrowRight', 'ArrowUp', 'r']) await page.keyboard.up(key);
  await test
    .info()
    .attach('startbildschirm', { body: await page.screenshot(), contentType: 'image/png' });
});

test('Leertaste startet einmal ohne Sprung; R startet danach direkt eine frische Runde', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Zusammenhängendes Start-/Neustartszenario mit echten Tasten und vollständiger Zustandsprüfung.
}) => {
  await loadIntro(page);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.keyboard.down('Space');
  await page.clock.runFor(500);
  expect((await state(page)).started).toBe(false);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page.keyboard.down('Space');
  await page.clock.runFor(100);
  expect((await state(page)).started).toBe(false);
  await page.keyboard.up('Space');
  await page.keyboard.down('Space');
  await until(page, (s) => s.started);
  const generation = (await state(page)).generation;

  await page.clock.runFor(1500);
  expect((await state(page)).generation).toBe(generation);
  expect((await state(page)).round.elapsedMs).toBeGreaterThan(0);
  expect((await state(page)).pixel.bottom).toBeCloseTo(468, 0);
  expect((await state(page)).intro.visible).toBe(false);
  await page.keyboard.up('Space');
  await page.keyboard.down('Space');
  await until(page, (s) => !s.pixel.grounded);
  await page.keyboard.up('Space');
  await reset(page);
  expect((await state(page)).started).toBe(true);
  expect((await state(page)).intro.visible).toBe(false);
  expect((await state(page)).round.elapsedMs).toBeLessThan(500);
  await page.reload();
  await until(page, (s) => s.intro.visible);
  expect((await state(page)).started).toBe(false);
});

test('Schmale Einführung bleibt lesbar und hat einen sichtbaren Start-Hinweis', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Zusammenhängendes Start-/Neustartszenario mit echten Tasten und vollständiger Zustandsprüfung.
}) => {
  await page.setViewportSize({ width: 480, height: 720 });
  await loadIntro(page);
  const intro = page.locator('.start-screen');
  const prompt = page.locator('.start-prompt');
  const box = await intro.boundingBox();
  const hint = await prompt.boundingBox();

  expect(box).not.toBeNull();
  expect(hint).not.toBeNull();

  if (!box || !hint) throw new Error('Einführung fehlt');
  expect(hint.y + hint.height).toBeLessThanOrEqual(box.y + box.height);
  expect(
    await intro.evaluate((element) => parseFloat(getComputedStyle(element).fontSize)),
  ).toBeGreaterThanOrEqual(14);
  expect(await intro.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.locator('.start-copy').evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect(intro).toContainText('Lieblingsball');
  await test
    .info()
    .attach('startbildschirm-schmal', { body: await page.screenshot(), contentType: 'image/png' });
});
