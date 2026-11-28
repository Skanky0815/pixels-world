import { ASSETS } from '../assets/definitions.ts';
import type { ObjectCatalog } from './definitions.ts';
import type { AlbumRoom } from './album/discovery.ts';
import type { WallSlots } from './wall-slots.ts';

/** Register a picture for a room in its catalogue entry; wall slots need no second motif list. */
export function pictureWallVariants(
  catalog: ObjectCatalog,
  room: AlbumRoom,
): WallSlots['variants'] {
  const pictures = Object.entries(catalog).filter(([, definition]) =>
    roomPicture(definition, room),
  );

  return Object.fromEntries(pictures.map(([key]) => [key, pictureVariant(key)]));
}

function roomPicture(definition: ObjectCatalog[string], room: AlbumRoom) {
  return (
    definition.kind === 'picture' &&
    !definition.album?.previewOnly &&
    definition.album?.rooms.includes(room)
  );
}

function pictureVariant(objectVariant: string) {
  const { width, height } = ASSETS['wall-picture'];

  return { kind: 'picture' as const, asset: 'room-picture' as const, objectVariant, width, height };
}
