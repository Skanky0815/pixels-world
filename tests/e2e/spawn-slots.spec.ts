import { test, expect, state, until, reset, lowerShelf, waitForGame } from './support';
import { startDifficulty } from './difficulty-support';
import { BOOK_TOPPLE } from '../../src/game/interactions/book-toppling';

for (const room of ['living-room', 'cozy-remix']) {
  for (const difficulty of ['easy', 'normal', 'hard'] as const) {
    // eslint-disable-next-line max-lines-per-function -- Zusammengehörige Validierung, Platzierung oder Testschritte bleiben als atomarer Ablauf lesbar.
    test(`Spawn-Slots: ${room}, ${difficulty}, Seed und Neustart`, async ({ page }) => {
      await startDifficulty(page, difficulty, `/?room=${room}&room-seed=slots-172`);
      const before = await state(page);

      expect(before.wallPlacements).toHaveLength(difficulty === 'hard' ? 2 : 1);

      for (const wall of before.wallPlacements.filter((p) => p.kind === 'shelf'))
        expect(before.shelves.find((s) => s.id === wall.id)).toMatchObject({
          enabled: true,
          state: 'intact',
        });
      const slots = before.objects.filter((o) => o.id.startsWith('lower-shelf:'));

      expect(slots).toHaveLength({ easy: 1, normal: 2, hard: 3 }[difficulty]);
      expect(before.objects.filter((o) => o.id.startsWith('middle-shelf:'))).toHaveLength(
        difficulty === 'easy' ? 0 : 1,
      );

      if (difficulty !== 'easy')
        expect(before.vases.find((v) => v.id === 'middle-shelf:middle-slot')?.x).toBe(646);
      expect(before.vases.every((v) => v.state === 'resting')).toBe(true);
      await reset(page);
      expect((await state(page)).wallPlacements).toEqual(before.wallPlacements);
      expect((await state(page)).objects).toEqual(before.objects);
      expect((await state(page)).vases).toEqual(before.vases);
      expect((await state(page)).goal).toEqual(before.goal);
      await page.reload();
      await waitForGame(page);
      expect((await state(page)).wallPlacements).toEqual(before.wallPlacements);
      expect((await state(page)).objects).toEqual(before.objects);
    });
  }
}

test('Belegtes Slotregal stürzt ein; Vasen fallen selbständig, brechen einmal und werden nicht nachgefüllt', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Zusammengehörige Validierung, Platzierung oder Testschritte bleiben als atomarer Ablauf lesbar.
}, testInfo) => {
  await startDifficulty(page, 'hard', '/?room-seed=collapse-172');
  await lowerShelf(page);
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
  await until(page, (s) =>
    s.books.filter((b) => b.supportY === 304).every((b) => b.state === 'fallen' && !b.dropping),
  );
  const broken = await state(page);

  expect(broken.shelves[0]).toMatchObject({ state: 'collapsed', enabled: false });
  expect(broken.chaos.score).toBe(
    12 +
      before.books.filter((b) => b.supportY === 304 && b.damage === 0).length * BOOK_TOPPLE.points +
      slots.reduce((sum, v) => sum + v.points, 0),
  );
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
