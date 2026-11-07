import {
  test,
  expect,
  state,
  start,
  until,
  holdUntil,
  framesPass,
  reset,
  firstVase,
} from './support';

test('Vase bleibt stehen; Anschubsen und Fallen geben erst beim Bruch Punkte', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Arrange, Aktionen und Assertions dieses Szenarios bleiben gemeinsam lesbar; keine künstliche Aufteilung des Testablaufs.
}, testInfo) => {
  await start(page);
  await framesPass(page, 30);
  const initial = await state(page);

  expect(initial.chaos).toEqual({ score: 0, damagedObjects: 0, anger: 'calm' });
  expect(initial.vases.every((vase) => vase.state === 'resting')).toBe(true);
  expect(initial.vases[0].x).toBeCloseTo(620, 0);
  await firstVase(page);
  const pushed = await state(page);

  expect(pushed.vases[0].state).not.toBe('broken');
  expect(pushed.chaos.score).toBe(0);
  await until(page, (s) => s.vases[0].state === 'falling');
  expect((await state(page)).chaos.score).toBe(0);
  await until(page, (s) => s.vases[0].state === 'broken');
  expect((await state(page)).chaos).toEqual({ score: 25, damagedObjects: 1, anger: 'annoyed' });
  const screenshot = testInfo.outputPath('chaos.png');

  await page.screenshot({ path: screenshot, fullPage: true });
  await testInfo.attach('Chaos nach Vasenbruch', { path: screenshot, contentType: 'image/png' });
  await framesPass(page, 45);
  expect((await state(page)).chaos.score).toBe(25);
  await reset(page);
  const restarted = await state(page);

  expect(restarted.chaos).toEqual({ score: 0, damagedObjects: 0, anger: 'calm' });
  expect(restarted.vases.every((vase) => vase.state === 'resting')).toBe(true);
  expect(restarted.vases[0].x).toBeCloseTo(620, 0);
  // The same object may score again in a new run, but not twice in one run.
  await firstVase(page);
  await until(page, (s) => s.vases[0].state === 'broken');
  expect((await state(page)).chaos.score).toBe(25);
});

test('Alle drei Vasen sind erreichbar und summieren Schaden über die Ärgerstufen', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Arrange, Aktionen und Assertions dieses Szenarios bleiben gemeinsam lesbar; keine künstliche Aufteilung des Testablaufs.
}) => {
  await start(page);
  await firstVase(page);
  await until(page, (s) => s.vases[0].state === 'broken');
  await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= 800);
  await holdUntil(page, ['ArrowUp'], (s) => s.pixel.bottom <= 195);
  await holdUntil(page, ['ArrowLeft'], (s) => s.vases[1].state !== 'resting');
  expect((await state(page)).chaos.score).toBe(25 + (await state(page)).curtain.damage * 4);
  await until(page, (s) => s.vases[1].state === 'broken');
  const second = await state(page);

  expect(second.chaos).toEqual({
    score: 60 + second.curtain.damage * 4,
    damagedObjects: 2 + Number(second.curtain.damage > 0),
    anger: 'angry',
  });
  await framesPass(page, 30);
  expect((await state(page)).chaos.score).toBe(60 + (await state(page)).curtain.damage * 4);
  await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= 800);
  await holdUntil(page, ['ArrowUp'], (s) => s.pixel.bottom <= 116);
  // With the larger body, first land beside the vase instead of stepping over it.
  await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= 850);
  await holdUntil(
    page,
    ['ArrowDown'],
    (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 154) < 2,
  );
  await holdUntil(page, ['ArrowRight'], (s) => s.vases[2].state !== 'resting');
  await until(page, (s) => s.vases[2].state === 'broken');
  const complete = await state(page);

  expect(complete.hud.scoreText).toBe(`CHAOS: ${complete.chaos.score} · Normal`);
  expect(complete.chaos).toEqual({
    score: 100 + complete.curtain.damage * 4,
    damagedObjects: 3 + Number(complete.curtain.damage > 0),
    anger: 'angry',
  });
});
