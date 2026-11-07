import {
  test,
  expect,
  state,
  start,
  until,
  holdUntil,
  couch,
  curtain,
  reset,
  besideCouch,
} from './support';

test('R setzt Pixel von einer Plattform zurück', { tag: '@smoke' }, async ({ page }) => {
  await start(page);
  await couch(page);
  await reset(page);
});

test('R beendet Klettern und setzt Bewegung zurück', async ({ page }) => {
  await start(page);
  await curtain(page);
  await reset(page);
});

test('Eingaben: gehaltenes Springen/Reset erzeugt nur eine Flanke; Neustart räumt Listener auf', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Arrange, Aktionen und Assertions dieses Szenarios bleiben gemeinsam lesbar; keine künstliche Aufteilung des Testablaufs.
}) => {
  await start(page);
  const initial = await state(page);

  await page.keyboard.down('Space');
  await until(page, (s) => !s.pixel.grounded);
  await until(page, (s) => s.pixel.grounded);
  await page.clock.runFor(500);
  expect((await state(page)).pixel.grounded).toBe(true);
  await page.keyboard.up('Space');
  await besideCouch(page);
  await until(page, (s) => s.couch.damage > 0);
  await page.keyboard.down('r');
  await until(page, (s) => s.generation > initial.generation);
  await page.clock.runFor(250);
  const restarted = await state(page);

  expect(restarted.generation).toBe(initial.generation + 1);
  expect(restarted.blurListeners).toBe(initial.blurListeners);
  expect(restarted.chaos.score).toBe(0);
  expect(restarted.couch.damage).toBe(0);
  expect(restarted.curtain.damage).toBe(0);
  expect(restarted.plant.damage).toBe(0);
  expect(restarted.vases.every((vase) => vase.state === 'resting')).toBe(true);
  expect(restarted.hud).toEqual({ scoreText: 'CHAOS: 0 · Normal' });
  await page.keyboard.up('r');

  for (let round = 0; round < 2; round++) {
    await reset(page);
    expect((await state(page)).blurListeners).toBe(initial.blurListeners);
  }
});

test('Focus-Verlust löst gehaltene Eingaben; erneutes Drücken funktioniert nach Rückkehr', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Arrange, Aktionen und Assertions dieses Szenarios bleiben gemeinsam lesbar; keine künstliche Aufteilung des Testablaufs.
}) => {
  await start(page);
  await page.keyboard.down('ArrowRight');
  await until(page, (s) => s.pixel.x >= 150);
  // Use the normal DOM focus path, never an engine setter/test mutation hook.
  await page.evaluate(() => {
    window.dispatchEvent(new Event('blur'));
    window.dispatchEvent(new Event('focus'));
  });
  await page.clock.runFor(160);
  const stopped = (await state(page)).pixel.x;

  await page.clock.runFor(250);
  expect((await state(page)).pixel.x).toBeCloseTo(stopped, 0);
  expect((await state(page)).pixel.velocityX).toBe(0);
  await page.keyboard.up('ArrowRight');
  await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x > stopped + 25);
});
