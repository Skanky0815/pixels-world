import { KITCHEN_PREVIEW } from './kitchen-preview.ts';
import type { ObjectInstance, RoomDefinition } from '../../game/content/definitions.ts';
const object = (
  id: string,
  variant: string,
  x: number,
  surfaceId = 'kitchen-table',
): ObjectInstance => ({ id, variant, placement: { mode: 'surface', x, surfaceId } });
const objects = [
  object('cloth', 'warm-tablecloth', 450),
  object('first-cup', 'cream-cup', 544),
  object('second-plate', 'cream-plate', 356),
];

// eslint-disable-next-line max-lines-per-function -- Die isolierte Tischszene behält echte Auflagen und dieselben Adapter bei freier Startposition.
function lab(id: string): RoomDefinition {
  return {
    ...KITCHEN_PREVIEW,
    id,
    wallSlots: undefined,
    objectSlots: [],
    spawn: { x: 470, surfaceId: 'floor' },
    objects,
    platforms: KITCHEN_PREVIEW.platforms.map((p) => ({ ...p, slots: undefined })),
  };
}

export const TABLECLOTH_ROOMS = {
  'cloth-chain': lab('cloth-chain'),
  'cloth-left': { ...lab('cloth-left'), spawn: { x: 260, surfaceId: 'kitchen-stool' } },
  'cloth-warning': { ...lab('cloth-warning'), spawn: { x: 530, surfaceId: 'floor' } },
  'cloth-incoming': {
    ...lab('cloth-incoming'),
    spawn: { x: 330, surfaceId: 'upper-shelf' },
    objects: [
      ...objects.filter((item) => item.id !== 'first-cup'),
      object('source-jar', 'pasta-jar', 430, 'upper-shelf'),
    ],
    platforms: [
      ...lab('cloth-incoming').platforms,
      {
        id: 'upper-shelf',
        asset: 'wood-shelf',
        bounds: { x: 300, y: 180, width: 160, height: 16 },
        durability: { stability: 'stable' },
      },
    ],
  },
  'cloth-support': {
    ...lab('cloth-support'),
    spawn: { x: 450, surfaceId: 'kitchen-table' },
    platforms: lab('cloth-support').platforms.map((p) =>
      p.id === 'kitchen-table'
        ? { ...p, appearance: undefined, durability: { stability: 'fragile' } }
        : p,
    ),
  },
  'cloth-pair': {
    ...lab('cloth-pair'),
    spawn: { x: 310, surfaceId: 'floor' },
    objects: [
      object('first-cloth', 'warm-tablecloth', 230),
      object('second-cloth', 'warm-tablecloth', 450),
    ],
    platforms: lab('cloth-pair').platforms.map((p) =>
      p.id === 'kitchen-table'
        ? { ...p, appearance: undefined, bounds: { x: 120, y: 328, width: 440, height: 14 } }
        : p,
    ),
  },
} satisfies Readonly<Record<string, RoomDefinition>>;
