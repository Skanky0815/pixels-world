import type { Page } from '@playwright/test';
import { expect, test } from './support';
import { seedRoundRandom } from './round-clock';

type Area = { x: number; y: number; width: number; height: number };

/** Sprite references deliberately use ?camera=room and a fixed world scale. */
export async function prepareCharacterView(page: Page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await seedRoundRandom(page);
  await installVisualFault(page);
}

// eslint-disable-next-line max-lines-per-function -- Fester Welt-Ausschnitt, strikter Bildvergleich und optionale Fehlerprobe bilden eine gemeinsame Browsergrenze.
export async function expectCharacterView(page: Page, name: string, area: Area) {
  const clip = await screenArea(page, area);

  if (process.env.E2E_VISUAL_FAULT)
    expect(await page.evaluate(() => Reflect.get(window, '__visualFaultDraws'))).toBeGreaterThan(0);
  await test.step(`Bildvergleich: ${name}`, () =>
    expect(page).toHaveScreenshot(name, {
      clip,
      animations: 'allow',
      maxDiffPixels: 0,
      threshold: 0,
    }));
}

async function screenArea(page: Page, area: Area) {
  const canvas = await page.locator('canvas').boundingBox();

  if (!canvas) throw new Error('Canvas für Charaktervergleich fehlt');

  return {
    x: Math.floor(canvas.x + (area.x * canvas.width) / 960),
    y: Math.floor(canvas.y + (area.y * canvas.height) / 540),
    width: Math.ceil((area.width * canvas.width) / 960),
    height: Math.ceil((area.height * canvas.height) / 540),
  };
}

// eslint-disable-next-line max-lines-per-function -- Ausschließlich opt-in Fehler am Canvas-Browserübergang; keine Phaser-Objekte oder Spielzustandssetter.
async function installVisualFault(page: Page) {
  const fault = process.env.E2E_VISUAL_FAULT;

  if (!fault) return;

  if (test.info().config.updateSnapshots !== 'none')
    throw new Error('Fehlerproben dürfen keine Referenzbilder schreiben');

  if (!['missing-sara', 'pixel-size'].includes(fault))
    throw new Error('Unbekannte visuelle Fehlerprobe');
  // eslint-disable-next-line max-lines-per-function -- Instrumentierung und Zähler müssen vollständig im isolierten Browserkontext definiert werden.
  await page.addInitScript((kind) => {
    let draws = 0;

    Object.defineProperty(window, '__visualFaultDraws', { get: () => draws });
    CanvasRenderingContext2D.prototype.drawImage = new Proxy(
      CanvasRenderingContext2D.prototype.drawImage,
      {
        // eslint-disable-next-line max-lines-per-function -- Nur die eindeutig identifizierten Sprite-Sheets werden beim tatsächlichen Zeichnen verändert.
        apply(draw, context, args) {
          const image = args[0] as HTMLImageElement;
          const target = kind === 'missing-sara' ? [384, 192] : [160, 160];

          if (image.width !== target[0] || image.height !== target[1])
            return Reflect.apply(draw, context, args);
          draws++;

          if (kind === 'missing-sara') return;

          if (args.length !== 9) throw new Error('Sprite-Zeichenaufruf für Fehlerprobe unerwartet');
          args[7] *= 1.35;
          args[8] *= 1.35;

          return Reflect.apply(draw, context, args);
        },
      },
    );
  }, fault);
}
