import type { RoomDefinition } from '../definitions.ts';
import type { WallSlots } from '../wall-slots.ts';
import { OBJECTS } from '../objects/catalog.ts';
import { pictureWallVariants } from '../picture-wall-variants.ts';

type Group = NonNullable<RoomDefinition['objectSlots']>[number];
export const STUDY_DESK_SLOTS = {
  id: 'study-desk-items',
  count: { easy: 2, normal: 2, hard: 2 },
  entries: [
    {
      id: 'papers',
      surfaceId: 'study-desk',
      x: 112,
      capacity: 'medium',
      categories: ['decoration'],
      pool: ['study-papers'],
    },
    {
      id: 'pens',
      surfaceId: 'study-desk',
      x: 60,
      capacity: 'medium',
      categories: ['decoration'],
      pool: ['study-pen-cup'],
    },
  ],
} satisfies Group;
export const STUDY_BOOK_SLOTS = {
  id: 'study-books',
  count: { easy: 2, normal: 3, hard: 4 },
  entries: [
    {
      id: 'lower-left',
      surfaceId: 'study-bookcase-lower',
      x: 30,
      capacity: 'medium',
      categories: ['decoration', 'plant'],
      pool: ['reading-books', 'upright-books', 'bedroom-spiderplant'],
    },
    {
      id: 'lower-right',
      surfaceId: 'study-bookcase-lower',
      x: 88,
      capacity: 'medium',
      categories: ['decoration', 'plant'],
      pool: ['reading-books', 'upright-books', 'bedroom-spiderplant'],
    },
    {
      id: 'middle-left',
      surfaceId: 'study-bookcase-middle',
      x: 30,
      capacity: 'medium',
      categories: ['decoration', 'plant'],
      pool: ['reading-books', 'upright-books', 'bedroom-spiderplant'],
    },
    {
      id: 'top',
      surfaceId: 'study-bookcase',
      x: 68,
      capacity: 'medium',
      categories: ['decoration', 'plant'],
      pool: ['reading-books', 'upright-books', 'bedroom-spiderplant'],
    },
  ],
} satisfies Group;
const variants = pictureWallVariants(OBJECTS, 'study');

export const STUDY_WALL_SLOTS = {
  count: { easy: 1, normal: 2, hard: 2 },
  variants,
  entries: [
    {
      id: 'study-desk-picture',
      bounds: { x: 470, y: 40, width: 112, height: 120 },
      capacity: 'large',
      categories: ['picture'],
      pool: Object.keys(variants),
    },
    {
      id: 'study-door-picture',
      bounds: { x: 722, y: 70, width: 112, height: 120 },
      capacity: 'large',
      categories: ['picture'],
      pool: Object.keys(variants),
    },
  ],
} satisfies WallSlots;
