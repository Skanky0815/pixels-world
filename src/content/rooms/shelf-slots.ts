import type { RoomDefinition } from '../../game/content/definitions.ts';

/** Die Bücher enden bei lokal x=56; Vasen bleiben mit Abstand rechts daneben. */
export const LOWER_SHELF_SLOTS = {
  count: { easy: 1, normal: 2, hard: 3 },
  entries: [76, 104, 132].map((x, index) => ({
    id: `lower-slot-${index + 1}`,
    x,
    capacity: 'small' as const,
    categories: ['decoration'] as const,
    requiredCapabilities: ['push', 'damage'] as const,
    pool: ['small-vase', 'blue-vase', 'heirloom-vase', 'mellow-vase'],
  })),
} satisfies NonNullable<RoomDefinition['platforms'][number]['slots']>;
