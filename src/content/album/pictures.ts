import { OBJECTS } from '../objects/catalog.ts';
import { albumDiscovery, type AlbumCatalog, type AlbumDiscovery } from './discovery.ts';
import type { ChaosEvent } from '../../game/domain/chaos-event.ts';
/** Daten und Ereignisgrenze für #210; Speicherung und Fortschrittsanzeige gehören dem gemeinsamen Album. */
export const PICTURE_ALBUM = {
  'pixel-portrait': OBJECTS['pixel-portrait'].album,
  'berlin-tower': OBJECTS['berlin-tower'].album,
  'cozy-nook': OBJECTS['cozy-nook'].album,
} as const satisfies AlbumCatalog;
export function pictureDiscovery(event: ChaosEvent, variant: string): AlbumDiscovery | null {
  return albumDiscovery(event, variant, PICTURE_ALBUM);
}
