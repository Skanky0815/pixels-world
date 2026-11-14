import { KITCHEN_PREVIEW } from './kitchen-preview.ts';
import type { ObjectInstance, RoomDefinition } from '../../game/content/definitions.ts';
const object = (
  id: string,
  variant: string,
  x: number,
  surfaceId = 'herb-shelf',
): ObjectInstance => ({ id, variant, placement: { mode: 'surface', x, surfaceId } });

// eslint-disable-next-line max-lines-per-function -- Die handgebaute Auflage und isolierten realen Kontakte bilden jeweils eine vollständige Fixture.
function lab(
  id: string,
  objects: readonly ObjectInstance[],
  fragile = false,
  spawn = 150,
  width = 220,
): RoomDefinition {
  return {
    ...KITCHEN_PREVIEW,
    id,
    wallSlots: undefined,
    objectSlots: [],
    objects,
    spawn: { x: spawn, surfaceId: 'herb-shelf' },
    platforms: [
      {
        id: 'herb-shelf',
        asset: 'wood-shelf',
        bounds: { x: 0, y: 300, width, height: 16 },
        durability: { stability: fragile ? 'fragile' : 'stable' },
      },
      ...KITCHEN_PREVIEW.platforms
        .filter((p) => p.id === 'kitchen-counter')
        .map((p) => ({ ...p, slots: undefined })),
    ],
  };
}

export const HERB_ROOMS = {
  'herb-basil': lab('herb-basil', [object('herb', 'kitchen-basil', 130)]),
  'herb-parsley': lab('herb-parsley', [object('herb', 'kitchen-parsley', 130)]),
  'herb-mint': lab('herb-mint', [object('herb', 'kitchen-mint', 130)]),
  'herb-support': lab(
    'herb-support',
    [
      object('falling-herb', 'kitchen-basil', 120),
      object('floor-herb', 'kitchen-mint', 80, 'floor'),
    ],
    true,
    36,
  ),
  'herb-incoming': lab(
    'herb-incoming',
    [object('vase', 'small-vase', 130), object('herb', 'kitchen-parsley', 220, 'floor')],
    false,
    36,
    160,
  ),
  'herb-outgoing': lab('herb-outgoing', [
    object('herb', 'kitchen-mint', 130),
    object('cup', 'cream-cup', 80),
  ]),
} satisfies Readonly<Record<string, RoomDefinition>>;
