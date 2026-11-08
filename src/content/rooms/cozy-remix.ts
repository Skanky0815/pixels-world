import { plantSlots } from './plant-slots.ts';
import { bookSlots } from './book-slots.ts';
import { copy } from '../../i18n/locale.ts';
import { LIVING_ROOM } from './living-room.ts';
import type { RoomDefinition } from '../../game/content/definitions.ts';
/** Hand-authored content variant; the game classes are identical. */
export const COZY_REMIX = {
  ...LIVING_ROOM,
  id: 'cozy-remix',
  caption: copy('aCozierCorner'),
  objectSlots: [...bookSlots([865, 910]), plantSlots([54, 62])],
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
    ...LIVING_ROOM.objects.filter((object) => !['plant', 'couch'].includes(object.id)),
  ],
} as const satisfies RoomDefinition;
