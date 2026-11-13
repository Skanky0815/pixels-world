/* eslint-disable max-lines-per-function -- Ein Crawler ohne JavaScript prüft die ausgelieferten Metadaten samt Bild, Sitemap und Pages-Pfaden als zusammenhängenden Vertrag. */
import { test, expect } from '@playwright/test';
import { PNG } from 'pngjs';

const publicBase = 'https://skanky0815.github.io/pixels-world/';
const previewBase = 'http://127.0.0.1:4175';

test('Linkvorschau und Suchdaten sind ohne JavaScript unter dem Pages-Pfad erreichbar', async ({
  browser,
  request,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  try {
    await page.goto(previewBase + '/pixels-world/');
    await expect(page).toHaveTitle('Pixel’s World – Ein Zimmer. Eine Katze. Dein Chaos.');
    await expect(page.locator('h1')).toHaveText('Ein Zimmer. Eine Katze. Dein Chaos.');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', publicBase);
    const meta = (key: string) => page.locator(`meta[property="${key}"], meta[name="${key}"]`);

    for (const [key, value] of Object.entries({
      'og:type': 'website',
      'og:site_name': 'Pixel’s World',
      'og:locale': 'de_DE',
      'og:url': publicBase,
      'og:image': publicBase + 'social/pixels-world.png',
      'og:image:type': 'image/png',
      'og:image:width': '1200',
      'og:image:height': '630',
      'twitter:card': 'summary_large_image',
      'twitter:image': publicBase + 'social/pixels-world.png',
    }))
      await expect(meta(key)).toHaveAttribute('content', value);

    for (const key of [
      'description',
      'og:description',
      'twitter:description',
      'og:image:alt',
      'twitter:image:alt',
    ])
      expect((await meta(key).getAttribute('content'))?.length).toBeGreaterThan(30);
    await expect(meta('og:title')).toHaveAttribute('content', await page.title());
    await expect(meta('twitter:title')).toHaveAttribute('content', await page.title());
    await expect(meta('robots')).toHaveAttribute(
      'content',
      'index, follow, max-image-preview:large',
    );
    const data = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}',
    );

    expect(data).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'VideoGame',
      name: 'Pixel’s World',
      url: publicBase,
      image: publicBase + 'social/pixels-world.png',
      inLanguage: ['de', 'en'],
      isAccessibleForFree: true,
      gamePlatform: 'Web browser',
    });
    expect(data.aggregateRating).toBeUndefined();
    const image = await request.get(previewBase + new URL(data.image).pathname);

    expect(image.status()).toBe(200);
    expect(image.headers()['content-type']).toContain('image/png');
    expect(PNG.sync.read(await image.body())).toMatchObject({ width: 1200, height: 630 });
    const sitemap = await request.get(previewBase + '/pixels-world/sitemap.xml');
    const xml = await sitemap.text();
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

    expect(sitemap.status()).toBe(200);
    expect(xml).toContain('http://www.sitemaps.org/schemas/sitemap/0.9');
    expect(urls).toEqual([publicBase, publicBase + 'play.html', publicBase + 'help.html']);

    for (const url of urls)
      expect((await request.get(previewBase + new URL(url).pathname)).status()).toBe(200);
    await page.goto(previewBase + '/pixels-world/help.html');
    await expect(page).toHaveTitle('Hilfe · Pixel’s World');
    await expect(page.locator('summary')).toHaveCount(6);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      publicBase + 'help.html',
    );
    await expect(page.locator('#build-info')).toContainText(/v\d+\.\d+\.\d+/);
    await page.goto(previewBase + '/pixels-world/play.html');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      publicBase + 'play.html',
    );
    const sw = await request.get(previewBase + '/pixels-world/sw.js');

    expect(await sw.text()).not.toContain('social/pixels-world.png');
  } finally {
    await context.close();
  }
});
