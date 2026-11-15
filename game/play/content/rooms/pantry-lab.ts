import { KITCHEN_PREVIEW } from './kitchen-preview.ts';
import type { ObjectInstance, RoomDefinition } from '../definitions.ts';
const object = (
  id: string,
  variant: string,
  x: number,
  surfaceId = 'pantry-shelf',
): ObjectInstance => ({ id, variant, placement: { mode: 'surface', x, surfaceId } });

// eslint-disable-next-line max-lines-per-function -- Isolierte Auflagen und reale Kontaktketten werden mit dem normalen Raumvertrag aufgebaut.
function lab(
  id: string,
  objects: readonly ObjectInstance[],
  fragile = false,
  width = 220,
): RoomDefinition {
  return {
    ...KITCHEN_PREVIEW,
    id,
    wallSlots: undefined,
    objectSlots: [],
    objects,
    spawn: { x: 36, surfaceId: 'pantry-shelf' },
    platforms: [
      {
        id: 'pantry-shelf',
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

export const PANTRY_ROOMS = {
  'pantry-outgoing': lab('pantry-outgoing', [
    object('source', 'pasta-jar', 130),
    object('plant', 'kitchen-basil', 300, 'floor'),
  ]),
  'pantry-jars': lab('pantry-jars', [
    object('first', 'pasta-jar', 130),
    object('second', 'pasta-jar', 190),
  ]),
  'pantry-tins': lab('pantry-tins', [
    object('first', 'biscuit-tin', 130),
    object('second', 'biscuit-tin', 190),
  ]),
  'pantry-mixed': lab('pantry-mixed', [
    object('first', 'pasta-jar', 130),
    object('second', 'biscuit-tin', 190),
    object('plant', 'kitchen-basil', 300, 'floor'),
  ]),
  'pantry-jar-support': lab('pantry-jar-support', [object('supported', 'pasta-jar', 130)], true),
  'pantry-tin-support': lab('pantry-tin-support', [object('supported', 'biscuit-tin', 130)], true),
  'pantry-open-support': lab(
    'pantry-open-support',
    [object('source', 'pasta-jar', 130), object('opened', 'biscuit-tin', 190)],
    true,
  ),
  'pantry-jar-incoming': lab(
    'pantry-jar-incoming',
    [object('source', 'small-vase', 130), object('target', 'pasta-jar', 230, 'floor')],
    false,
    160,
  ),
  'pantry-tin-incoming': lab('pantry-tin-incoming', [
    object('source', 'reading-books', 130),
    object('target', 'biscuit-tin', 178),
  ]),
} satisfies Readonly<Record<string, RoomDefinition>>;
