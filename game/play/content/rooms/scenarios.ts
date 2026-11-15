import { FRIDGE_ROOMS } from './fridge-lab.ts';
import { TABLECLOTH_ROOMS } from './tablecloth-lab.ts';
import { TRASH_BIN_ROOMS } from './trash-bin-lab.ts';
import { PANTRY_ROOMS } from './pantry-lab.ts';
import { HERB_ROOMS } from './herb-lab.ts';
import { DISH_ROOMS } from './dish-lab.ts';
import { FOOD_BAG_ROOMS } from './food-bag-lab.ts';
import { IMPACT_ROOMS } from './impact-lab.ts';
import { LIVING_ROOM } from './living-room.ts';
import { COZY_REMIX } from './cozy-remix.ts';
import { KITCHEN_PREVIEW } from './kitchen-preview.ts';

export const LAB_ROOMS = {
  ...IMPACT_ROOMS,
  ...FOOD_BAG_ROOMS,
  ...DISH_ROOMS,
  ...HERB_ROOMS,
  ...PANTRY_ROOMS,
  ...TRASH_BIN_ROOMS,
  ...TABLECLOTH_ROOMS,
  ...FRIDGE_ROOMS,
} as const;

/** Reusable fixtures; never part of the regular room URL catalogue. */
export const PLAYGROUND_SCENARIOS = {
  'living-room': LIVING_ROOM,
  'cozy-remix': COZY_REMIX,
  'kitchen-preview': KITCHEN_PREVIEW,
  ...LAB_ROOMS,
} as const;

/** Only fixtures that exercise complete rounds belong in the game. */
export const ROUND_SCENARIOS = {
  'kitchen-preview': KITCHEN_PREVIEW,
  'fridge-visit': FRIDGE_ROOMS['fridge-visit'],
  'fridge-incoming': FRIDGE_ROOMS['fridge-incoming'],
} as const;

export function roundScenario(id: string) {
  if (!Object.hasOwn(ROUND_SCENARIOS, id)) throw new Error(`Unknown round scenario: ${id}`);

  return ROUND_SCENARIOS[id as keyof typeof ROUND_SCENARIOS];
}
