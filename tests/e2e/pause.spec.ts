import { test, expect, start, loadIntro, state, until } from './support';
import { openPause } from './pause-support';
import { advanceRoundTo, seedRoundRandom, useIdleFrames } from './round-clock';

const menu = '.pause-menu';

test('Pause hält Welt und Timer an; Fokuswechsel und Menütasten setzen nicht fort', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Gehaltene Eingabe, Pause, Fokuswechsel und frisches Fortsetzen werden als zusammenhängender Nutzerablauf geprüft.
}) => {
  await start(page);
  await page.keyboard.down('ArrowRight');
  await until(page, (s) => s.pixel.x > 145);
  await page.keyboard.press('Escape');
  await page.keyboard.up('ArrowRight');
  await expect(page.locator(menu)).toBeVisible();
  const paused = await state(page);

  expect(paused.active).toBe(false);
  expect(paused.audio.paused).toBe(true);
  await page.keyboard.down('r');
  await page.clock.runFor(4000);
  await page.keyboard.up('r');
  await page.evaluate(() => {
    window.dispatchEvent(new Event('blur'));
    window.dispatchEvent(new Event('focus'));
  });
  await page.clock.runFor(100);
  const still = await state(page);

  expect(still.round).toEqual(paused.round);
  expect(still.pixel).toEqual(paused.pixel);
  expect(still.generation).toBe(paused.generation);
  expect(still.active).toBe(false);
  await page.keyboard.down('r');
  await page.keyboard.press('Escape');
  await page.keyboard.up('r');
  await expect(page.locator(menu)).not.toBeVisible();
  await page.clock.runFor(100);
  const resumed = await state(page);

  expect(resumed.active).toBe(true);
  expect(resumed.generation).toBe(paused.generation);
  expect(resumed.audio.paused).toBe(false);
  expect(resumed.round.elapsedMs - paused.round.elapsedMs).toBeLessThan(200);
  await page.keyboard.down('ArrowRight');
  await until(page, (s) => s.pixel.x > paused.pixel.x + 20);
  await page.keyboard.up('ArrowRight');
});

test('Pause schützt die Versöhnungsfrist und erhält Sprachwechsel ohne Neustart', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Reale Heimkehr und erste Versöhnungseingabe liefern den zeitkritischen Zustand vor der Pause.
}) => {
  await seedRoundRandom(page);
  await start(page, '/?round-profile=fast');
  await useIdleFrames(page);
  await advanceRoundTo(page, (await state(page)).round.returnAtMs);
  await until(
    page,
    (s) => s.pixelReturn.stage === 'seated' && s.homecoming.stage === 'dialogue',
    100,
  );
  await page.keyboard.down('Space');
  await until(page, (s) => s.reconciliation.stage === 'reading', 100);
  await page.keyboard.up('Space');
  await page.keyboard.down('Space');
  await until(page, (s) => s.reconciliation.stage === 'cue', 100);
  await page.keyboard.up('Space');
  await until(page, (s) => s.reconciliation.stage === 'input', 100);
  await openPause(page);
  const paused = await state(page);

  await page.clock.runFor(10_000);
  await page.locator(menu).getByRole('button', { name: 'English', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Pause & settings' })).toBeVisible();
  expect((await state(page)).reconciliation).toEqual(paused.reconciliation);
  expect((await state(page)).generation).toBe(paused.generation);
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await until(page, (s) => s.reconciliation.remainingMs < paused.reconciliation.remainingMs, 100);
  expect((await state(page)).reconciliation.failures).toBe(0);
});

test('Lautstärke bleibt gespeichert und Neue Runde ist ausschließlich im Menü erreichbar', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Echte Regler, Reload und anschließender Reset prüfen Persistenz sowie den Lebenszyklus des Menüs.
}) => {
  await loadIntro(page);
  await expect(page.locator('main > header .language-setting')).toHaveCount(0);
  await openPause(page);
  await expect(
    page.locator(menu).getByRole('button', { name: 'Neue Runde', exact: true }),
  ).not.toBeVisible();
  const master = page.locator('[data-audio=master]');
  const effects = page.locator('[data-audio=effects]');

  await master.focus();
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowRight');
  await effects.focus();
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => (await state(page)).audio.volume).toBeCloseTo(0.0001, 6);
  await loadIntro(page);
  await openPause(page);
  await expect(master).toHaveValue('1');
  await expect(effects).toHaveValue('1');
  await page.keyboard.press('Escape');
  await page.keyboard.down('Space');
  await until(page, (s) => s.started);
  await page.keyboard.up('Space');
  await until(page, (s) => s.pixel.grounded);
  await openPause(page);
  const generation = (await state(page)).generation;

  await page.locator(menu).getByRole('button', { name: 'Neue Runde', exact: true }).click();
  await until(page, (s) => s.generation > generation && s.pixel.grounded);
  expect((await state(page)).chaos.score).toBe(0);
  expect((await state(page)).active).toBe(true);
  await expect.poll(async () => (await state(page)).audio.volume).toBeCloseTo(0.0001, 6);
  await expect(page.locator(menu)).toHaveCount(1);
  await expect(page.locator('.pause-toggle')).toHaveCount(1);
  await expect(page.locator('.touch-controls')).toHaveCount(1);
});

// eslint-disable-next-line max-lines-per-function -- Eine Gerätegruppe prüft mobile Erreichbarkeit und eine zugängliche Dialogaufnahme.
test.describe('Pause auf Touch-Geräten', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 844, height: 390 } });

  test('Menü bleibt im Handheld erreichbar und nach Rotation lesbar', async ({
    page,
    // eslint-disable-next-line max-lines-per-function -- Menüknopf, Rotation und mobile Sprachwahl bleiben Teil desselben Touch-Ablaufs.
  }, testInfo) => {
    await start(page);
    await page.getByRole('button', { name: 'Menü', exact: true }).tap();
    await expect(page.locator(menu)).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator(menu).getByRole('button', { name: 'English', exact: true }).tap();
    const bounds = await page.locator(menu).boundingBox();

    expect(bounds && bounds.x >= 0 && bounds.width <= 390 && bounds.height <= 844).toBe(true);
    await testInfo.attach('mobile-pause-menu', {
      body: await page.locator(menu).screenshot(),
      contentType: 'image/png',
    });
    await page.getByRole('button', { name: 'Resume', exact: true }).tap();
    await expect(page.locator(menu)).not.toBeVisible();
    expect((await state(page)).active).toBe(true);
  });
});
