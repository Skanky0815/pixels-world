import { LIVING_ROOM } from './living-room.ts';
import type { RoomDefinition } from '../../game/content/definitions.ts';
import type { AlbumRoom } from '../album/discovery.ts';
import { copy } from '../../i18n/locale.ts';

interface RoomChoice {
  readonly id: AlbumRoom;
  readonly name: string;
  readonly definition?: RoomDefinition;
}

/** Public availability is separate from DEV fixtures and the physical room data. */
export const ROOM_CHOICES: readonly RoomChoice[] = [
  { id: LIVING_ROOM.id, name: copy('albumLivingRoom'), definition: LIVING_ROOM },
  { id: 'kitchen', name: copy('albumKitchen') },
  { id: 'bedroom', name: copy('albumBedroom') },
  { id: 'study', name: copy('albumStudy') },
];

export function playableRoom(id: string) {
  return ROOM_CHOICES.find((choice) => choice.id === id)?.definition;
}
