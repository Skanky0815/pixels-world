/* eslint-disable max-lines-per-function -- Echte Editorbedienung und Physikbeobachtung bleiben als vollständige Abläufe zusammen. */
import { test, expect } from '../support/support';
import { loadScenario } from './playground-object-support';
import { snapshot, untilPlayground } from './playground-support';

test('Editor: mehrfach spawnen, verschieben, entfernen und Reset verwenden reale Instanzen', async ({
  page,
}) => {
  await loadScenario(page, 'empty');
  await page.getByText('Objekte platzieren / bearbeiten', { exact: true }).click();
  expect((await snapshot(page)).resources.objects).toBe(0);
  await page.getByLabel('Objekt zum Spawnen').selectOption('blue-vase');
  await page.getByLabel('X', { exact: true }).fill('400');
  await page.getByRole('button', { name: 'Spawnen', exact: true }).click();
  await untilPlayground(page, (s) => s.objects.length === 1 && s.pixel.grounded);
  await page.getByLabel('X', { exact: true }).fill('460');
  await page.getByRole('button', { name: 'Spawnen', exact: true }).click();
  await untilPlayground(page, (s) => s.objects.length === 2 && s.pixel.grounded);
  const resources = (await snapshot(page)).resources;

  await page.getByLabel('Diagnoseziel').selectOption('object:spawn-2');
  await page.getByLabel('X', { exact: true }).fill('520');
  await page.getByRole('button', { name: 'Auswahl verschieben' }).click();
  await untilPlayground(page, (s) =>
    s.vases.some((vase) => vase.id === 'spawn-2' && vase.x === 520),
  );
  await expect(page.getByLabel('Diagnoseziel')).toHaveValue('object:spawn-2');
  await page.getByRole('button', { name: 'Auswahl entfernen' }).click();
  await untilPlayground(page, (s) => s.objects.length === 1 && s.pixel.grounded);
  expect((await snapshot(page)).vases.map((vase) => vase.id)).toEqual(['spawn-1']);
  await page.getByRole('button', { name: 'Szene zurücksetzen' }).click();
  await untilPlayground(page, (s) => s.objects.length === 1 && s.pixel.grounded);
  expect((await snapshot(page)).vases[0].x).toBe(400);
  expect((await snapshot(page)).resources.bodies).toBeLessThan(resources.bodies);
  await expect(page.locator('canvas')).toHaveCount(1);
});

test('Editor: Fehler verändern keinen Zustand; kopierter Aufbau ist erneut ladbar', async ({
  page,
}) => {
  await loadScenario(page, 'empty');
  await page.getByText('Objekte platzieren / bearbeiten', { exact: true }).click();
  const initial = await snapshot(page);

  await page.getByLabel('X', { exact: true }).fill('-100');
  await page.getByRole('button', { name: 'Spawnen', exact: true }).click();
  await expect(page.locator('#editor-message')).not.toBeEmpty();
  expect((await snapshot(page)).generation).toBe(initial.generation);
  await page.getByText('Aufbau laden / kopieren', { exact: true }).click();
  await page.getByRole('button', { name: 'Aufbau in Textfeld kopieren' }).click();
  const exported = await page.getByLabel('Aufbaudaten').inputValue();

  await page.getByLabel('Aufbaudaten').fill('{broken');
  await page.getByRole('button', { name: 'Aufbau laden', exact: true }).click();
  expect((await snapshot(page)).generation).toBe(initial.generation);
  await page.getByLabel('Aufbaudaten').fill(exported);
  await page.getByRole('button', { name: 'Aufbau laden', exact: true }).click();
  await untilPlayground(page, (s) => s.generation > initial.generation && s.pixel.grounded);
  expect((await snapshot(page)).objects).toEqual([]);
});

test.describe('Editor auf dem Handy', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  test('Wandobjekt mit X/Y platzieren, verschieben und entfernen', async ({ page }) => {
    await loadScenario(page, 'empty');
    await page.getByText('Objekte platzieren / bearbeiten', { exact: true }).tap();
    await page.getByLabel('Objekt zum Spawnen').selectOption('pixel-portrait');
    await page.getByLabel('X', { exact: true }).fill('300');
    await page.getByLabel('Y (Wandobjekte)').fill('180');
    await page.getByRole('button', { name: 'Spawnen', exact: true }).tap();
    await untilPlayground(page, (s) => s.pictures.length === 1);
    expect((await snapshot(page)).layout.objects[0].placement).toEqual({
      mode: 'area',
      x: 300,
      y: 180,
    });
    await page.getByLabel('X', { exact: true }).fill('420');
    await page.getByLabel('Y (Wandobjekte)').fill('200');
    await page.getByRole('button', { name: 'Auswahl verschieben' }).tap();
    await untilPlayground(page, (s) => s.layout.objects[0].placement.x === 420);
    await page.getByRole('button', { name: 'Auswahl entfernen' }).tap();
    await untilPlayground(page, (s) => s.objects.length === 0 && s.pixel.grounded);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
});
