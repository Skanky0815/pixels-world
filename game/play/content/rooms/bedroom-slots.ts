import type { RoomDefinition } from '../definitions.ts';
import type { WallSlots } from '../wall-slots.ts';
import { OBJECTS } from '../objects/catalog.ts';
import { pictureWallVariants } from '../picture-wall-variants.ts';

type SurfaceSlots = NonNullable<RoomDefinition['platforms'][number]['slots']>;
const VASES = ['small-vase', 'blue-vase', 'heirloom-vase', 'mellow-vase'];

export const BEDROOM_LOWER_SLOTS = {
  count: { easy: 1, normal: 2, hard: 3 },
  entries: [20, 48, 76].map((x, index) => ({
    id: `bedroom-lower-${index + 1}`,
    x,
    capacity: 'small' as const,
    categories: ['decoration'] as const,
    requiredCapabilities: ['push', 'damage'] as const,
    pool: VASES,
  })),
} satisfies SurfaceSlots;

export const BEDROOM_UPPER_SLOTS = {
  count: { easy: 0, normal: 1, hard: 2 },
  entries: [76, 104, 132].map((x, index) => ({
    id: `bedroom-upper-${index + 1}`,
    x,
    capacity: 'small' as const,
    categories: ['decoration'] as const,
    requiredCapabilities: ['push', 'damage'] as const,
    pool: VASES,
  })),
} satisfies SurfaceSlots;

export const BEDROOM_BOOK_SLOTS = {
  id: 'bedroom-books',
  count: { easy: 1, normal: 1, hard: 1 },
  entries: [
    {
      id: 'reading-pile',
      surfaceId: 'bedroom-upper-shelf',
      x: 24,
      capacity: 'medium',
      categories: ['decoration'],
      pool: ['reading-books', 'upright-books'],
    },
  ],
} satisfies NonNullable<RoomDefinition['objectSlots']>[number];

export const BEDROOM_PLANT_SLOTS = {
  count: { easy: 1, normal: 1, hard: 1 },
  entries: [
    {
      id: 'wardrobe-plant',
      x: 70,
      capacity: 'medium',
      categories: ['plant'],
      requiredCapabilities: ['automatic', 'damage'],
      pool: ['bedroom-spiderplant'],
    },
  ],
} satisfies SurfaceSlots;

const variants = pictureWallVariants(OBJECTS, 'bedroom');
const picturePool = Object.keys(variants);

export const BEDROOM_WALL_SLOTS = {
  count: { easy: 1, normal: 2, hard: 2 },
  variants,
  entries: [
    {
      id: 'bedroom-picture-door',
      bounds: { x: 74, y: 96, width: 112, height: 120 },
      capacity: 'large',
      categories: ['picture'],
      pool: picturePool,
    },
    {
      id: 'bedroom-picture-bed',
      bounds: { x: 406, y: 48, width: 112, height: 120 },
      capacity: 'large',
      categories: ['picture'],
      pool: picturePool,
    },
  ],
} satisfies WallSlots;
