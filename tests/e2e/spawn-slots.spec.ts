import { test, expect, state, holdUntil, until, reset, couch, waitForGame } from './support';
import { startDifficulty } from './difficulty-support';

for (const room of ['living-room', 'cozy-remix']) {
  for (const difficulty of ['easy', 'normal', 'hard'] as const) {
    // eslint-disable-next-line max-lines-per-function -- Zusammengehörige Validierung, Platzierung oder Testschritte bleiben als atomarer Ablauf lesbar.
    test(`Spawn-Slots: ${room}, ${difficulty}, Seed und Neustart`, async ({ page }) => {
      await startDifficulty(page, difficulty, `/?room=${room}&room-seed=slots-172`);
      const before = await state(page);
      const slots = before.objects.filter((o) => o.id.startsWith('lower-shelf:'));

      expect(slots).toHaveLength({ easy: 1, normal: 2, hard: 3 }[difficulty]);
      expect(before.vases.every((v) => v.state === 'resting')).toBe(true);
      await reset(page);
      expect((await state(page)).objects).toEqual(before.objects);
      expect((await state(page)).vases).toEqual(before.vases);
      expect((await state(page)).goal).toEqual(before.goal);
      await page.reload();
      await waitForGame(page);
      expect((await state(page)).objects).toEqual(before.objects);
    });
  }
}

test('Belegtes Slotregal stürzt ein; Vasen fallen selbständig, brechen einmal und werden nicht nachgefüllt', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Zusammengehörige Validierung, Platzierung oder Testschritte bleiben als atomarer Ablauf lesbar.
}, testInfo) => {
  await startDifficulty(page, 'hard', '/?room-seed=collapse-172');
  await couch(page);
  await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= 410);
  await holdUntil(page, ['Space', 'ArrowRight'], (s) => s.pixel.x >= 500);
  await holdUntil(page, ['ArrowLeft'], (s) => s.pixel.velocityX <= 0);
  await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 304) < 2);
  const before = await state(page);
  const slots = before.vases.filter((v) => v.id.startsWith('lower-shelf:'));

  expect(slots).toHaveLength(3);
  expect(slots.every((v) => v.state === 'resting')).toBe(true);

  for (let i = 0; i < 2; i++) {
    await page.keyboard.down('Space');
    await until(page, (s) => !s.pixel.grounded);
    await page.keyboard.up('Space');
    await until(page, (s) => s.shelves[0].landings === i + 2);
  }

  await until(page, (s) =>
    s.vases.filter((v) => v.id.startsWith('lower-shelf:')).every((v) => v.state === 'broken'),
  );
  const broken = await state(page);

  expect(broken.shelves[0]).toMatchObject({ state: 'collapsed', enabled: false });
  expect(broken.chaos.score).toBe(12 + slots.reduce((sum, v) => sum + v.points, 0));
  await page.clock.runFor(1500);
  expect((await state(page)).chaos.score).toBe(broken.chaos.score);
  expect((await state(page)).vases.map((v) => [v.id, v.state])).toEqual(
    broken.vases.map((v) => [v.id, v.state]),
  );
  await testInfo.attach('belegtes-regal-eingestürzt', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
  await reset(page);
  expect((await state(page)).vases).toEqual(before.vases);
  expect((await state(page)).shelves[0]).toMatchObject({ state: 'intact', landings: 0 });
});
