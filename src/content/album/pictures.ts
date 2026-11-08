import { albumDiscovery, type AlbumCatalog, type AlbumDiscovery } from './discovery.ts';
import type { ChaosEvent } from '../../game/domain/chaos-event.ts';
/** Daten und Ereignisgrenze für #210; Speicherung und Fortschrittsanzeige gehören dem gemeinsamen Album. */
export const PICTURE_ALBUM = {
  'pixel-portrait': {
    id: 'picture.pixel',
    asset: 'picture-pixel',
    condition: { kind: 'picture-fall', stage: 1 },
    fluff: { de: 'Kunstkritik mit Pfoteneinsatz.', en: 'Art criticism, paws first.' },
    sara: {
      de: 'Pixel, das war ein Porträt. Kein Spiegelgegner.',
      en: 'Pixel, that was a portrait. Not a mirror rival.',
    },
  },
  'berlin-tower': {
    id: 'picture.berlin',
    asset: 'picture-berlin',
    condition: { kind: 'picture-fall', stage: 1 },
    fluff: {
      de: 'Der Fernsehturm steht jetzt eine Etage tiefer.',
      en: 'The TV tower has moved down a floor.',
    },
    sara: {
      de: 'Die Berliner Skyline hing vorher höher.',
      en: 'The Berlin skyline used to hang higher.',
    },
  },
  'cozy-nook': {
    id: 'picture.cozy',
    asset: 'picture-cozy',
    condition: { kind: 'picture-fall', stage: 1 },
    fluff: {
      de: 'Ein Stillleben mit sehr bewegtem Rahmen.',
      en: 'A still life with a very lively frame.',
    },
    sara: {
      de: 'Gemütlich war es auch schon an der Wand.',
      en: 'It was perfectly cozy on the wall, too.',
    },
  },
} as const satisfies AlbumCatalog;
export function pictureDiscovery(event: ChaosEvent, variant: string): AlbumDiscovery | null {
  return albumDiscovery(event, variant, PICTURE_ALBUM);
}
