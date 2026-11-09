import { recordAudio, expectAudio } from './audio-support';
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
  await recordAudio(page);
  await start(page, '/?room-seed=vases');
  await expectAudio(page, 0.48, 0);
  await framesPass(page, 30);
  const initial = await state(page);

  expect(initial.chaos).toEqual({ score: 0, damagedObjects: 0, anger: 'calm' });
  expect(initial.vases.every((vase) => vase.state === 'resting')).toBe(true);
  expect(initial.vases[0].x).toBeGreaterThan(560);
  expect(initial.vases[0].x).toBeLessThan(650);
  expect(initial.vases[0]).toMatchObject({
    bodyWidth: 18,
    bodyHeight: 28,
    shards: 0,
  });
  await firstVase(page);
  const pushed = await state(page);

  expect(pushed.vases[0].state).not.toBe('broken');
  expect(pushed.chaos.score).toBe(0);
  await until(page, (s) => s.vases[0].state === 'falling');
  expect((await state(page)).chaos.score).toBe(0);
  await until(page, (s) => s.vases[0].state === 'broken');
  await expectAudio(page, 0.48, 1);
  await expectChaos(page);
  expect((await state(page)).vases[0].shards).toBe(7);
  const screenshot = testInfo.outputPath('chaos.png');

  await page.screenshot({ path: screenshot, fullPage: true });
  await testInfo.attach('Chaos nach Vasenbruch', { path: screenshot, contentType: 'image/png' });
  await framesPass(page, 45);
  await expectChaos(page);
  await reset(page);
  await expectAudio(page, 0.48, 1);
  const restarted = await state(page);

  expect(restarted.chaos).toEqual({ score: 0, damagedObjects: 0, anger: 'calm' });
  expect(restarted.vases.every((vase) => vase.state === 'resting')).toBe(true);
  expect(restarted.vases.map((v) => [v.id, v.x])).toEqual(initial.vases.map((v) => [v.id, v.x]));
  expect(restarted.objects.map((o) => [o.id, o.variant])).toEqual(
    initial.objects.map((o) => [o.id, o.variant]),
  );
  expect(restarted.vases.every((v) => v.shards === 0)).toBe(true);
  // The same object may score again in a new run, but not twice in one run.
  await firstVase(page);
  await until(page, (s) => s.vases[0].state === 'broken');
  await expectChaos(page);
});

test('Slotvasen und feste Vasen bleiben erreichbar und werten jeden Bruch einmal', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Der durchgespielte Weg verbindet die zufällige untere Belegung mit den festen oberen Vasen.
}) => {
  await start(page, '/?room-seed=vases');
  await firstVase(page);
  await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= 690);
  await until(page, (s) =>
    s.vases.filter((v) => v.id.startsWith('lower-shelf:')).every((v) => v.state === 'broken'),
  );
  await expectChaos(page);
  await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= 800);
  await holdUntil(page, ['ArrowUp'], (s) => s.pixel.bottom <= 116);
  await holdUntil(page, ['Space', 'ArrowLeft'], (s) => s.pixel.x <= 630);
  await holdUntil(page, ['ArrowRight'], (s) => s.pixel.velocityX >= 0);
  await until(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 224) < 2);
  await holdUntil(
    page,
    ['ArrowRight'],
    (s) => s.vases.find((v) => v.id === 'middle-shelf:middle-slot')?.state !== 'resting',
  );
  await until(
    page,
    (s) => s.vases.find((v) => v.id === 'middle-shelf:middle-slot')?.state === 'broken',
  );
  await expectChaos(page);
  await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= 800);
  await holdUntil(page, ['ArrowUp'], (s) => s.pixel.bottom <= 116);
  await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= 835);
  await holdUntil(
    page,
    ['ArrowDown'],
    (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 154) < 2,
  );
  await holdUntil(
    page,
    ['ArrowRight'],
    (s) => s.vases.find((v) => v.id === 'heirloom-vase')?.state !== 'resting',
  );
  await until(page, (s) => s.vases.every((v) => v.state === 'broken'));
  await expectChaos(page);
  const complete = await state(page);

  expect(complete.hud.scoreText).toBe(`CHAOS: ${complete.chaos.score} · Normal`);
  await framesPass(page, 45);
  expect((await state(page)).chaos.score).toBe(complete.chaos.score);
});

async function expectChaos(page: import('@playwright/test').Page) {
  const s = await state(page);
  const points = s.vases.filter((v) => v.state === 'broken').reduce((sum, v) => sum + v.points, 0);
  const shelfPoints = s.shelves.reduce(
    (sum, shelf) => sum + (shelf.events > 0 ? 2 : 0) + (shelf.state === 'collapsed' ? 10 : 0),
    0,
  );

  const bookPoints = s.books.reduce((sum, book) => sum + (book.lastDamage?.value ?? 0), 0);

  expect(s.chaos.score).toBe(points + s.curtain.damage * 4 + shelfPoints + bookPoints);
}
