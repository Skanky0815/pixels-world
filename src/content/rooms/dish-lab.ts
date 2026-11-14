import { KITCHEN_PREVIEW } from './kitchen-preview.ts';
import type { ObjectInstance, RoomDefinition } from '../../game/content/definitions.ts';

const object = (
  id: string,
  variant: string,
  x: number,
  surfaceId = 'dish-shelf',
): ObjectInstance => ({
  id,
  variant,
  placement: { mode: 'surface', x, surfaceId },
});

/** Authored contacts use the regular runtime and real keyboard input. */
// eslint-disable-next-line max-lines-per-function -- Der vollständige handgebaute Träger und seine isolierte Belegung bleiben als Fixture zusammen.
function lab(id: string, objects: readonly ObjectInstance[]): RoomDefinition {
  return {
    ...KITCHEN_PREVIEW,
    id,
    wallSlots: undefined,
    objectSlots: [],
    objects,
    spawn: { x: 36, surfaceId: 'dish-shelf' },
    platforms: [
      {
        id: 'dish-shelf',
        asset: 'wood-shelf',
        bounds: { x: 0, y: 300, width: 220, height: 16 },
        durability: { stability: 'stable' },
      },
      ...KITCHEN_PREVIEW.platforms
        .filter((p) => p.id === 'kitchen-counter')
        .map((p) => ({ ...p, slots: undefined })),
    ],
  };
}

export const DISH_ROOMS = {
  'dish-cups': lab('dish-cups', [
    object('first-cup', 'cream-cup', 130),
    object('second-cup', 'cream-cup', 192),
  ]),
  'dish-plates': lab('dish-plates', [
    object('first-plate', 'cream-plate', 130),
    object('second-plate', 'cream-plate', 192),
  ]),
  'dish-mixed': lab('dish-mixed', [
    object('source-cup', 'cream-cup', 130),
    object('target-plate', 'cream-plate', 192),
    object('floor-bag', 'dry-food-bag', 300, 'floor'),
  ]),
  'dish-incoming': lab('dish-incoming', [
    object('source-books', 'reading-books', 130),
    object('target-cup', 'cream-cup', 180),
  ]),
} satisfies Readonly<Record<string, RoomDefinition>>;
