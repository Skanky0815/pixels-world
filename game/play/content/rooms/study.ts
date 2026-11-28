import type { RoomDefinition } from '../definitions.ts';
import { copy } from '../../../shared/i18n/locale.ts';
import { STUDY_DESK_SLOTS, STUDY_BOOK_SLOTS, STUDY_WALL_SLOTS } from './study-slots.ts';

/** Approved study: lowered desk, nerd furniture and entrance on the right. */
export const STUDY = {
  id: 'study',
  caption: copy('studyTitle'),
  width: 960,
  height: 540,
  pixelAsset: 'pixel',
  homecomingSide: 'right',
  dialogue: { side: 'left' },
  spawn: { x: 860, surfaceId: 'floor' },
  wallColor: 0x46545a,
  floor: {
    id: 'floor',
    y: 468,
    color: 0x98704e,
    plankColor: 0x775237,
    plankWidth: 96,
    plankHeight: 24,
  },
  wallSlots: STUDY_WALL_SLOTS,
  objectSlots: [STUDY_DESK_SLOTS, STUDY_BOOK_SLOTS],
  navigationClearances: [
    { x: 770, y: 416, width: 190, height: 52 },
    { x: 500, y: 190, width: 190, height: 130 },
    { x: 170, y: 80, width: 190, height: 142 },
  ],
  goal: {
    id: 'window-toy',
    kind: 'toy',
    albumVariant: 'window-toy',
    spawn: { size: 'small', category: 'toy', random: false, reason: 'main-goal' },
    label: copy('studyToyLabel'),
    motivation: copy('studyWantsToy'),
    surfaceId: 'study-windowsill',
    x: 268,
    dwellMs: 1200,
  },
  platforms: [
    {
      id: 'study-chair',
      asset: 'wood-shelf',
      appearance: 'study-chair',
      durability: { stability: 'stable' },
      bounds: { x: 690, y: 400, width: 80, height: 16 },
    },
    {
      id: 'study-desk',
      asset: 'wood-shelf',
      appearance: 'study-desk',
      durability: { stability: 'stable' },
      bounds: { x: 358, y: 320, width: 280, height: 20 },
    },
    {
      id: 'study-windowsill',
      asset: 'wood-shelf',
      durability: { stability: 'stable' },
      bounds: { x: 190, y: 222, width: 152, height: 16 },
    },
    {
      id: 'study-bookcase',
      asset: 'wood-shelf',
      appearance: 'study-bookcase',
      durability: { stability: 'stable' },
      bounds: { x: 24, y: 150, width: 136, height: 14 },
    },
    {
      id: 'study-bookcase-middle',
      asset: 'wood-shelf',
      appearance: 'study-bookcase-board',
      durability: { stability: 'stable' },
      bounds: { x: 34, y: 260, width: 116, height: 14 },
    },
    {
      id: 'study-bookcase-lower',
      asset: 'wood-shelf',
      appearance: 'study-bookcase-board',
      durability: { stability: 'stable' },
      bounds: { x: 34, y: 360, width: 116, height: 14 },
    },
  ],
  decorations: [
    { kind: 'rect', bounds: { x: 0, y: 0, width: 960, height: 12 }, color: 0xf1eee5 },
    { kind: 'image', asset: 'bedroom-door', bounds: { x: 848, y: 252, width: 112, height: 216 } },
    { kind: 'image', asset: 'bedroom-window', bounds: { x: 210, y: 38, width: 112, height: 184 } },
    { kind: 'image', asset: 'study-monitor', bounds: { x: 504, y: 224, width: 110, height: 96 } },
  ],
  objects: [
    {
      id: 'study-lamp',
      variant: 'study-desk-lamp',
      placement: { mode: 'surface', x: 376, surfaceId: 'study-desk' },
    },
  ],
} as const satisfies RoomDefinition;
