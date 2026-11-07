import { PNG } from 'pngjs';
import type { Page } from '@playwright/test';
import { test, expect } from './support';
import { TouchDriver } from './touch-support';
import { OBJECTS } from '../../src/content/objects/catalog';
import type { PlaygroundScene } from '../../src/dev/PlaygroundScene';

type Snapshot = ReturnType<PlaygroundScene['snapshot']>;

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

test('Playground: echtes Sofa-Kratzen, Unterbrechung, Sprung und Reset', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Ein realer Eingabeablauf prüft gemeinsame Spielmechanik und vollständigen Szenenreset.
}) => {
  await loadPlayground(page, 'cozy-couch');
  await walkTo(page, 355);
  await untilPlayground(page, (s) => s.events.some((event) => event.kind === 'scratch'));
  expect((await snapshot(page)).pixel.animation).toBe('scratch');
  await expect(page.locator('#playground-score')).toHaveText(
    String(OBJECTS['cozy-couch'].rules.damageValue),
  );
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
    object: { state: 'idle' },
  });
});

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

// eslint-disable-next-line max-lines-per-function -- Bodenbruch und sofortiger Reset prüfen auch das Aufräumen der laufenden Splitter-Tweens.
test('Playground: Vase vom echten Regal schieben und am Boden zerbrechen', async ({ page }) => {
  await loadPlayground(page, 'small-vase');
  await page.keyboard.down('ArrowRight');
  await untilPlayground(page, (s) => s.object.state === 'broken');
  await page.keyboard.up('ArrowRight');
  const state = await snapshot(page);

  expect(state.events).toHaveLength(1);
  expect(state.events[0]).toMatchObject({ kind: 'break', value: OBJECTS['small-vase'].points });
  expect(state.score).toBe(OBJECTS['small-vase'].points);
  await page.getByRole('button', { name: 'Szene zurücksetzen' }).click();
  await untilPlayground(page, (s) => s.generation > state.generation && s.pixel.grounded);
  expect(await snapshot(page)).toMatchObject({
    score: 0,
    events: [],
    object: { state: 'resting' },
  });
  await page.keyboard.down('ArrowRight');
  await untilPlayground(page, (s) => s.object.state === 'broken');
  await page.keyboard.up('ArrowRight');
  expect((await snapshot(page)).events).toHaveLength(1);
});

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
});
