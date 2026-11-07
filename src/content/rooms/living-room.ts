import { LOWER_SHELF_SLOTS, MIDDLE_SHELF_SLOTS } from './shelf-slots.ts';
import { LIVING_ROOM_DENSITY } from '../difficulty.ts';
import { copy } from '../../i18n/locale.ts';
import type { Decoration, RoomDefinition } from '../../game/content/definitions.ts';
const FLOOR_Y = 468;

const decorations: readonly Decoration[] = [
  { kind: 'image', asset: 'room-window', bounds: { x: 682, y: 126, width: 112, height: 184 } },
  { kind: 'image', asset: 'room-picture', bounds: { x: 282, y: 112, width: 108, height: 112 } },
  { kind: 'image', asset: 'room-rug', bounds: { x: 245, y: 493, width: 430, height: 30 } },
  { kind: 'image', asset: 'room-door', bounds: { x: 848, y: 252, width: 112, height: 216 } },
];

export const LIVING_ROOM = {
  id: 'living-room',
  environment: 'cozy-room',
  difficultyObjects: LIVING_ROOM_DENSITY,
  goal: {
    id: 'favorite-ball',
    kind: 'toy',
    spawn: { size: 'small', category: 'toy', random: false, reason: 'main-goal' },
    label: copy('favouriteBall'),
    motivation: copy('pixelWantsToPlayFindThe'),
    surfaceId: 'upper-shelf',
    x: 850,
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
    {
      id: 'lower-shelf',
      durability: { stability: 'fragile' },
      slots: LOWER_SHELF_SLOTS,
      bounds: { x: 502, y: 304, width: 146, height: 16 },
      asset: 'wood-shelf',
    },
    {
      id: 'middle-shelf',
      slots: MIDDLE_SHELF_SLOTS,
      durability: { stability: 'normal' },
      bounds: { x: 584, y: 224, width: 96, height: 16 },
      asset: 'wood-shelf',
    },
    {
      id: 'upper-shelf',
      durability: { stability: 'stable' },
      bounds: { x: 840, y: 154, width: 80, height: 16 },
      asset: 'wood-shelf',
    },
  ],
  decorations,
  objects: [
    {
      id: 'couch',
      variant: 'cozy-couch',
      placement: { mode: 'surface', x: 180, surfaceId: 'floor' },
    },
    { id: 'curtain', variant: 'warm-curtain', placement: { mode: 'area', x: 728, y: 112 } },
    { id: 'plant', variant: 'catgrass', placement: { mode: 'surface', x: 82, surfaceId: 'floor' } },
    {
      id: 'heirloom-vase',
      variant: 'heirloom-vase',
      placement: { mode: 'surface', x: 890, surfaceId: 'upper-shelf' },
    },
  ],
} as const satisfies RoomDefinition;
