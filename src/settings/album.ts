import { AlbumCollection } from '../game/album/collection.ts';
import { INTERACTABLE_ALBUM } from '../content/album/index.ts';

function storage() {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

export const albumCollection = new AlbumCollection(
  new Set(Object.values(INTERACTABLE_ALBUM).map((entry) => entry.id)),
  storage(),
);
