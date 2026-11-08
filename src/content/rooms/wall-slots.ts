import type { WallSlots } from '../../game/content/wall-slots.ts';

/** Der feste Zielweg bleibt unverändert; diese Bereiche liegen außerhalb seiner Sprünge. */
export const WALL_SLOTS = {
  count: { easy: 1, normal: 1, hard: 2 },
  variants: {
    family: { kind: 'picture', asset: 'room-picture', width: 108, height: 112 },
    spareShelf: {
      kind: 'shelf',
      asset: 'wood-shelf',
      width: 80,
      height: 16,
      durability: { stability: 'fragile' },
    },
  },
  entries: [
    {
      id: 'wall:left',
      bounds: { x: 20, y: 82, width: 120, height: 112 },
      capacity: 'large',
      categories: ['picture', 'shelf'],
      pool: ['family', 'spareShelf'],
    },
    {
      id: 'wall:sofa',
      bounds: { x: 274, y: 66, width: 124, height: 128 },
      capacity: 'large',
      categories: ['picture'],
      pool: ['family'],
    },
    {
      id: 'wall:high',
      bounds: { x: 414, y: 28, width: 84, height: 72 },
      capacity: 'medium',
      categories: ['shelf'],
      pool: ['spareShelf'],
    },
  ],
} as const satisfies WallSlots;
