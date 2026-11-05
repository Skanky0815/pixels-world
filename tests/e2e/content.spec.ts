import { test, expect, state, start, until, holdUntil, reset } from './support';

test('Content-Variante verwendet geänderte Werte und zwei unabhängige Sofainstanzen', async ({
  page,
}) => {
  await start(page, '/?room=cozy-remix');
  expect((await state(page)).room.id).toBe('cozy-remix');
  const couches = (await state(page)).objects.filter((object) => object.kind === 'couch');

  expect(couches.map((object) => [object.id, object.variant])).toEqual([
    ['couch', 'worn-couch'],
    ['reading-couch', 'worn-couch'],
  ]);
  await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= 225);
  await until(page, (s) => s.couch.damage === 1);
  const scratched = await state(page);

  expect(scratched.chaos.score).toBe(1);
  expect(scratched.objects.find((object) => object.id === 'reading-couch')?.damage).toBe(0);
  await reset(page);
  expect((await state(page)).room.id).toBe('cozy-remix');
  expect((await state(page)).objects.every((object) => object.damage === 0)).toBe(true);
  expect(
    await page.evaluate(
      () =>
        Object.isFrozen(window.__pixelTest?.objects) &&
        window.__pixelTest?.objects.every(Object.isFrozen),
    ),
  ).toBe(true);
});
