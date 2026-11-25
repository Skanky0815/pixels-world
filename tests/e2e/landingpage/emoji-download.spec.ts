/* eslint-disable max-lines-per-function -- Ein echter Download prüft ZIP-Inhalt, Vorschauen, Sprache und beide Layouts zusammen. */
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { unzipSync } from 'fflate';
import { PNG } from 'pngjs';

const names = [
  'pixel_approved',
  'pixel_nein',
  'pixel_question',
  'pixel_chaos',
  'pixel_war_nicht_ich',
  'pixel_love',
  'pixel_in_progress',
  'pixel_idee',
  'pixel_urlaub',
  'pixel_muede',
  'pixel_bitte',
  'pixel_essen',
  'pixel_afk',
  'pixel_danke',
  'pixel_lol',
];

test(
  'Pixel-Emojis: mobiler Pages-Download enthält alle transparenten PNGs',
  { tag: '@smoke' },
  async ({ page, request }, info) => {
    const base = 'http://127.0.0.1:4175/pixels-world/';

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base);
    const section = page.locator('.landing-emojis');

    await section.scrollIntoViewIfNeeded();
    await expect(section.locator('img')).toHaveCount(names.length);
    await expect(section.locator('h2')).toHaveText('Pixel für deinen Chat');

    for (const label of [
      'Okay!',
      'Nein!',
      'Weiß nicht …',
      'Müde …',
      'Bitte …',
      'Mittagspause',
      'Bin kurz weg!',
      'Danke dir!',
      'LOL!',
    ])
      await expect(section.getByText(label, { exact: true })).toBeVisible();
    await expect
      .poll(() =>
        section
          .locator('img')
          .evaluateAll((nodes) =>
            nodes.every((node) => (node as HTMLImageElement).naturalWidth === 128),
          ),
      )
      .toBe(true);
    expect(
      await section
        .locator('.emoji-previews')
        .evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(' ').length),
    ).toBe(2);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      section.locator('.emoji-download').click(),
    ]);

    expect(download.suggestedFilename()).toBe('pixel-slack-emojis.zip');
    expect(download.url()).toBe(base + 'downloads/pixel-slack-emojis.zip');
    const zip = info.outputPath('pixel-slack-emojis.zip');

    await download.saveAs(zip);
    const files = unzipSync(readFileSync(zip));

    expect(Object.keys(files).sort()).toEqual(
      [...names.map((name) => name + '.png'), 'Namen.txt'].sort(),
    );

    for (const name of names) {
      const bytes = Buffer.from(files[name + '.png']);
      const png = PNG.sync.read(bytes);

      expect([png.width, png.height]).toEqual([128, 128]);
      expect(bytes.length).toBeLessThan(128 * 1024);
      const alpha = png.data.filter((_, index) => index % 4 === 3);

      expect(alpha.includes(0) && alpha.includes(255)).toBe(true);
      expect(alpha.every((value) => value === 0 || value === 255)).toBe(true);
      expect(
        alpha.every((value, index) => {
          const x = index % 128;
          const y = Math.floor(index / 128);

          return x < 2 || x >= 126 || y < 2 || y >= 126 ? value === 0 : true;
        }),
      ).toBe(true);
      const preview = await request.get(base + 'downloads/pixel-slack-emojis/' + name + '.png');

      expect(preview.ok()).toBe(true);
      expect(await preview.body()).toEqual(bytes);
    }

    await page.getByRole('button', { name: 'English', exact: true }).click();
    await expect(section.locator('h2')).toHaveText('Pixel for your chat');
    await expect(section.locator('.emoji-download')).toHaveText('Download emoji set ↓');
    await expect(section.getByText('No!', { exact: true })).toBeVisible();
    await expect(section.getByText('Not sure …', { exact: true })).toBeVisible();
    await expect(section.locator('img[src$="pixel_urlaub.png"]')).toHaveAccessibleName(
      'Pixel wears sunglasses and smiles contentedly.',
    );
    await expect(section.getByText('Sleepy …', { exact: true })).toBeVisible();
    await expect(section.getByText('Please …', { exact: true })).toBeVisible();
    await expect(section.getByText('Lunch break', { exact: true })).toBeVisible();
    await expect(section.getByText('Be right back!', { exact: true })).toBeVisible();
    await expect(section.getByText('Thank you!', { exact: true })).toBeVisible();
    await expect(section.getByText('LOL!', { exact: true })).toBeVisible();
    await expect(section.locator('img[src$="pixel_lol.png"]')).toHaveAccessibleName(
      'Pixel laughs with his eyes squeezed shut and his mouth open.',
    );
    await expect(section.locator('img[src$="pixel_danke.png"]')).toHaveAccessibleName(
      'Pixel bows his head gratefully and rests one paw against his chest.',
    );
    await expect(section.locator('img[src$="pixel_essen.png"]')).toHaveAccessibleName(
      'Pixel eats from a large bowl with his head lowered.',
    );
    await expect(section.locator('img[src$="pixel_afk.png"]')).toHaveAccessibleName(
      'Pixel walks away from the viewer with his tail raised.',
    );
    await expect(section.locator('img[src$="pixel_bitte.png"]')).toHaveAccessibleName(
      'Pixel pleads with large green eyes and both paws beneath his chin.',
    );
    await expect(section.locator('img[src$="pixel_muede.png"]')).toHaveAccessibleName(
      'Pixel rests his head on his paws beneath golden sleep symbols.',
    );

    for (const width of [1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await section.scrollIntoViewIfNeeded();
      const layout = await section.locator('.emoji-previews').evaluate((node) => ({
        columns: getComputedStyle(node).gridTemplateColumns.split(' ').length,
        rows: new Set(
          Array.from(node.children).map((card) => Math.round(card.getBoundingClientRect().top)),
        ).size,
        overflow: document.documentElement.scrollWidth > window.innerWidth,
      }));

      expect(layout).toEqual({ columns: 5, rows: 3, overflow: false });
    }

    await page.setViewportSize({ width: 768, height: 1024 });
    expect(
      await section
        .locator('.emoji-previews')
        .evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(' ').length),
    ).toBe(3);
    const sw = await request.get(base + 'sw.js');

    expect(sw.ok()).toBe(true);
    expect(await sw.text()).not.toContain('pixel-slack-emojis.zip');
    expect(await sw.text()).toContain('downloads/pixel-slack-emojis/pixel_idee.png');
    await expect(page.locator('canvas')).toHaveCount(0);
  },
);
