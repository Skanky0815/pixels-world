import { KITCHEN_PREVIEW } from './kitchen-preview.ts';
import type { RoomDefinition } from '../../game/content/definitions.ts';

const visit: RoomDefinition = {
  ...KITCHEN_PREVIEW,
  id: 'fridge-visit',
  width: 1320,
  wallSlots: undefined,
  objectSlots: [],
  spawn: { x: 1000, surfaceId: 'floor' },
  platforms: KITCHEN_PREVIEW.platforms.map((p) => ({
    ...p,
    slots: undefined,
    ...(p.id === 'kitchen-fridge' ? { bounds: { x: 1040, y: 148, width: 160, height: 320 } } : {}),
  })),
  objects: [
    {
      id: 'top-tin',
      variant: 'biscuit-tin',
      placement: { mode: 'surface', x: 1120, surfaceId: 'kitchen-fridge' },
    },
  ],
};

export const FRIDGE_ROOMS = {
  'fridge-visit': visit,
  'fridge-right': { ...visit, id: 'fridge-right', spawn: { x: 1240, surfaceId: 'floor' } },
  'fridge-incoming': {
    ...visit,
    id: 'fridge-incoming',
    spawn: { x: 930, surfaceId: 'source-shelf' },
    platforms: [
      ...visit.platforms,
      {
        id: 'source-shelf',
        asset: 'wood-shelf',
        bounds: { x: 900, y: 64, width: 100, height: 16 },
        durability: { stability: 'stable' },
      },
    ],
    objects: [
      {
        id: 'source-jar',
        variant: 'pasta-jar',
        placement: { mode: 'surface', x: 978, surfaceId: 'source-shelf' },
      },
    ],
  },
} satisfies Readonly<Record<string, RoomDefinition>>;
