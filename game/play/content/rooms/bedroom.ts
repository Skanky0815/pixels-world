import {
  BEDROOM_LOWER_SLOTS,
  BEDROOM_UPPER_SLOTS,
  BEDROOM_BOOK_SLOTS,
  BEDROOM_PLANT_SLOTS,
  BEDROOM_WALL_SLOTS,
} from './bedroom-slots.ts';
import type { Bounds } from '../../interactions/contracts.ts';
import type { Decoration, RoomDefinition } from '../definitions.ts';
import { copy } from '../../../shared/i18n/locale.ts';

const WHITE_TRIM = 0xf1eee5;

// Decorative white casings sit outside the painted sprites; they add no collision.
// eslint-disable-next-line max-lines-per-function -- Die vier dekorativen Leisten bilden zusammen genau eine Fenster-/Türfassung.
function whiteFrame(b: Bounds, bottom = true): readonly Decoration[] {
  return [
    {
      kind: 'rect',
      color: WHITE_TRIM,
      bounds: { x: b.x - 6, y: b.y - 6, width: b.width + 12, height: 6 },
    },
    { kind: 'rect', color: WHITE_TRIM, bounds: { x: b.x - 6, y: b.y, width: 6, height: b.height } },
    {
      kind: 'rect',
      color: WHITE_TRIM,
      bounds: { x: b.x + b.width, y: b.y, width: 6, height: b.height },
    },
    ...(bottom
      ? [
          {
            kind: 'rect' as const,
            color: WHITE_TRIM,
            bounds: { x: b.x - 10, y: b.y + b.height, width: b.width + 20, height: 6 },
          },
        ]
      : []),
  ];
}

/** Hand-built first bedroom. Final raster art preserves the approved support geometry. */
export const BEDROOM = {
  id: 'bedroom',
  environment: 'bedroom',
  caption: copy('bedroomTitle'),
  homecomingSide: 'left',
  dialogue: { side: 'right' },
  width: 960,
  height: 540,
  pixelAsset: 'pixel',
  spawn: { x: 100, surfaceId: 'floor' },
  wallColor: 0x24483b,
  wallSlots: BEDROOM_WALL_SLOTS,
  objectSlots: [BEDROOM_BOOK_SLOTS],
  navigationClearances: [
    { x: 0, y: 416, width: 212, height: 52 },
    { x: 292, y: 340, width: 64, height: 128 },
    { x: 356, y: 164, width: 334, height: 176 },
  ],
  floor: {
    id: 'floor',
    y: 468,
    color: 0x98704e,
    plankColor: 0x775237,
    plankWidth: 96,
    plankHeight: 24,
  },
  goal: {
    id: 'cozy-sleep',
    kind: 'rest',
    albumVariant: 'sleep-pad',
    spawn: { size: 'medium', category: 'rest', random: false, reason: 'main-goal' },
    label: copy('cozySleepPlace'),
    motivation: copy('pixelWantsToRest'),
    surfaceId: 'floor',
    x: 470,
    dwellMs: 1600,
  },
  platforms: [
    {
      id: 'bedroom-lower-shelf',
      asset: 'wood-shelf',
      bounds: { x: 700, y: 270, width: 90, height: 16 },
      durability: { stability: 'normal' },
      slots: BEDROOM_LOWER_SLOTS,
    },
    {
      id: 'bedroom-upper-shelf',
      asset: 'wood-shelf',
      bounds: { x: 580, y: 116, width: 146, height: 16 },
      durability: { stability: 'fragile' },
      slots: BEDROOM_UPPER_SLOTS,
    },
    {
      id: 'nightstand',
      asset: 'wood-shelf',
      appearance: 'nightstand',
      durability: { stability: 'stable' },
      bounds: { x: 220, y: 404, width: 72, height: 64 },
    },
    {
      id: 'bed',
      asset: 'wood-shelf',
      appearance: 'bed',
      durability: { stability: 'stable' },
      bounds: { x: 356, y: 340, width: 264, height: 22 },
    },
    {
      id: 'wardrobe',
      slots: BEDROOM_PLANT_SLOTS,
      asset: 'wood-shelf',
      appearance: 'wardrobe',
      durability: { stability: 'stable' },
      bounds: { x: 800, y: 190, width: 120, height: 278 },
    },
  ],
  decorations: [
    { kind: 'rect', bounds: { x: 184, y: 96, width: 184, height: 4 }, color: WHITE_TRIM },
    { kind: 'rect', bounds: { x: 0, y: 0, width: 960, height: 10 }, color: WHITE_TRIM },
    { kind: 'rect', bounds: { x: 0, y: 10, width: 960, height: 4 }, color: 0xc5c9bb },
    ...whiteFrame({ x: 12, y: 252, width: 112, height: 216 }, false),
    ...whiteFrame({ x: 220, y: 106, width: 112, height: 184 }),
    { kind: 'image', asset: 'bedroom-door', bounds: { x: 12, y: 252, width: 112, height: 216 } },
    { kind: 'image', asset: 'bedroom-window', bounds: { x: 220, y: 106, width: 112, height: 184 } },
  ],
  objects: [
    {
      id: 'bedroom-curtain-left',
      variant: 'short-khaki-curtain',
      placement: { mode: 'area', x: 186, y: 100 },
    },
    {
      id: 'bedroom-curtain-right',
      variant: 'short-khaki-curtain',
      placement: { mode: 'area', x: 326, y: 100 },
    },
    {
      id: 'bedside-lamp',
      variant: 'bedside-lamp',
      placement: { mode: 'surface', x: 278, surfaceId: 'nightstand' },
    },
    {
      id: 'bedroom-runner',
      variant: 'bedroom-runner',
      placement: { mode: 'surface', x: 324, surfaceId: 'floor' },
    },
    {
      id: 'folded-laundry',
      variant: 'folded-laundry',
      placement: { mode: 'surface', x: 562, surfaceId: 'bed' },
    },
    {
      id: 'laundry-basket',
      variant: 'laundry-basket',
      placement: { mode: 'surface', x: 752, surfaceId: 'floor' },
    },
  ],
} as const satisfies RoomDefinition;
