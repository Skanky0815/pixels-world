import { test, expect, state, holdUntil, until, reset, couch } from './support';
import { startDifficulty } from './difficulty-support';

test('Schwer: zusätzliches fragiles Regal stürzt nach drei Landungen ein und Reset stellt es wieder her', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Reale Landungen, Einsturz und Neustart prüfen gemeinsam die Stabilität aus dem gewählten Grad.
}) => {
  await startDifficulty(page, 'hard', '/?room-seed=hard-shelves');
  await couch(page);
  await holdUntil(page, ['ArrowLeft'], (s) => s.pixel.x <= 195);
  await holdUntil(page, ['Space', 'ArrowLeft'], (s) => s.pixel.x <= 30);
  await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 330) < 2);
  const shelf = () => state(page).then((s) => s.shelves.find((p) => p.id === 'difficulty-shelf-1'));

  expect(await shelf()).toMatchObject({ stability: 'fragile', landings: 1, state: 'wobbly' });
  expect((await state(page)).vases.find((v) => v.id === 'difficulty-vase-1')?.state).toBe(
    'resting',
  );

  for (let landing = 2; landing <= 3; landing++) {
    await page.keyboard.down('Space');
    await until(page, (s) => !s.pixel.grounded);
    await page.keyboard.up('Space');
    await until(
      page,
      (s) => s.shelves.find((p) => p.id === 'difficulty-shelf-1')?.landings === landing,
    );
  }

  expect(await shelf()).toMatchObject({ state: 'collapsed', events: 2, enabled: false });
  await until(page, (s) => s.vases.find((v) => v.id === 'difficulty-vase-1')?.state === 'broken');
  expect((await state(page)).shelves.find((s) => s.id === 'upper-shelf')).toMatchObject({
    stability: 'stable',
    enabled: true,
  });
  await reset(page);
  expect(await shelf()).toMatchObject({
    stability: 'fragile',
    state: 'intact',
    landings: 0,
    enabled: true,
  });
});
