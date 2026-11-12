import { recordAudio, expectAudio } from './audio-support';
import { test, expect, start, state, until, holdUntil, reset, lowerShelf } from './support';
import { startTouch } from './touch-support';

for (const [room, x] of [
  ['living-room', 650],
  ['cozy-remix', 910],
] as const) {
  test(`Bücher: abbrechbares Wackeln und einmaliger Umsturz in ${room} @smoke`, async ({
    page,
    // eslint-disable-next-line max-lines-per-function -- Echte Bewegung, Kontaktabbruch, Pause, Umsturz und Reset prüfen denselben persistenten Stapel.
  }) => {
    await recordAudio(page);
    await start(page, `/?room=${room}&room-seed=books-3`);
    await expectAudio(page, 0.24, 0);
    expect((await state(page)).books[0].art).toMatchObject({
      intactTexture: 'books-upright',
      fallenTexture: 'books-fallen',
      intactVisible: true,
      fallenVisible: false,
    });
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
    await expectAudio(page, 0.24, 1);
    expect((await state(page)).books[0]).toMatchObject({ damage: 1, events: 1 });
    expect((await state(page)).books[0].art).toMatchObject({
      intactVisible: false,
      fallenVisible: true,
    });
    expect((await state(page)).chaos.score).toBe(12);
    await page.clock.runFor(3000);
    await expectAudio(page, 0.24, 1);
    expect((await state(page)).chaos.score).toBe(12);
    await test
      .info()
      .attach('buecher-umgeworfen', { body: await page.screenshot(), contentType: 'image/png' });
    await reset(page);
    await expectAudio(page, 0.24, 1);
    expect((await state(page)).books[0]).toMatchObject({ state: 'stacked', damage: 0, events: 0 });
  });
}

for (const [room, toppled] of [
  ['living-room', false],
  ['cozy-remix', true],
] as const) {
  // Beide Auflagen und Ausgangszustände bleiben real; gemeinsame Fall-/Punkteregeln
  // sind unabhängig vom Raum in book-toppling.test.ts und object-impact.test.ts geprüft.
  test(`Regaleinsturz in ${room} mit ${toppled ? 'bereits verstreuten' : 'aufrechten'} Büchern`, async ({
    page,
    // eslint-disable-next-line max-lines-per-function -- Echte Landungen prüfen beide Ausgangszustände, Pause während des Falls, einmaligen Schaden und Reset.
  }) => {
    await start(page, `/?room=${room}&room-seed=${toppled ? 'books-3' : 'books-5'}`);
    await lowerShelf(page);

    if (toppled) {
      await holdUntil(page, ['ArrowRight'], (s) => s.pixel.x >= 530);
      await until(page, (s) => s.books[1].state === 'fallen');
      expect((await state(page)).chaos.score).toBe(12);
    }

    expect((await state(page)).books[1]).toMatchObject({ supportY: 304, floorY: 468, y: 304 });
    await test
      .info()
      .attach('regalbuecher', { body: await page.screenshot(), contentType: 'image/png' });

    for (let landing = 0; landing < 2; landing++) {
      await page.keyboard.down('Space');
      await until(page, (s) => !s.pixel.grounded);
      await page.keyboard.up('Space');
      await until(page, (s) => s.shelves[0].landings >= landing + 2);
    }

    await until(page, (s) => s.books[1].dropping);
    await page.keyboard.press('Escape');
    const paused = (await state(page)).books[1];

    await page.clock.runFor(2000);
    expect((await state(page)).books[1]).toEqual(paused);
    await page.keyboard.press('Escape');
    await until(page, (s) => s.books[1].y === 468 && !s.books[1].dropping);
    expect((await state(page)).books[1]).toMatchObject({ state: 'fallen', damage: 1, events: 1 });
    await reset(page);
    expect((await state(page)).books[1]).toMatchObject({
      state: 'stacked',
      y: 304,
      events: 0,
      dropping: false,
    });
  });
}

// eslint-disable-next-line max-lines-per-function -- Geräteemulation und zugehöriger Touch-Ablauf bleiben lokal in derselben Gruppe.
test.describe('Bücher auf Touch', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  // eslint-disable-next-line max-lines-per-function -- Touch-Freigabe und einmaliger Aufprall werden zusammen geprüft.
  test('Kontakt funktioniert ohne zusätzliche Aktionstaste', async ({ page }) => {
    await recordAudio(page);
    const touch = await startTouch(page, '/?room-seed=books-3');

    await expectAudio(page, 0.24, 0);

    await touch.press('right');
    await until(page, (s) => s.pixel.x >= 650);
    await touch.lift();
    await until(page, (s) => s.books[0].state === 'fallen');
    await expectAudio(page, 0.24, 1);
    expect((await state(page)).books[0]).toMatchObject({ damage: 1, events: 1 });
    expect((await state(page)).chaos.score).toBe(12);
  });
});
