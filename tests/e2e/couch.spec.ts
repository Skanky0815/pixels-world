import { recordAudio, expectActiveAudio } from './audio-support';
import { test, expect, state, start, until, holdUntil, reset, besideCouch } from './support';

test('Sofa: verzögertes Kratzen, Animation, progressive Ereignisse und Bewegungsabbruch', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Arrange, Aktionen und Assertions dieses Szenarios bleiben gemeinsam lesbar; keine künstliche Aufteilung des Testablaufs.
}, testInfo) => {
  await recordAudio(page);
  await start(page);
  await besideCouch(page);
  await page.clock.runFor(1500);
  expect((await state(page)).couch.damage).toBe(0);
  await until(page, (s) => s.couch.state === 'scratching' && s.couch.damage === 1);
  await expectActiveAudio(page, 0.72, true);
  const first = await state(page);

  expect(first.pixel.animation).toBe('scratch');
  expect(first.pixel).toMatchObject({
    displayWidth: 80,
    displayHeight: 80,
    bodyWidth: 52,
    bodyHeight: 52,
  });
  expect(first.couch.events).toBe(1);
  expect(first.couch.marks).toHaveLength(1);
  expect(first.chaos.score).toBe(3);
  expect(first.chaos.damagedObjects).toBe(1);
  expect(first.couch.lastDamage).toEqual({
    id: '["couch","scratch",1]',
    objectId: 'couch',
    kind: 'scratch',
    stage: 1,
    value: 3,
  });
  await until(page, (s) => s.pixel.animationFrame !== first.pixel.animationFrame);
  expect((await state(page)).couch.damage).toBe(1);
  await until(page, (s) => s.couch.damage === 2);
  const screenshot = testInfo.outputPath('couch-scratching.png');

  await page.screenshot({ path: screenshot, fullPage: true });
  await testInfo.attach('Automatisches Sofakratzen', {
    path: screenshot,
    contentType: 'image/png',
  });
  await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= 490);
  expect((await state(page)).couch.state).toBe('idle');
  await expectActiveAudio(page, 0.72, false);
  expect((await state(page)).pixel.animation).not.toMatch(/^(scratch|nibble)$/);
  const stopped = (await state(page)).couch.damage;

  await page.clock.runFor(1500);
  expect((await state(page)).couch.damage).toBe(stopped);
  expect((await state(page)).chaos.score).toBe(stopped * 3);
});

test('Sofa: Springen unterbricht, erneutes Warten und Reset entfernen den Schaden', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Arrange, Aktionen und Assertions dieses Szenarios bleiben gemeinsam lesbar; keine künstliche Aufteilung des Testablaufs.
}) => {
  await start(page);
  await besideCouch(page);
  await until(page, (s) => s.couch.damage === 1);
  await holdUntil(page, ['Space'], (s) => !s.pixel.grounded);
  expect((await state(page)).couch.state).toBe('idle');
  expect((await state(page)).pixel.animation).not.toMatch(/^(scratch|nibble)$/);
  await until(page, (s) => s.pixel.grounded && s.couch.state === 'waiting');
  await page.clock.runFor(1500);
  expect((await state(page)).couch.damage).toBe(1);
  await until(page, (s) => s.couch.damage === 2);
  await reset(page);
  expect((await state(page)).couch).toMatchObject({
    marks: [],
    texture: 'couch-cozy',
    bodyWidth: 254,
    bodyHeight: 28,
    state: 'idle',
    damage: 0,
    events: 0,
    lastDamage: null,
  });
  expect((await state(page)).chaos.score).toBe(0);
  expect((await state(page)).pixel.animation).not.toMatch(/^(scratch|nibble)$/);
  await besideCouch(page);
  await page.clock.runFor(1500);
  expect((await state(page)).couch.damage).toBe(0);
  await until(page, (s) => s.couch.damage === 1);
});

test('Sofa: gedeckelter Schaden, keine Punkteflut und kein Kratzen außerhalb der Nähe', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Arrange, Aktionen und Assertions dieses Szenarios bleiben gemeinsam lesbar; keine künstliche Aufteilung des Testablaufs.
}) => {
  await start(page);
  await page.clock.runFor(4000);
  expect((await state(page)).couch.damage).toBe(0);
  await besideCouch(page);
  await page.clock.runFor(9000);
  const damaged = await state(page);

  expect(damaged.couch.damage).toBe(6);
  expect(damaged.couch.marks).toHaveLength(6);
  expect(damaged.couch.events).toBe(6);
  expect(damaged.chaos.score).toBe(18);
  expect(damaged.chaos.damagedObjects).toBe(1);
  await page.clock.runFor(2000);
  expect((await state(page)).couch.events).toBe(6);
  expect((await state(page)).chaos.score).toBe(18);
});
