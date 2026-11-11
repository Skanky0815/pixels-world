import { recordAudio, expectActiveAudio } from './audio-support';
import { test, expect, state, start, until, holdUntil, curtain, reset } from './support';

test('Vorhang: progressive Risse zählen Punkte; Weiterklettern und Absprung stoppen Schaden', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Arrange, Aktionen und Assertions dieses Szenarios bleiben gemeinsam lesbar; keine künstliche Aufteilung des Testablaufs.
}, testInfo) => {
  await recordAudio(page);
  await start(page);
  await curtain(page);
  await holdUntil(page, ['ArrowUp'], (s) => s.pixel.y < 230);
  await expectActiveAudio(page, 0.28, true);
  await until(page, (s) => s.curtain.state === 'sliding');
  const beginning = await state(page);

  await page.clock.runFor(300);
  const slipping = await state(page);

  expect(slipping.pixel.y).toBeGreaterThan(beginning.pixel.y + 6);
  expect(slipping.pixel.y).toBeLessThan(beginning.pixel.y + 20);
  expect(slipping.curtain.damage).toBe(0);
  await until(page, (s) => s.curtain.damage === 1);
  expect((await state(page)).curtain.marks).toHaveLength(1);
  expect((await state(page)).curtain.texture).toBe('curtain-rust');
  expect((await state(page)).curtain.area).toMatchObject({ width: 112, height: 356 });
  expect((await state(page)).chaos).toEqual({ score: 4, damagedObjects: 1, anger: 'calm' });
  expect((await state(page)).curtain.lastDamage).toEqual({
    id: '["curtain","tear",1]',
    objectId: 'curtain',
    kind: 'tear',
    stage: 1,
    value: 4,
  });
  const screenshot = testInfo.outputPath('curtain-tearing.png');

  await page.screenshot({ path: screenshot, fullPage: true });
  await testInfo.attach('Rutschender Pixel und Vorhangriss', {
    path: screenshot,
    contentType: 'image/png',
  });
  await page.keyboard.down('ArrowUp');

  try {
    await until(page, (s) => s.curtain.state === 'climbing' && s.pixel.velocityY < 0);
    await page.clock.runFor(300);
    await expectActiveAudio(page, 0.28, true);
    await expectActiveAudio(page, 0.4, false);
    expect((await state(page)).curtain.damage).toBe(1);
  } finally {
    await page.keyboard.up('ArrowUp');
  }

  await until(page, (s) => s.curtain.damage === 2);
  expect((await state(page)).chaos.score).toBe(8);
  await holdUntil(
    page,
    ['Space', 'ArrowLeft'],
    (s) => s.curtain.state === 'detached' && s.pixel.gravity,
  );
  await page.clock.runFor(300);
  await expectActiveAudio(page, 0.28, false);
  await expectActiveAudio(page, 0.4, false);
  expect((await state(page)).curtain.damage).toBe(2);
  expect((await state(page)).chaos.score).toBe(8);
});

test('Vorhang: Boden löst den Griff; erneutes Klettern und Reset funktionieren', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Arrange, Aktionen und Assertions dieses Szenarios bleiben gemeinsam lesbar; keine künstliche Aufteilung des Testablaufs.
}) => {
  await start(page);
  await curtain(page);
  await until(page, (s) => s.curtain.state === 'sliding');
  await holdUntil(page, ['ArrowDown'], (s) => s.pixel.grounded && s.curtain.state === 'detached');
  expect((await state(page)).pixel.bottom).toBeCloseTo(468, 0);
  const grounded = await state(page);

  await page.clock.runFor(1200);
  expect((await state(page)).curtain.events).toBe(grounded.curtain.events);
  expect((await state(page)).curtain.state).toBe('detached');
  await holdUntil(
    page,
    ['ArrowUp'],
    (s) => s.curtain.state === 'climbing' && s.pixel.climbing && s.pixel.y < 350,
  );
  expect((await state(page)).pixel.gravity).toBe(false);
  await reset(page);
  expect((await state(page)).curtain).toMatchObject({
    marks: [],
    state: 'detached',
    damage: 0,
    events: 0,
    lastDamage: null,
  });
  expect((await state(page)).chaos.score).toBe(0);
});
