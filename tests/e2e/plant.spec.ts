import { test, expect, state, start, until, holdUntil, reset, besidePlant } from './support';

test('Katzengras: Wartezeit, Knabberanimation und Wackeln; Weglaufen verhindert Kippen', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Arrange, Aktionen und Assertions dieses Szenarios bleiben gemeinsam lesbar; keine künstliche Aufteilung des Testablaufs.
}, testInfo) => {
  await start(page);
  await besidePlant(page);
  await page.clock.runFor(1500);
  expect((await state(page)).plant.damage).toBe(0);
  await until(page, (s) => s.plant.state === 'nibbling');
  const first = await state(page);

  expect(first.pixel.animation).toBe('nibble');
  expect(first.pixel).toMatchObject({
    displayWidth: 80,
    displayHeight: 80,
    bodyWidth: 52,
    bodyHeight: 52,
  });
  expect(first.hud.statusText).toBe('PIXEL · KATZENGRAS KNABBERN');
  expect(first.plant.lastDamage).toEqual({
    id: '["plant","nibble",1]',
    objectId: 'plant',
    kind: 'nibble',
    stage: 1,
    value: 2,
  });
  expect(first.chaos).toEqual({ score: 2, damagedObjects: 1, anger: 'calm' });
  await until(page, (s) => s.pixel.animationFrame !== first.pixel.animationFrame);
  await until(page, (s) => s.plant.state === 'wobbling' && Math.abs(s.plant.angle) > 4);
  expect((await state(page)).hud.statusText).toBe('PIXEL · VORSICHT, DER TOPF WACKELT!');
  const screenshot = testInfo.outputPath('plant-warning.png');

  await page.screenshot({ path: screenshot, fullPage: true });
  await testInfo.attach('Knabbern mit sichtbarer Wackelwarnung', {
    path: screenshot,
    contentType: 'image/png',
  });
  await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= 120);
  expect((await state(page)).plant.state).toBe('idle');
  expect((await state(page)).plant.angle).toBe(0);
  expect((await state(page)).pixel.animation).not.toMatch(/^(scratch|nibble)$/);
  await page.clock.runFor(1500);
  expect((await state(page)).plant.damage).toBe(1);
  expect((await state(page)).chaos.score).toBe(2);
});

test('Katzengras: Topf kippt nach Warnung, zählt einmal und R stellt alles wieder her', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Arrange, Aktionen und Assertions dieses Szenarios bleiben gemeinsam lesbar; keine künstliche Aufteilung des Testablaufs.
}, testInfo) => {
  await start(page);
  await besidePlant(page);
  await until(page, (s) => s.plant.state === 'wobbling');
  await page.clock.runFor(600);
  expect((await state(page)).plant.state).toBe('wobbling');
  expect((await state(page)).chaos.score).toBe(2);
  await until(page, (s) => s.plant.state === 'tipped');
  const tipped = await state(page);

  expect(tipped.plant).toMatchObject({
    damage: 2,
    events: 2,
    angle: -80,
    lastDamage: { id: '["plant","tip",2]', objectId: 'plant', kind: 'tip', stage: 2, value: 10 },
  });
  expect(tipped.chaos).toEqual({ score: 12, damagedObjects: 1, anger: 'calm' });
  expect(tipped.pixel.animation).toBe('idle');
  const screenshot = testInfo.outputPath('plant-tipped.png');

  await page.screenshot({ path: screenshot, fullPage: true });
  await testInfo.attach('Gekippter Katzengrastopf und Erde', {
    path: screenshot,
    contentType: 'image/png',
  });
  await page.clock.runFor(1500);
  expect((await state(page)).plant.events).toBe(2);
  expect((await state(page)).chaos.score).toBe(12);
  await reset(page);
  expect((await state(page)).plant).toEqual({
    state: 'idle',
    damage: 0,
    progress: 0,
    angle: 0,
    events: 0,
    lastDamage: null,
  });
  expect((await state(page)).chaos.score).toBe(0);
  expect(await page.evaluate(() => Object.isFrozen(window.__pixelTest?.plant))).toBe(true);
  await besidePlant(page);
  await until(page, (s) => s.plant.damage === 1);
  expect((await state(page)).chaos.score).toBe(2);
});

test('Katzengras: Springen bricht ab; erneutes Knabbern dupliziert keinen Schaden', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Arrange, Aktionen und Assertions dieses Szenarios bleiben gemeinsam lesbar; keine künstliche Aufteilung des Testablaufs.
}) => {
  await start(page);
  await besidePlant(page);
  await until(page, (s) => s.plant.state === 'nibbling');
  await holdUntil(page, ['Space'], (s) => !s.pixel.grounded);
  expect((await state(page)).plant.state).toBe('idle');
  expect((await state(page)).pixel.animation).not.toMatch(/^(scratch|nibble)$/);
  await until(page, (s) => s.pixel.grounded && s.plant.state === 'waiting');
  await page.clock.runFor(1500);
  expect((await state(page)).plant.state).toBe('waiting');
  await until(page, (s) => s.plant.state === 'nibbling');
  expect((await state(page)).plant.events).toBe(1);
  expect((await state(page)).chaos.score).toBe(2);
  await reset(page);
  await page.clock.runFor(2500);
  expect((await state(page)).plant.state).toBe('idle');
  expect((await state(page)).plant.events).toBe(0);
});
