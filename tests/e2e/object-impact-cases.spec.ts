/* eslint-disable max-lines-per-function -- Zusammenhängende reale Spielrouten halten Kontakt, Wirkung und Reset sichtbar zusammen. */
import type { Page } from '@playwright/test';
import {
  test,
  expect,
  start,
  state,
  until,
  holdUntil,
  lowerShelf,
  middleShelf,
  couch,
  reset,
} from './support';

async function jump(page: Page) {
  await page.keyboard.down('Space');
  await until(page, (s) => !s.pixel.grounded);
  await page.keyboard.up('Space');
  await until(page, (s) => s.pixel.grounded);
}

test(
  'Objektkontakt: rollende Vase schiebt gleichartige Vase weiter, ohne sofortigen Bruch',
  { tag: '@smoke' },
  async ({ page }) => {
    await start(page, '/?room=impact-vases');
    await lowerShelf(page);
    await holdUntil(
      page,
      ['ArrowRight'],
      (s) => s.vases.find((v) => v.id === 'second-vase')?.state === 'moving',
    );
    const hit = await state(page);
    const first = hit.vases.find((v) => v.id === 'first-vase')!;
    const second = hit.vases.find((v) => v.id === 'second-vase')!;

    expect(first.state).not.toBe('broken');
    expect(second.state).not.toBe('broken');
    expect(second.velocityX).toBeGreaterThan(0);
    expect(hit.chaos.score).toBe(0);
    await page.keyboard.press('Escape');
    const paused = (await state(page)).vases;

    await page.clock.runFor(1000);
    expect((await state(page)).vases).toEqual(paused);
    await page.keyboard.press('Escape');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.clock.runFor(64);
    const angle = (await state(page)).vases.find((v) => v.id === 'second-vase')!.angle;

    await page.clock.runFor(64);
    expect((await state(page)).vases.find((v) => v.id === 'second-vase')!.angle).toBe(angle);
    await reset(page);
    expect((await state(page)).vases.every((v) => v.state === 'resting')).toBe(true);
  },
);

test('Objektkontakt: fallende Vase zerbricht mit getroffener Vase, beide Schäden zählen einmal', async ({
  page,
}) => {
  await start(page, '/?room=impact-fall');
  await middleShelf(page);
  await holdUntil(
    page,
    ['ArrowLeft'],
    (s) => s.vases.find((v) => v.id === 'falling-vase')?.state !== 'resting',
  );
  await page.keyboard.down('ArrowDown');
  await until(page, (s) =>
    ['falling-vase', 'target-vase'].every(
      (id) => s.vases.find((v) => v.id === id)?.state === 'broken',
    ),
  );
  const broken = await state(page);

  expect(broken.chaos.score).toBe(70);
  await page.clock.runFor(2000);
  expect((await state(page)).chaos.score).toBe(70);
  await page.keyboard.up('ArrowDown');
  await test
    .info()
    .attach('vase-auf-vase', { body: await page.screenshot(), contentType: 'image/png' });
  await reset(page);
  expect((await state(page)).chaos.score).toBe(0);
});

test('Objektkontakt: fallendes Bild trifft Vase auf seinem Weg; Pause friert den Fall ein', async ({
  page,
}) => {
  await start(page, '/?room=impact-picture');
  await couch(page);
  await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= 410);
  await jump(page);
  expect((await state(page)).pictures[0].state).toBe('crooked');
  await page.keyboard.down('Space');
  await until(page, (s) => s.pictures[0].state === 'falling');
  await page.keyboard.up('Space');
  await page.keyboard.press('Escape');
  const paused = (await state(page)).pictures;

  await page.clock.runFor(1000);
  expect((await state(page)).pictures).toEqual(paused);
  await page.keyboard.press('Escape');
  await page.keyboard.down('ArrowDown');
  await until(page, (s) => s.vases.find((v) => v.id === 'target-vase')?.state === 'broken');
  await until(page, (s) => s.pictures[0].state === 'fallen');
  expect((await state(page)).chaos.score).toBe(53);
  await page.keyboard.up('ArrowDown');
  await test
    .info()
    .attach('bild-auf-vase', { body: await page.screenshot(), contentType: 'image/png' });
});

test('Objektkontakt: fallendes Regal kippt Pflanze ohne Knabbern; Reset mitten im Fall räumt auf', async ({
  page,
}) => {
  await start(page, '/?room=impact-shelf');
  await middleShelf(page);
  await jump(page);
  await page.keyboard.down('Space');
  await until(page, (s) => !s.pixel.grounded);
  await page.keyboard.up('Space');
  await until(
    page,
    (s) => s.shelves.find((shelf) => shelf.id === 'middle-shelf')?.state === 'collapsed',
    16,
  );
  await until(
    page,
    (s) => s.shelves.find((shelf) => shelf.id === 'lower-shelf')?.state === 'collapsed',
    16,
  );
  expect((await state(page)).shelves.find((shelf) => shelf.id === 'lower-shelf')?.enabled).toBe(
    false,
  );
  await until(page, (s) => s.plant.state === 'tipped');
  const tipped = await state(page);

  expect(tipped.plant).toMatchObject({ events: 1, texture: 'catgrass-intact', soilVisible: true });
  expect(tipped.plant.lastDamage?.kind).toBe('tip');
  await page.clock.runFor(1000);
  expect((await state(page)).plant.events).toBe(1);
  await test
    .info()
    .attach('regal-auf-pflanze', { body: await page.screenshot(), contentType: 'image/png' });
  await reset(page);
  await middleShelf(page);
  await jump(page);
  await jump(page);
  await reset(page);
  await page.clock.runFor(1000);
  expect((await state(page)).plant).toMatchObject({ state: 'idle', events: 0, soilVisible: false });
});

test('Objektkontakt: kippende Bücher stoßen eine Vase ohne direkten Pixelkontakt an', async ({
  page,
}) => {
  await start(page, '/?room=impact-books');
  await lowerShelf(page);
  await page.keyboard.down('ArrowDown');
  await until(page, (s) => s.books[0].state === 'falling');
  await until(page, (s) => s.vases.find((v) => v.id === 'target-vase')?.state !== 'resting');
  const hit = await state(page);

  expect(hit.pixel.left + hit.pixel.bodyWidth).toBeLessThan(
    hit.vases.find((v) => v.id === 'target-vase')!.x - 9,
  );
  expect(hit.objectImpacts.last).toMatchObject({ source: 'source-books', target: 'target-vase' });
  await page.keyboard.up('ArrowDown');
});
