import { test, expect, start, state, until, holdUntil, reset } from './support';
import { startTouch } from './touch-support';

for (const [room, x] of [
  ['living-room', 650],
  ['cozy-remix', 865],
] as const) {
  test(`Bücher: abbrechbares Wackeln und einmaliger Umsturz in ${room} @smoke`, async ({
    page,
    // eslint-disable-next-line max-lines-per-function -- Echte Bewegung, Kontaktabbruch, Pause, Umsturz und Reset prüfen denselben persistenten Stapel.
  }) => {
    await start(page, `/?room=${room}`);
    await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= x);
    await until(page, (s) => s.books[0].state === 'wobbling');
    await holdUntil(page, ['ArrowLeft'], (s) => s.pixel.x <= x - 65);
    await until(page, (s) => s.books[0].state === 'stacked');
    expect((await state(page)).chaos.score).toBe(0);
    await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= x);
    await until(page, (s) => s.books[0].state === 'wobbling');
    await page.keyboard.press('Escape');
    const paused = (await state(page)).books;

    await page.clock.runFor(2000);
    expect((await state(page)).books).toEqual(paused);
    await page.keyboard.press('Escape');
    await until(page, (s) => s.books[0].state === 'falling');
    await holdUntil(page, ['ArrowLeft'], (s) => s.pixel.x <= x - 65);
    await until(page, (s) => s.books[0].state === 'fallen');
    expect((await state(page)).books[0]).toMatchObject({ damage: 1, events: 1 });
    expect((await state(page)).chaos.score).toBe(12);
    await page.clock.runFor(3000);
    expect((await state(page)).chaos.score).toBe(12);
    await test
      .info()
      .attach('buecher-umgeworfen', { body: await page.screenshot(), contentType: 'image/png' });
    await reset(page);
    expect((await state(page)).books[0]).toMatchObject({ state: 'stacked', damage: 0, events: 0 });
  });
}

// eslint-disable-next-line max-lines-per-function -- Geräteemulation und zugehöriger Touch-Ablauf bleiben lokal in derselben Gruppe.
test.describe('Bücher auf Touch', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test('Kontakt funktioniert ohne zusätzliche Aktionstaste', async ({ page }) => {
    const touch = await startTouch(page);

    await touch.press('right');
    await until(page, (s) => s.pixel.x >= 650);
    await touch.lift();
    await until(page, (s) => s.books[0].state === 'fallen');
    expect((await state(page)).books[0]).toMatchObject({ damage: 1, events: 1 });
    expect((await state(page)).chaos.score).toBe(12);
  });
});
