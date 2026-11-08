import type { AlbumCatalog } from './discovery.ts';
export const CARPET_ALBUM = {
  'living-room-rug': {
    id: 'carpet.hairball',
    asset: 'hairball',
    condition: { kind: 'hairball', stage: 1 },
    fluff: {
      de: 'Ein ganzer Raum. Ein einziger Teppich. Natürlich genau dort.',
      en: 'A whole room. Just one rug. Of course, right there.',
    },
    sara: {
      de: 'Pixel, die Dielen waren alle frei.',
      en: 'Pixel, every floorboard was available.',
    },
  },
} as const satisfies AlbumCatalog;
