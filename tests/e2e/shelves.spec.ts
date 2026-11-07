import { advanceRoundTo, useIdleFrames } from './round-clock';
import { test, expect, start, state, firstVase, holdUntil, until, reset } from './support';
import { openPause } from './pause-support';

test('Regal: Landungen belasten, Pause friert ein, Einsturz entfernt die Plattform und Reset repariert', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Reale Sprünge prüfen Warnung, nur einmaligen Schaden, Pause, Einsturz, freien Fall und vollständigen Neustart.
}, testInfo) => {
  await start(page, '/?room-seed=shelves-172');
  await firstVase(page);
  await until(page, (s) => s.vases[0].state === 'broken');
  await holdUntil(page, ['ArrowLeft'], (s) => s.pixel.x <= 560);
  const shelf = () => state(page).then((s) => s.shelves.find((p) => p.id === 'lower-shelf'));

  expect(await shelf()).toMatchObject({
    stability: 'fragile',
    landings: 1,
    state: 'wobbly',
    enabled: true,
  });
  await page.clock.runFor(800);
  expect((await shelf())?.angle).toBe(0);
  expect((await shelf())?.landings).toBe(1);
  await page.keyboard.down('Space');
  await until(page, (s) => !s.pixel.grounded);
  await page.keyboard.up('Space');
  await until(page, (s) => s.shelves[0].landings === 2);
  expect(await shelf()).toMatchObject({ state: 'damaged', events: 1, enabled: true });
  await until(page, (s) => Math.abs(s.shelves[0].angle) > 0.1);
  const beforeCollapse = await state(page);
  const score = beforeCollapse.chaos.score;
  const remainingVasePoints = beforeCollapse.vases
    .filter((v) => v.id.startsWith('lower-shelf:') && v.state !== 'broken')
    .reduce((sum, v) => sum + v.points, 0);

  await openPause(page);
  const paused = await shelf();

  await page.clock.runFor(1000);
  expect(await shelf()).toEqual(paused);
  await page.locator('[data-pause-resume]').click();
  await page.locator('#game').focus();
  await page.clock.runFor(800);
  expect((await shelf())?.angle).toBe(0);
  await page.keyboard.down('Space');
  await until(page, (s) => !s.pixel.grounded);
  await page.keyboard.up('Space');
  await until(page, (s) => s.shelves[0].state === 'collapsed');
  expect(await shelf()).toMatchObject({
    landings: 3,
    events: 2,
    enabled: false,
    boardHeight: 16,
    debrisBoardHeight: 16,
  });
  await until(page, (s) => s.pixel.grounded && s.pixel.bottom === 468);
  await until(page, (s) =>
    s.vases.filter((v) => v.id.startsWith('lower-shelf:')).every((v) => v.state === 'broken'),
  );
  expect((await state(page)).chaos.score).toBe(score + 10 + remainingVasePoints);
  await testInfo.attach('regal-eingestürzt', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
  await page.clock.runFor(500);
  expect((await shelf())?.events).toBe(2);
  await useIdleFrames(page);
  await advanceRoundTo(page, (await state(page)).round.returnAtMs);
  await until(page, (s) => s.pixelReturn.stage === 'seated', 500);
  expect((await state(page)).shelves[0].enabled).toBe(false);
  await reset(page);
  expect(await shelf()).toMatchObject({ landings: 0, state: 'intact', events: 0, enabled: true });
  expect((await state(page)).chaos.score).toBe(0);
});
