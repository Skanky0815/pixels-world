import { KITCHEN_PREVIEW } from './kitchen-preview.ts';
import type { ObjectInstance, RoomDefinition } from '../../game/content/definitions.ts';

const object = (id: string, variant: string, x: number, surfaceId = 'floor'): ObjectInstance => ({
  id,
  variant,
  placement: { mode: 'surface', x, surfaceId },
});

const supports = KITCHEN_PREVIEW.platforms.map((p) => ({ ...p, slots: undefined }));

function lab(id: string, objects: readonly ObjectInstance[]): RoomDefinition {
  return {
    ...KITCHEN_PREVIEW,
    id,
    wallSlots: undefined,
    objectSlots: [],
    platforms: supports,
    objects,
  };
}

/** Authored DEV contacts use real keyboard routes and real adapters, never state setters. */
export const FOOD_BAG_ROOMS = {
  'food-bag-warning': {
    ...lab('food-bag-warning', [object('warning-bag', 'dry-food-bag', 180)]),
    spawn: { x: 180, surfaceId: 'floor' },
  },
  'food-bag-chain': lab('food-bag-chain', [
    object('first-bag', 'dry-food-bag', 430),
    object('second-bag', 'dry-food-bag', 472),
    object('target-books', 'reading-books', 526),
  ]),
  'food-bag-impact': lab('food-bag-impact', [
    object('source-books', 'reading-books', 440),
    object('target-bag', 'dry-food-bag', 492),
  ]),
  'food-bag-support': {
    ...lab('food-bag-support', [object('shelf-bag', 'dry-food-bag', 120, 'bag-shelf')]),
    spawn: { x: 36, surfaceId: 'bag-shelf' },
    platforms: [
      ...supports,
      {
        id: 'bag-shelf',
        asset: 'wood-shelf',
        durability: { stability: 'fragile' },
        bounds: { x: 0, y: 340, width: 180, height: 16 },
      },
    ],
  },
} satisfies Readonly<Record<string, RoomDefinition>>;
