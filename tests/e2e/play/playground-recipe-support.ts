/* eslint-disable max-lines-per-function -- Öffentliche Formularbedienung und Bereitschaftsgrenze bleiben als ein Testaufbau zusammen. */
import { playgroundRecipe } from './playground-recipe-data';
export { playgroundRecipe } from './playground-recipe-data';
import type { Page } from '@playwright/test';
import { snapshot, untilPlayground } from './playground-support';

export async function importPlaygroundRecipe(page: Page, id: string) {
  const recipe = playgroundRecipe(id);

  if (!recipe) throw new Error(`Testaufbau fehlt: ${id}`);
  const generation = (await snapshot(page)).generation;

  await page.getByText('Objekte platzieren / bearbeiten', { exact: true }).click();
  await page.getByText('Aufbau laden / kopieren', { exact: true }).click();
  await page.getByLabel('Aufbaudaten').fill(JSON.stringify(recipe));
  await page.getByRole('button', { name: 'Aufbau laden', exact: true }).click();
  await untilPlayground(
    page,
    (state) => state.generation > generation && state.room.id === id && state.pixel.grounded,
  );
  await page.getByText('Aufbau laden / kopieren', { exact: true }).click();
  await page.getByText('Objekte platzieren / bearbeiten', { exact: true }).click();
  await page.locator('#game').focus();
}
