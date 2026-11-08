import type { ChaosEvent } from '../../game/domain/chaos-event.ts';
import { PICTURE_ALBUM } from './pictures.ts';
import { CARPET_ALBUM } from './carpet.ts';
import { albumDiscovery } from './discovery.ts';
export const INTERACTABLE_ALBUM = { ...PICTURE_ALBUM, ...CARPET_ALBUM } as const;
export function discoverAlbum(event: ChaosEvent, variant: string) {
  return albumDiscovery(event, variant, INTERACTABLE_ALBUM);
}
