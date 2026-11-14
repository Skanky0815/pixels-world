import type { RoomDefinition } from '../../game/content/definitions.ts';
import type { WallSlots } from '../../game/content/wall-slots.ts';
import { WALL_SLOTS } from './wall-slots.ts';

type SurfaceSlots = NonNullable<RoomDefinition['platforms'][number]['slots']>;
const decoration = { capacity: 'medium', categories: ['decoration'], pool: [] } as const;

/** Real validated slots; kitchen-specific pools are enabled with their object issues. */
const dishes = ['cream-cup', 'cream-plate'] as const;

export const KITCHEN_TABLE_SLOTS = {
  count: { easy: 1, normal: 1, hard: 1 },
  entries: [{ ...decoration, id: 'table-1', x: 204, pool: dishes }],
} satisfies SurfaceSlots;

/** The left landing and the counter from world x=800 onwards stay clear. */
export const KITCHEN_COUNTER_SLOTS = {
  count: { easy: 1, normal: 1, hard: 1 },
  entries: [{ ...decoration, id: 'counter-1', x: 124, pool: dishes }],
} satisfies SurfaceSlots;

export const KITCHEN_WALL_SHELF_SLOTS = {
  count: { easy: 1, normal: 2, hard: 3 },
  entries: [24, 68, 112].map((x, index) => ({
    ...decoration,
    id: `pantry-${index + 1}`,
    x,
    pool: dishes,
  })),
} satisfies SurfaceSlots;

export const KITCHEN_DOOR_SHELF_SLOTS = {
  count: { easy: 1, normal: 1, hard: 2 },
  entries: [20, 52, 84].map((x, index) => ({
    ...decoration,
    id: `door-${index + 1}`,
    capacity: 'small' as const,
    x,
    pool: dishes,
  })),
} satisfies SurfaceSlots;

export const KITCHEN_FLOOR_SLOTS = [
  {
    id: 'kitchen-floor-content',
    count: { easy: 1, normal: 1, hard: 1 },
    entries: [
      {
        id: 'bin',
        surfaceId: 'floor',
        x: 560,
        capacity: 'medium',
        categories: ['furniture'],
        pool: [],
      },
      {
        id: 'food-bag',
        surfaceId: 'floor',
        x: 430,
        capacity: 'medium',
        categories: ['decoration'],
        pool: ['dry-food-bag'],
      },
    ],
  },
] as const satisfies NonNullable<RoomDefinition['objectSlots']>;

/** Pictures vary; fixed shelves and the goal route never depend on a wall lottery. */
export const KITCHEN_WALL_SLOTS = {
  count: { easy: 1, normal: 2, hard: 2 },
  variants: {
    pixelPortrait: WALL_SLOTS.variants.pixelPortrait,
    berlinTower: WALL_SLOTS.variants.berlinTower,
    cozyNook: WALL_SLOTS.variants.cozyNook,
  },
  entries: [
    {
      id: 'kitchen-picture-left',
      bounds: { x: 128, y: 128, width: 120, height: 128 },
      capacity: 'large',
      categories: ['picture'],
      pool: ['pixelPortrait', 'berlinTower', 'cozyNook'],
    },
    {
      id: 'kitchen-picture-high',
      bounds: { x: 278, y: 22, width: 132, height: 132 },
      capacity: 'large',
      categories: ['picture'],
      pool: ['pixelPortrait', 'berlinTower', 'cozyNook'],
    },
  ],
} as const satisfies WallSlots;
