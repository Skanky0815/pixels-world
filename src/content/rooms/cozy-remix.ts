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
    ...LIVING_ROOM.objects.filter((object) => !['plant', 'couch', 'books'].includes(object.id)),
    {
      id: 'books',
      variant: 'reading-books',
      placement: { mode: 'surface', x: 865, surfaceId: 'floor' },
    },
    { id: 'plant', variant: 'catgrass', placement: { mode: 'surface', x: 62, surfaceId: 'floor' } },
  ],
} as const satisfies RoomDefinition;
