import { KITCHEN_PREVIEW } from './kitchen-preview.ts';
import type { ObjectInstance, RoomDefinition } from '../../game/content/definitions.ts';
const object = (id: string, variant: string, x: number, surfaceId = 'floor'): ObjectInstance => ({
  id,
  variant,
  placement: { mode: 'surface', x, surfaceId },
});

function lab(id: string, objects: readonly ObjectInstance[]): RoomDefinition {
  return {
    ...KITCHEN_PREVIEW,
    id,
    wallSlots: undefined,
    objectSlots: [],
    objects,
    platforms: KITCHEN_PREVIEW.platforms.map((p) => ({ ...p, slots: undefined })),
  };
}

export const TRASH_BIN_ROOMS = {
  'bin-warning': {
    ...lab('bin-warning', [object('bin', 'cream-trash-bin', 180)]),
    spawn: { x: 180, surfaceId: 'floor' },
  },
  'bin-chain': lab('bin-chain', [
    object('first-bin', 'cream-trash-bin', 430),
    object('second-bin', 'cream-trash-bin', 488),
    object('target-books', 'reading-books', 548),
  ]),
  'bin-incoming': {
    ...lab('bin-incoming', [
      object('source-jar', 'pasta-jar', 130, 'bin-shelf'),
      object('target-bin', 'cream-trash-bin', 300),
    ]),
    spawn: { x: 36, surfaceId: 'bin-shelf' },
    platforms: [
      {
        id: 'bin-shelf',
        asset: 'wood-shelf',
        bounds: { x: 0, y: 300, width: 220, height: 16 },
        durability: { stability: 'stable' },
      },
      ...KITCHEN_PREVIEW.platforms
        .filter((p) => p.id === 'kitchen-counter')
        .map((p) => ({ ...p, slots: undefined })),
    ],
  },
  'bin-outgoing': lab('bin-outgoing', [
    object('source-bin', 'cream-trash-bin', 430),
    object('target-plant', 'kitchen-basil', 488),
  ]),
} satisfies Readonly<Record<string, RoomDefinition>>;
