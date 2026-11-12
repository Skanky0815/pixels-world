import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { PNG } from 'pngjs';

const names = [
  'pixel_approved',
  'pixel_chaos',
  'pixel_war_nicht_ich',
  'pixel_love',
  'pixel_in_progress',
  'pixel_question',
  'pixel_idee',
  'pixel_urlaub',
];

test('Pixel-Emojis: mobiler Pages-Download enthält alle transparenten PNGs', async ({
  page,
  request,
  // eslint-disable-next-line max-lines-per-function -- ZIP-Inhalt und Darstellung prüfen denselben öffentlichen Downloadweg.
}, info) => {
  const base = 'http://127.0.0.1:4175/pixels-world/';

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base);
  const section = page.locator('.landing-emojis');

  await section.scrollIntoViewIfNeeded();
  await expect(section.locator('img')).toHaveCount(names.length);
  await expect(section.locator('h2')).toHaveText('Pixel für deinen Chat');
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
  const files = execFileSync('unzip', ['-Z1', zip], { encoding: 'utf8' }).trim().split('\n');

  expect(files.sort()).toEqual([...names.map((name) => name + '.png'), 'Namen.txt'].sort());

  for (const name of names) {
    const bytes = execFileSync('unzip', ['-p', zip, name + '.png']);
    const png = PNG.sync.read(bytes);

    expect([png.width, png.height]).toEqual([128, 128]);
    expect(bytes.length).toBeLessThan(128 * 1024);
    const alpha = png.data.filter((_, index) => index % 4 === 3);

    expect(alpha.includes(0) && alpha.includes(255)).toBe(true);
    const preview = await request.get(base + 'downloads/pixel-slack-emojis/' + name + '.png');

    expect(preview.ok()).toBe(true);
    expect(await preview.body()).toEqual(bytes);
  }

  await page.getByRole('button', { name: 'English', exact: true }).click();
  await expect(section.locator('h2')).toHaveText('Pixel for your chat');
  await expect(section.locator('.emoji-download')).toHaveText('Download emoji set ↓');
  await expect(section.locator('img').last()).toHaveAccessibleName(
    'Pixel wears sunglasses and smiles contentedly.',
  );
  await page.setViewportSize({ width: 1280, height: 900 });
  await section.scrollIntoViewIfNeeded();
  expect(
    await section
      .locator('.emoji-previews')
      .evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(' ').length),
  ).toBe(4);
  const sw = await request.get(base + 'sw.js');

  expect(sw.ok()).toBe(true);
  expect(await sw.text()).not.toContain('pixel-slack-emojis.zip');
  expect(await sw.text()).toContain('downloads/pixel-slack-emojis/pixel_idee.png');
  await expect(page.locator('canvas')).toHaveCount(0);
});
