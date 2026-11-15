import { expect } from '@playwright/test';

export async function expectArtwork(page: import('@playwright/test').Page) {
  for (const image of await page.locator('main img').all()) {
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() => image.evaluate((node) => (node as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
    await expect(image).toHaveAttribute('width', /^\d+$/);
    await expect(image).toHaveAttribute('height', /^\d+$/);
  }
}

// eslint-disable-next-line max-lines-per-function -- Inhalt, semantische Reihenfolge und responsiver Profilaufbau bilden denselben Landingpage-Vertrag.
export async function expectTeam(page: import('@playwright/test').Page, width: number) {
  const team = page.getByRole('region', { name: 'Die Köpfe hinter dem Chaos.' });

  await expect(team).toBeVisible();
  await expect(team.locator('article')).toHaveCount(3);
  await expect(team.locator('h3')).toHaveText(['Rico', 'Sara', 'Pixel']);
  await expect(page.locator('.landing-header nav a')).toHaveText([
    'Das Spiel',
    'Über uns',
    'Emojis',
    'Hilfe',
    'GitHub ↗',
  ]);
  await expect(team.locator('article', { has: page.locator('#team-sara') })).toContainText(
    'KI-Mitwirkende',
  );
  await expect(team.getByRole('img', { name: /Pixel-Art-Porträt von Rico/ })).toBeVisible();
  await expect(team.getByRole('link', { name: 'Rico auf GitHub' })).toHaveAttribute(
    'href',
    'https://github.com/Skanky0815',
  );
  await expect(team.getByRole('link', { name: 'Sara auf GitHub' })).toHaveAttribute(
    'href',
    'https://github.com/Sara-Pixel42',
  );
  const positions = await team.locator('article').evaluateAll((nodes) =>
    nodes.map((node) => {
      const portrait = node.querySelector('.team-portrait')!.getBoundingClientRect();
      const identity = node.querySelector('.team-identity')!.getBoundingClientRect();

      return {
        beside: identity.left >= portrait.right,
        aligned: Math.abs(identity.top - portrait.top) < 1,
      };
    }),
  );

  expect(positions.every((p) => p.beside && p.aligned)).toBe(true);

  const boxes = await team.locator('article').evaluateAll((nodes) =>
    nodes.map((node) => {
      const b = node.getBoundingClientRect();

      return { x: b.x, y: b.y, width: b.width };
    }),
  );

  expect(boxes.every((b) => b.x >= 0 && b.x + b.width <= width)).toBe(true);
  expect(width <= 1000 ? boxes[1].y > boxes[0].y : boxes[1].x > boxes[0].x).toBe(true);
  expect(
    await page
      .locator('.landing-team')
      .evaluate(
        (node) =>
          !!(
            node.compareDocumentPosition(document.querySelector('footer')!) &
            Node.DOCUMENT_POSITION_FOLLOWING
          ),
      ),
  ).toBe(true);
  expect(
    await page
      .locator('.landing-finale')
      .evaluate(
        (node) =>
          !!(
            node.compareDocumentPosition(document.querySelector('.landing-team')!) &
            Node.DOCUMENT_POSITION_FOLLOWING
          ),
      ),
  ).toBe(true);
}
