import { PNG } from 'pngjs';
import type { Page } from '@playwright/test';
import { test, expect } from './support';
import { TouchDriver } from './touch-support';
import { OBJECTS } from '../../src/content/objects/catalog';
import type { PlaygroundScene } from '../../src/dev/PlaygroundScene';

type Snapshot = ReturnType<PlaygroundScene['snapshot']>;

for (const [name, path, ready] of [
  ['DEV · Animationen', '/animation-compare.html', 'data-ready'],
  ['DEV · Playground', '/interactable-playground.html', 'data-playground-ready'],
]) {
  test(`Spiel-Footer öffnet ${name} im Dev-Modus`, async ({ page }) => {
    await page.goto('http://127.0.0.1:4176/play.html');
    const link = page.locator('#build-info').getByRole('link', { name });

    await expect(link).toHaveAttribute('href', path);
    await link.click();
    await expect(page.locator('html')).toHaveAttribute(ready, 'true');
  });
}

// eslint-disable-next-line max-lines-per-function -- Zwei Pixelproben aus der tatsächlichen Canvas-Aufnahme unterscheiden gezeichneten Boden und Wand nach Reset/Rotation.
async function assertRoomDrawn(page: Page) {
  const canvas = page.locator('#game canvas');

  await canvas.scrollIntoViewIfNeeded();
  await page.clock.runFor(32);
  const capture = await canvas.screenshot();
  const image = PNG.sync.read(capture);
  const pixelAt = (y: number) =>
    image.data.subarray(
      (Math.floor(image.height * y) * image.width + 10) * 4,
      (Math.floor(image.height * y) * image.width + 10) * 4 + 3,
    );

  expect([...pixelAt(0.95)], 'Boden muss nach Reset/Rotation sichtbar bleiben').not.toEqual([
    ...pixelAt(0.1),
  ]);

  return capture;
}

async function snapshot(page: Page): Promise<Snapshot> {
  return JSON.parse((await page.locator('#playground-diagnostics').textContent()) ?? '{}');
}

// eslint-disable-next-line max-lines-per-function -- Clock und lesbare DOM-Diagnose bilden eine gemeinsame Polling-Grenze.
async function untilPlayground(page: Page, check: (state: Snapshot) => boolean) {
  await expect
    .poll(
      async () => {
        await page.clock.runFor(32);

        return check(await snapshot(page));
      },
      { intervals: [0], timeout: 15_000 },
    )
    .toBe(true);
}

async function loadPlayground(page: Page, variant: string) {
  await page.goto('http://127.0.0.1:4176/interactable-playground.html');
  await expect(page.locator('html')).toHaveAttribute('data-playground-ready', 'true');
  await choose(page, variant);
}

async function choose(page: Page, variant: string) {
  await page.getByLabel('Objekt / Variante aus dem Spielkatalog').selectOption(variant);
  await untilPlayground(page, (s) => s.variant === variant);
  await page.locator('#game').focus();
  await untilPlayground(page, (s) => s.pixel.grounded);
}

async function walkTo(page: Page, x: number) {
  await page.keyboard.down('ArrowRight');
  await untilPlayground(page, (s) => s.pixel.x >= x);
  await page.keyboard.up('ArrowRight');
  await untilPlayground(page, (s) => s.pixel.velocityX === 0);
}

for (const variant of ['cozy-couch', 'worn-couch'] as const) {
  test(`Playground: ${variant} mit eigener Textur, Kratzspuren und Reset`, async ({
    page,
    // eslint-disable-next-line max-lines-per-function -- Ein realer Eingabeablauf prüft gemeinsame Spielmechanik und vollständigen Szenenreset.
  }) => {
    await loadPlayground(page, variant);
    expect(await couchSnapshot(page)).toMatchObject({
      texture: `couch-${OBJECTS[variant].appearance}`,
      bodyWidth: 254,
      bodyHeight: 28,
      marks: [],
    });
    await walkTo(page, 355);
    await untilPlayground(page, (s) => s.events.some((event) => event.kind === 'scratch'));
    expect((await snapshot(page)).pixel.animation).toBe('scratch');
    await expect(page.locator('#playground-score')).toHaveText(
      String(OBJECTS[variant].rules.damageValue),
    );
    const first = await couchSnapshot(page);

    expect(first.marks).toHaveLength(1);
    expect(first.marks[0].y).toBe(408);
    await untilPlayground(page, (s) => 'damage' in s.object && s.object.damage === 6);
    const complete = await couchSnapshot(page);

    expect(complete.marks).toHaveLength(6);
    const positions = complete.marks.map((mark) => mark.x).sort((a, b) => a - b);

    expect(positions.slice(1).every((x, index) => x - positions[index] >= 32)).toBe(true);
    await page.keyboard.down('Space');
    await untilPlayground(page, (s) => !s.pixel.grounded && s.pixel.velocityY < 0);
    await page.keyboard.up('Space');
    const generation = (await snapshot(page)).generation;

    await page.getByRole('button', { name: 'Szene zurücksetzen' }).click();
    await untilPlayground(page, (s) => s.generation > generation);
    expect(await snapshot(page)).toMatchObject({
      score: 0,
      events: [],
      pixel: { x: 200 },
      object: { state: 'idle', marks: [] },
    });
  });
}

test('Playground: Pflanze knabbern, wackeln und umkippen', async ({ page }) => {
  await loadPlayground(page, 'catgrass');
  await walkTo(page, 345);
  await untilPlayground(page, (s) => s.object.state === 'tipped');
  const state = await snapshot(page);

  expect(state.events.map((event) => event.kind)).toEqual(['nibble', 'tip']);
  expect(state.score).toBe(OBJECTS.catgrass.rules.nibbleValue + OBJECTS.catgrass.rules.tipValue);
  await page.clock.runFor(2000);
  expect((await snapshot(page)).score).toBe(state.score);
});

test('Playground: Vorhang mit echter Kollision greifen und beim Rutschen beschädigen', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Greifen, Klettern und Rutschen werden ausschließlich mit regulären Pfeiltasten ausgelöst.
}) => {
  await loadPlayground(page, 'warm-curtain');
  await walkTo(page, 380);
  await page.keyboard.down('ArrowUp');
  await untilPlayground(page, (s) => s.pixel.climbing && s.pixel.y < 240);
  await page.keyboard.up('ArrowUp');
  await untilPlayground(page, (s) => s.events.some((event) => event.kind === 'tear'));
  expect((await snapshot(page)).pixel.animation).toBe('slide');
  await expect(page.locator('#playground-score')).toHaveText(
    String(OBJECTS['warm-curtain'].rules.damageValue),
  );
});

for (const variant of ['small-vase', 'blue-vase', 'heirloom-vase', 'mellow-vase'] as const) {
  test(`Playground: ${variant} vom Regal schieben, eigene Textur und Scherben zurücksetzen`, async ({
    page,
    // eslint-disable-next-line max-lines-per-function -- Reale Auswahl, Bruch und Reset prüfen Textur, Physik und Splitter-Lebensdauer gemeinsam.
  }) => {
    await loadPlayground(page, variant);
    expect((await snapshot(page)).object).toMatchObject({
      texture: `vase-${OBJECTS[variant].appearance}`,
      bodyWidth: 18,
      bodyHeight: 28,
      shards: 0,
    });
    await page.keyboard.down('ArrowRight');
    await untilPlayground(page, (s) => s.object.state === 'broken');
    await page.keyboard.up('ArrowRight');
    const state = await snapshot(page);

    expect(state.object).toMatchObject({ shards: 7 });
    expect(state.events).toHaveLength(1);
    expect(state.events[0]).toMatchObject({ kind: 'break', value: OBJECTS[variant].points });
    expect(state.score).toBe(OBJECTS[variant].points);
    await page.getByRole('button', { name: 'Szene zurücksetzen' }).click();
    await untilPlayground(page, (s) => s.generation > state.generation && s.pixel.grounded);
    expect(await snapshot(page)).toMatchObject({
      score: 0,
      events: [],
      object: { state: 'resting', shards: 0 },
    });
    await page.keyboard.down('ArrowRight');
    await untilPlayground(page, (s) => s.object.state === 'broken');
    await page.keyboard.up('ArrowRight');
    expect((await snapshot(page)).events).toHaveLength(1);
  });
}

test('Playground: alle Varianten und wiederholte Wechsel behalten stabile Ressourcen', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Wiederholte Szenenwechsel vergleichen echte Body-, Collider- und Listenerzahlen pro Variante.
}, testInfo) => {
  await loadPlayground(page, 'cozy-couch');
  expect(
    await page
      .locator('#playground-object option')
      .evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value)),
  ).toEqual(Object.keys(OBJECTS));
  const resources = new Map<string, Snapshot['resources']>();

  for (let cycle = 0; cycle < 2; cycle++) {
    for (const variant of Object.keys(OBJECTS)) {
      await choose(page, variant);
      const state = await snapshot(page);

      expect(state.score).toBe(0);
      expect(state.events).toEqual([]);
      expect(state.resources.objects).toBe(1);

      if (resources.has(variant)) expect(state.resources).toEqual(resources.get(variant));
      resources.set(variant, state.resources);
      await expect(page.locator('.touch-controls')).toHaveCount(1);
      await expect(page.locator('#game canvas')).toHaveCount(1);
    }
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.runFor(100);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await testInfo.attach('mobile-playground', {
    body: await assertRoomDrawn(page),
    contentType: 'image/png',
  });
  await page.getByRole('link', { name: 'Animationsvergleich' }).click();
  await expect(page.locator('article')).toHaveCount(2);
});

// eslint-disable-next-line max-lines-per-function -- Der deklarative Block begrenzt die Geräteemulation auf diesen mobilen Ablauf.
test.describe('Playground auf Touch-Geräten', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test('Richtung und Sprung funktionieren gleichzeitig, Reset räumt Eingaben auf', async ({
    page,
    // eslint-disable-next-line max-lines-per-function -- Echte Touch-Eingaben prüfen Richtung, Sprung und Freigabe nach Reset im isolierten Raum.
  }, testInfo) => {
    await loadPlayground(page, 'catgrass');
    const touch = await TouchDriver.create(page);

    await expect(page.locator('.touch-controls')).toBeVisible();
    await touch.press('right', 1);
    await untilPlayground(page, (s) => s.pixel.x > 235);
    await touch.press('jump', 2);
    await untilPlayground(page, (s) => !s.pixel.grounded && s.pixel.velocityY < 0);
    await touch.lift(2);
    await touch.lift(1);
    const generation = (await snapshot(page)).generation;

    await page.getByRole('button', { name: 'Szene zurücksetzen' }).tap();
    await untilPlayground(page, (s) => s.generation > generation && s.pixel.grounded);
    await expect(page.locator('[data-control=right]')).toHaveAttribute('aria-pressed', 'false');
    expect((await snapshot(page)).pixel.velocityX).toBe(0);
    await expect(page.locator('.touch-controls')).toHaveCount(1);
    await expect(page.locator('.touch-controls')).toBeVisible();
    await testInfo.attach('touch-playground', {
      body: await assertRoomDrawn(page),
      contentType: 'image/png',
    });
  });
  test('Beide Sofa-Stoffe zeigen Kratzspuren nach Touch und räumen beim Reset auf', async ({
    page,
    // eslint-disable-next-line max-lines-per-function -- Zwei echte Touch-Durchläufe prüfen Grafik, Punkte und Patch-Lebensdauer beider Varianten.
  }) => {
    const touch = await TouchDriver.create(page);

    for (const variant of ['cozy-couch', 'worn-couch'] as const) {
      await loadPlayground(page, variant);
      await touch.press('right');
      await untilPlayground(page, (s) => s.pixel.x >= 355);
      await touch.lift();
      await untilPlayground(page, (s) => s.events.length === 1);
      expect(await couchSnapshot(page)).toMatchObject({
        texture: `couch-${OBJECTS[variant].appearance}`,
      });
      expect((await couchSnapshot(page)).marks).toHaveLength(1);
      expect((await snapshot(page)).score).toBe(OBJECTS[variant].rules.damageValue);
      await page.getByRole('button', { name: 'Szene zurücksetzen' }).tap();
      await untilPlayground(page, (s) => s.events.length === 0);
      expect((await couchSnapshot(page)).marks).toEqual([]);
    }
  });
});

// eslint-disable-next-line max-lines-per-function -- Desktop und schmales Layout werden an echten Elementgrenzen einschließlich langer Diagnosedaten geprüft.
test('Playground: kompakte Szene mit seitlicher Diagnose und mobilem Umbruch', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await loadPlayground(page, 'small-vase');
  await page.getByText('Objekt, Pixel und Ressourcen im Detail').click();
  const scene = await page.locator('#game').boundingBox();
  const panel = await page.locator('.playground-readout').boundingBox();
  const select = await page.locator('#playground-object').boundingBox();
  const reset = await page.locator('#playground-reset').boundingBox();

  expect(scene!.width).toBe(800);
  expect(panel!.x).toBeGreaterThan(scene!.x + scene!.width);
  expect(Math.abs(select!.y - reset!.y)).toBeLessThan(2);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.runFor(100);
  const mobileScene = await page.locator('#game').boundingBox();
  const mobilePanel = await page.locator('.playground-readout').boundingBox();

  expect(mobilePanel!.y).toBeGreaterThan(mobileScene!.y + mobileScene!.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('#playground-reset')).toBeVisible();
  await assertRoomDrawn(page);
});

async function couchSnapshot(page: Page) {
  const object = (await snapshot(page)).object;

  if (!('marks' in object)) throw new Error('Expected couch diagnostics');

  return object;
}

// eslint-disable-next-line max-lines-per-function -- Reale Bewegung und Sprung erreichen die Sitzfläche, deren Kontaktpatch sich vom Bodenpatch unterscheiden muss.
test('Playground: Kratzpatch folgt der Sitzfläche', async ({ page }) => {
  await loadPlayground(page, 'cozy-couch');
  await walkTo(page, 230);
  await page.keyboard.down('ArrowRight');
  await page.keyboard.down('Space');
  await untilPlayground(page, (s) => s.pixel.x >= 395);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.up('Space');
  await untilPlayground(page, (s) => s.pixel.grounded && Math.abs(s.pixel.bottom - 370) < 2);
  await untilPlayground(page, (s) => 'damage' in s.object && s.object.damage === 1);
  expect((await couchSnapshot(page)).marks[0].y).toBe(331);
});
