import { copy } from '../../i18n/locale.ts';
import { LIVING_ROOM } from './living-room.ts';
import type { RoomDefinition } from '../../game/content/definitions.ts';
/** Hand-authored content variant; the game classes are identical. */
export const COZY_REMIX = {
  ...LIVING_ROOM,
  id: 'cozy-remix',
  caption: copy('aCozierCorner'),
  objects: [
    {
      id: 'couch',
      variant: 'worn-couch',
      placement: { mode: 'surface', x: 200, surfaceId: 'floor' },
    },
    {
      id: 'reading-couch',
      variant: 'worn-couch',
      placement: { mode: 'surface', x: 480, surfaceId: 'floor' },
    },
    ...LIVING_ROOM.objects
      .slice(1)
      .filter((object) => object.id !== 'small-vase' && object.id !== 'plant'),
    { id: 'plant', variant: 'catgrass', placement: { mode: 'surface', x: 62, surfaceId: 'floor' } },
    {
      id: 'small-vase',
      variant: 'mellow-vase',
      placement: { mode: 'surface', x: 600, surfaceId: 'lower-shelf' },
    },
  ],
} as const satisfies RoomDefinition;
