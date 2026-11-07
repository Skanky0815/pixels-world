import { copy } from '../../i18n/locale.ts';
import type { Decoration, RoomDefinition } from '../../game/content/definitions.ts';
const FLOOR_Y = 468;
const rect = (x: number, y: number, width: number, height: number, color: number): Decoration => ({
  kind: 'rect',
  bounds: { x, y, width, height },
  color,
});
// These helpers only produce static data; there are no executable rules in a room.
const decorations: readonly Decoration[] = [
  rect(0, 0, 960, 14, 0x927660),
  ...Array.from({ length: 15 }, (_, i) => rect(32 + i * 64, 14, 2, 440, 0xc4a789)),
  rect(0, 340, 960, FLOOR_Y - 354, 0xa68a72),
  ...Array.from({ length: 20 }, (_, i) => rect(i * 48, 344, 2, FLOOR_Y - 358, 0x947963)),
  rect(0, FLOOR_Y - 14, 960, 14, 0x705547),
  rect(700, 90, 164, 240, 0x705547),
  rect(708, 98, 148, 224, 0x91b1af),
  rect(714, 104, 134, 100, 0xb0c6b8),
  rect(777, 98, 8, 224, 0xe4d0ab),
  rect(708, 205, 148, 8, 0xe4d0ab),
  rect(730, 101, 140, 10, 0x59443d),
  rect(536, 270, 12, 34, 0xa7614e),
  rect(550, 278, 10, 26, 0x778775),
  rect(562, 266, 12, 38, 0xc6a36e),
  rect(282, 112, 108, 112, 0x795a43),
  rect(290, 120, 92, 96, 0xefe0ba),
  rect(302, 168, 68, 36, 0xa0a486),
  rect(322, 146, 28, 28, 0xd1a167),
  rect(245, 493, 430, 30, 0xbe906c),
  rect(255, 501, 410, 3, 0xddba8b),
  { kind: 'text', x: 525, y: 336, text: copy('shelves'), size: 10, color: 0x725b46 },
];

export const LIVING_ROOM = {
  id: 'living-room',
  goal: {
    id: 'favorite-ball',
    kind: 'toy',
    label: copy('favouriteBall'),
    motivation: copy('pixelWantsToPlayFindThe'),
    surfaceId: 'upper-shelf',
    x: 866,
    dwellMs: 1200,
  },
  caption: copy('theLivingRoom'),
  width: 960,
  height: 540,
  pixelAsset: 'pixel',
  spawn: { x: 110, surfaceId: 'floor' },
  wallColor: 0xcbb192,
  floor: {
    id: 'floor',
    y: FLOOR_Y,
    color: 0x9f7154,
    plankColor: 0x865c47,
    plankWidth: 96,
    plankHeight: 24,
  },
  platforms: [
    { id: 'lower-shelf', bounds: { x: 518, y: 304, width: 146, height: 16 }, asset: 'wood-shelf' },
    { id: 'middle-shelf', bounds: { x: 648, y: 224, width: 96, height: 16 }, asset: 'wood-shelf' },
    { id: 'upper-shelf', bounds: { x: 856, y: 154, width: 80, height: 16 }, asset: 'wood-shelf' },
  ],
  decorations,
  objects: [
    {
      id: 'couch',
      variant: 'cozy-couch',
      placement: { mode: 'surface', x: 180, surfaceId: 'floor' },
    },
    { id: 'curtain', variant: 'warm-curtain', placement: { mode: 'area', x: 744, y: 112 } },
    { id: 'plant', variant: 'catgrass', placement: { mode: 'surface', x: 82, surfaceId: 'floor' } },
    {
      id: 'small-vase',
      variant: 'small-vase',
      placement: { mode: 'surface', x: 620, surfaceId: 'lower-shelf' },
    },
    {
      id: 'blue-vase',
      variant: 'blue-vase',
      placement: { mode: 'surface', x: 710, surfaceId: 'middle-shelf' },
    },
    {
      id: 'heirloom-vase',
      variant: 'heirloom-vase',
      placement: { mode: 'surface', x: 906, surfaceId: 'upper-shelf' },
    },
  ],
} as const satisfies RoomDefinition;
