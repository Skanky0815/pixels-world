import type { Page } from '@playwright/test';
import { test, expect, start, state, until, holdUntil, reset } from './support';

const source = 'middle-shelf:middle-slot';
const target = 'book-shelf:lower-left';

// eslint-disable-next-line max-lines-per-function -- Die Route nutzt ausschließlich vorhandene Lauf-, Kletter- und Sprung-Eingaben bis rechts neben die Vase.
async function reachVase(page: Page) {
  await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= 790);
  await holdUntil(page, ['ArrowUp'], (s) => s.pixel.climbing && s.pixel.y <= 220);
  await holdUntil(page, ['Space', 'ArrowLeft'], (s) => s.pixel.x <= 730);
  await holdUntil(page, ['ArrowRight'], (s) => s.pixel.velocityX >= 0);
  await until(page, (s) => s.pixel.grounded && s.pixel.bottom === 224);
  const current = await state(page);

  expect(current.books.find((book) => book.id === target)?.state).toBe('stacked');
  expect(current.vases.find((vase) => vase.id === source)?.state).toBe('resting');

  return current;
}

async function triggerChain(page: Page) {
  await holdUntil(page, ['ArrowLeft'], (s) =>
    s.books.some((book) => book.id === target && book.toppledBy === source),
  );
}

test(
  'Kettenreaktion: Vase trifft Bücher; Pause, einmalige Punkte und Reset bleiben stabil',
  {
    tag: '@smoke',
  },
  // eslint-disable-next-line max-lines-per-function -- Der vollständige reale Ablauf hält Herkunft, Fallphase, Pause, Punktesumme und Neustart im selben Szenario zusammen.
  async ({ page }) => {
    await start(page, '/?room-seed=books-5');
    const before = await reachVase(page);
    const vasePoints = before.vases.find((vase) => vase.id === source)!.points;

    await triggerChain(page);
    const hit = (await state(page)).books.find((book) => book.id === target)!;

    expect(hit).toMatchObject({ state: 'falling', events: 0, toppledBy: source });
    await page.keyboard.press('Escape');
    const paused = await state(page);

    await page.clock.runFor(2000);
    expect((await state(page)).books).toEqual(paused.books);
    expect((await state(page)).vases).toEqual(paused.vases);
    await page.keyboard.press('Escape');
    await page.keyboard.down('ArrowDown');
    await until(page, (s) => s.books.find((book) => book.id === target)?.state === 'fallen');
    await until(page, (s) => s.vases.find((vase) => vase.id === source)?.state === 'broken');
    const complete = await state(page);

    expect(complete.books.find((book) => book.id === target)).toMatchObject({
      damage: 1,
      events: 1,
    });
    expect(complete.chaos.score).toBe(before.chaos.score + vasePoints + 12);
    expect(complete.shelves.every((shelf) => shelf.enabled)).toBe(true);
    await page.clock.runFor(3000);
    expect((await state(page)).chaos).toEqual(complete.chaos);
    await page.keyboard.up('ArrowDown');
    await test.info().attach('vase-stoesst-buecher-um', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
    await reset(page);
    expect(
      (await state(page)).books.every(
        (book) => book.state === 'stacked' && book.toppledBy === null,
      ),
    ).toBe(true);
    await reachVase(page);
    await triggerChain(page);
    await reset(page);
    await page.clock.runFor(1200);
    expect(
      (await state(page)).books.every(
        (book) => book.state === 'stacked' && book.events === 0 && book.toppledBy === null,
      ),
    ).toBe(true);
    expect((await state(page)).chaos.score).toBe(0);
  },
);
