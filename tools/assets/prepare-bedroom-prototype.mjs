import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { URL, fileURLToPath } from 'node:url';

// Deterministic rendering of temporary vector blockouts, not production sprite generation.
const root = new URL('../../assets/objects/bedroom-prototype/', import.meta.url);
const browser = await chromium.launch();

try {
  for (const name of ['sleep-pad', 'laundry-pile', 'laundry-basket', 'lamp', 'runner', 'spiderplant-intact', 'spiderplant-bitten']) {
    const source = await readFile(new URL(`${name}.svg`, root), 'utf8');
    const page = await browser.newPage({ deviceScaleFactor: 1 });

    await page.setContent(`<style>body{margin:0}svg{display:block}</style>${source}`);
    await page.locator('svg').screenshot({
      path: fileURLToPath(new URL(`${name}.png`, root)),
      omitBackground: true,
    });
    await page.close();
  }
} finally {
  await browser.close();
}
