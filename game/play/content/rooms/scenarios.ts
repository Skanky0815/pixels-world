import { BEDROOM } from './bedroom.ts';
import recipes from '../round-recipes.json' with { type: 'json' };
import { buildPlaygroundRecipe, type PlaygroundRecipe } from '../playground-layout.ts';
import { KITCHEN_PREVIEW } from './kitchen-preview.ts';

export const ROUND_RECIPES = recipes as Readonly<
  Record<'fridge-visit' | 'fridge-incoming', PlaygroundRecipe>
>;
export const ROUND_SCENARIOS = {
  bedroom: BEDROOM,
  'kitchen-preview': KITCHEN_PREVIEW,
  'fridge-visit': buildPlaygroundRecipe(ROUND_RECIPES['fridge-visit']),
  'fridge-incoming': buildPlaygroundRecipe(ROUND_RECIPES['fridge-incoming']),
} as const;

export function roundScenario(id: string) {
  if (!Object.hasOwn(ROUND_SCENARIOS, id)) throw new Error(`Unknown round scenario: ${id}`);

  return ROUND_SCENARIOS[id as keyof typeof ROUND_SCENARIOS];
}
