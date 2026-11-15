import fixtures from '../support/fixtures/playground-recipes.json' with { type: 'json' };
import { ROUND_RECIPES } from '../../../game/play/content/rooms/scenarios.ts';
import type { PlaygroundRecipe } from '../../../game/play/content/playground-layout';
import type { RoomDefinition } from '../../../game/play/content/definitions';
type Fixture = Omit<PlaygroundRecipe, 'platforms'> & { supports: string };
const recipes = fixtures.recipes as unknown as Readonly<Record<string, Fixture>>;
const supports = fixtures.layouts as unknown as Readonly<
  Record<string, RoomDefinition['platforms']>
>;

export function playgroundRecipe(id: string): PlaygroundRecipe | undefined {
  if (Object.hasOwn(ROUND_RECIPES, id)) return ROUND_RECIPES[id as keyof typeof ROUND_RECIPES];

  if (!Object.hasOwn(recipes, id)) return undefined;
  const { supports: key, ...recipe } = recipes[id];

  return { ...recipe, platforms: supports[key] };
}

export const playgroundRecipeIds = [...Object.keys(recipes), ...Object.keys(ROUND_RECIPES)];
