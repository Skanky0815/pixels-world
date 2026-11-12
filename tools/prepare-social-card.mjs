import { readFileSync } from 'node:fs';
import { URL, fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

// Render a code-owned card around the existing artwork; keep the complete banner visible.
const banner = readFileSync(new URL('../assets/banner.png', import.meta.url)).toString('base64');
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.setContent(`<!doctype html><html lang="de"><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:#241f29;color:#f4e4c6;font-family:Arial,sans-serif}
    img{display:block;width:1200px;height:400px}section{height:230px;padding:35px 48px;border-top:4px solid #c49464}
    h1{margin:0 0 19px;font-size:43px;line-height:1.2;letter-spacing:-.5px}
    p{margin:0;color:#e4c182;font-size:27px;line-height:1.4}
    </style><img src="data:image/png;base64,${banner}" alt=""><section>
    <h1>Ein Zimmer. Eine Katze. Dein Chaos.</h1><p>Kostenlos im Browser · Tastatur &amp; Touch</p></section></html>`);
  await page.locator('img').evaluate((image) => image.decode());
  await page.screenshot({
    path: fileURLToPath(new URL('../public/social/pixels-world.png', import.meta.url)),
  });
} finally {
  await browser.close();
}
