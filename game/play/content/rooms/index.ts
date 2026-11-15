import { FRIDGE_ROOMS } from './fridge-lab.ts';
import { TABLECLOTH_ROOMS } from './tablecloth-lab.ts';
import { TRASH_BIN_ROOMS } from './trash-bin-lab.ts';
import { PANTRY_ROOMS } from './pantry-lab.ts';
import { HERB_ROOMS } from './herb-lab.ts';
import { DISH_ROOMS } from './dish-lab.ts';
import { KITCHEN } from './kitchen.ts';
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
export const ROOMS = {
  kitchen: KITCHEN,
  'living-room': LIVING_ROOM,
  'cozy-remix': COZY_REMIX,
  'kitchen-preview': KITCHEN_PREVIEW,
  ...LAB_ROOMS,
} as const;
export function selectRoom(id: string | null, variants: boolean) {
  if (!variants || !id) return LIVING_ROOM;

  if (!Object.hasOwn(ROOMS, id)) throw new Error(`Unknown room: ${id}`);

  return ROOMS[id as keyof typeof ROOMS];
}
