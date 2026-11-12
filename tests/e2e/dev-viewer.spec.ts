import type { Page } from '@playwright/test';
import { test, expect } from './support';
import { PIXEL_ANIMATIONS } from '../../src/game/actors/pixel-animations';
import { SARA_CLIPS } from '../../src/game/actors/sara-animations';
import { CHARM_COMPARISON_CLIPS } from '../../src/dev/pixel-compare-charm';

async function openViewer(page: Page) {
  await page.goto('http://127.0.0.1:4176/animation-compare.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  await page.clock.runFor(32);
}

// eslint-disable-next-line max-lines-per-function -- Alle echten Animationsdaten werden durch dieselbe native Auswahl und Einzelbild-Bedienung geprüft.
test('DEV-Vorschau enthält alle Posen in genau einer Box pro Figur', async ({ page }) => {
  await openViewer(page);
  await page.locator('#pause').click();

  for (const [name, clips] of [
    ['Pixel', { ...PIXEL_ANIMATIONS, ...CHARM_COMPARISON_CLIPS }],
    ['Sara', SARA_CLIPS],
  ] as const) {
    const card = page.locator(`article[data-character="${name.toLowerCase()}"]`);
    const select = page.getByLabel(`${name}-Animation`, { exact: true });

    await expect(card).toHaveCount(1);
    expect(
      await select
        .locator('option')
        .evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value)),
    ).toEqual(Object.keys(clips));

    for (const [key, clip] of Object.entries(clips)) {
      const frames =
        'poses' in clip ? clip.poses.map((pose: { frame: number }) => pose.frame) : clip.frames;

      await select.selectOption(key);
      await expect(card.locator('output')).toContainText(`Frame ${frames[0]}`);
      await page.getByRole('button', { name: `${name} ein Frame weiter`, exact: true }).click();
      await expect(card.locator('output')).toContainText(`Frame ${frames[1 % frames.length]}`);
    }
  }

  await page.getByLabel('Pixel-Animation', { exact: true }).selectOption('walk');
  await page.getByLabel('Sara-Animation', { exact: true }).selectOption('sara-enter');
  await page.locator('#step').click();
  await expect(page.locator('[data-character=pixel] output')).toContainText('Frame 6');
  await expect(page.locator('[data-character=sara] output')).toContainText('Frame 3');
  await expect(page.locator('.figures article')).toHaveCount(2);
  await expect(page.locator('.figures canvas')).toHaveCount(2);
});

test('DEV-Vorschauen bleiben unabhängig und passen auf schmale Bildschirme', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Ein gemeinsamer Ablauf prüft unabhängige Bedienung und erhaltenen Zustand beim mobilen Layoutwechsel.
}, testInfo) => {
  await openViewer(page);
  await page.getByLabel('Sara-Animation', { exact: true }).selectOption('sara-enter');
  await page.getByRole('button', { name: 'Pixel pausieren', exact: true }).click();
  const pixel = page.locator('[data-character=pixel] output');
  const sara = page.locator('[data-character=sara] output');
  const frozenPixel = await pixel.textContent();
  const runningSara = await sara.textContent();

  await page.clock.runFor(300);
  await expect(pixel).toHaveText(frozenPixel ?? '');
  expect(await sara.textContent()).not.toBe(runningSara);
  await page.getByRole('button', { name: 'Sara pausieren', exact: true }).click();
  const frozenSara = await sara.textContent();

  await page.getByRole('button', { name: 'Pixel ein Frame weiter', exact: true }).click();
  await expect(pixel).not.toHaveText(frozenPixel ?? '');
  await expect(sara).toHaveText(frozenSara ?? '');
  await page.locator('#pause').click();
  await page.locator('#pause').click();
  const steppedPixel = await pixel.textContent();

  await page.clock.runFor(1000);
  await expect(pixel).toHaveText(steppedPixel ?? '');
  await expect(sara).toHaveText(frozenSara ?? '');
  await page.getByLabel('Pixel-Vorschaugröße').focus();
  await page.keyboard.press('End');
  await expect(pixel).toContainText('120 × 120 px');
  await expect(page.getByLabel('Sara-Vorschaugröße')).toHaveValue('2');
  await page.getByLabel('Sara-Vorschaugröße').focus();
  await page.keyboard.press('End');
  await expect(sara).toContainText('2.5×');
  await expect(pixel).toContainText('120 × 120 px');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.figures article')).toHaveCount(2);
  await expect(page.getByLabel('Sara-Animation', { exact: true })).toHaveValue('sara-enter');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await testInfo.attach('mobile-animation-viewer', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
});

// eslint-disable-next-line max-lines-per-function -- Beide DEV-Einstiege werden mit Desktop- und Mobilbreite über ihre sichtbare Navigation und Seitengrenzen verglichen.
test('DEV-Seiten teilen Seitenrahmen und vollständige Navigation', async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    const frames = [];

    for (const path of ['animation-compare', 'interactable-playground']) {
      await page.goto(`http://127.0.0.1:4176/${path}.html`);
      const nav = page.getByRole('navigation', { name: 'DEV-Modus', exact: true });

      await expect(nav.getByRole('link')).toHaveCount(3);
      await expect(nav.locator('[aria-current=page]')).toHaveAttribute('href', `/${path}.html`);
      await expect(nav.getByRole('link', { name: 'Zum Spiel', exact: true })).toHaveAttribute(
        'href',
        '/play.html',
      );
      await expect(page.locator('.eyebrow')).toHaveText('PIXEL’S WORLD · DEV-WERKZEUGE');
      frames.push(await page.locator('main').boundingBox());
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }

    expect(frames[0]!.x).toBe(frames[1]!.x);
    expect(frames[0]!.width).toBe(frames[1]!.width);
  }
});

test('Abschlussvorschau zeigt Kopf, Rückenlage und Misserfolg mit gemeinsamer Pause', async ({
  page,
  // eslint-disable-next-line max-lines-per-function -- Gemeinsame Abschlussposen, Pause und ruhiger Modus bleiben ein zusammenhängender Bedienablauf.
}, testInfo) => {
  await openViewer(page);
  await page.locator('#pause').click();
  const cards = page.locator('#ending-comparisons article');

  await expect(cards).toHaveCount(3);

  for (const [key, initial] of [
    ['head', 6],
    ['belly', 0],
    ['sulk', 12],
  ] as const)
    await expect(page.locator(`[data-ending="${key}"] canvas`)).toHaveAttribute(
      'data-frame',
      String(initial),
    );
  await page.locator('#step').click();
  await expect(page.locator('[data-ending="head"] canvas')).toHaveAttribute('data-frame', '7');
  await expect(page.locator('[data-ending="belly"] canvas')).toHaveAttribute('data-frame', '1');
  await expect(page.locator('[data-ending="sulk"] canvas')).toHaveAttribute('data-frame', '13');
  await page.locator('[data-ending="belly"] input').check();
  await page.locator('#step').click();
  await expect(page.locator('[data-ending="belly"] canvas')).toHaveAttribute('data-frame', '5');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openViewer(page);

  for (const [key, last] of [
    ['head', 11],
    ['belly', 5],
    ['sulk', 15],
  ] as const) {
    await expect(page.locator(`[data-ending="${key}"] input`)).toBeChecked();
    await expect(page.locator(`[data-ending="${key}"] canvas`)).toHaveAttribute(
      'data-frame',
      String(last),
    );
  }

  await page.clock.runFor(1000);
  await expect(page.locator('[data-ending="belly"] canvas')).toHaveAttribute('data-frame', '5');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await testInfo.attach('ending-contact-poses-mobile', {
    body: await page.locator('#ending-comparisons').screenshot(),
    contentType: 'image/png',
  });
});
