import {
  KITCHEN_TABLE_SLOTS,
  KITCHEN_COUNTER_SLOTS,
  KITCHEN_WALL_SHELF_SLOTS,
  KITCHEN_DOOR_SHELF_SLOTS,
  KITCHEN_FLOOR_SLOTS,
  KITCHEN_WALL_SLOTS,
} from './kitchen-slots.ts';
import { copy } from '../../i18n/locale.ts';
import type { RoomDefinition } from '../../game/content/definitions.ts';

/** DEV only: fixed route and kitchen art, not the published kitchen or its food goal. */
export const KITCHEN_PREVIEW = {
  id: 'kitchen-preview',
  caption: copy('kitchenPreviewTitle'),
  environment: 'kitchen-preview',
  homecomingSide: 'left',
  wallSlots: KITCHEN_WALL_SLOTS,
  objectSlots: KITCHEN_FLOOR_SLOTS,
  navigationClearances: [
    { x: 0, y: 276, width: 212, height: 192 },
    { x: 304, y: 248, width: 320, height: 80 },
    { x: 800, y: 138, width: 140, height: 120 },
  ],
  width: 960,
  height: 540,
  pixelAsset: 'pixel',
  spawn: { x: 110, surfaceId: 'floor' },
  wallColor: 0xd9c1a3,
  floor: {
    id: 'floor',
    y: 468,
    color: 0xb4b1a1,
    plankColor: 0x67665f,
    plankWidth: 48,
    plankHeight: 36,
  },
  goal: {
    id: 'kitchen-preview-target',
    kind: 'toy',
    spawn: { size: 'small', category: 'toy', random: false, reason: 'main-goal' },
    label: copy('kitchenPreviewGoal'),
    motivation: copy('kitchenPreviewMotivation'),
    surfaceId: 'kitchen-counter',
    x: 860,
    dwellMs: 1200,
  },
  platforms: [
    {
      id: 'kitchen-stool',
      asset: 'wood-shelf',
      appearance: 'stool',
      bounds: { x: 220, y: 398, width: 80, height: 14 },
      durability: { stability: 'stable' },
    },
    {
      slots: KITCHEN_TABLE_SLOTS,
      id: 'kitchen-table',
      asset: 'wood-shelf',
      appearance: 'table',
      bounds: { x: 340, y: 328, width: 220, height: 14 },
      durability: { stability: 'stable' },
    },
    {
      slots: KITCHEN_COUNTER_SLOTS,
      id: 'kitchen-counter',
      asset: 'wood-shelf',
      appearance: 'counter',
      bounds: { x: 620, y: 258, width: 340, height: 210 },
      durability: { stability: 'stable' },
    },
    {
      id: 'kitchen-door-shelf',
      asset: 'wood-shelf',
      bounds: { x: 16, y: 202, width: 104, height: 16 },
      durability: { stability: 'stable' },
      slots: KITCHEN_DOOR_SHELF_SLOTS,
    },
    {
      id: 'kitchen-wall-shelf',
      asset: 'wood-shelf',
      bounds: { x: 276, y: 218, width: 136, height: 16 },
      durability: { stability: 'stable' },
      slots: KITCHEN_WALL_SHELF_SLOTS,
    },
  ],
  decorations: [
    { kind: 'image', asset: 'room-door', bounds: { x: 0, y: 252, width: 112, height: 216 } },
    { kind: 'image', asset: 'room-window', bounds: { x: 430, y: 48, width: 112, height: 184 } },
    {
      kind: 'image',
      asset: 'kitchen-wall-cabinet',
      bounds: { x: 620, y: 52, width: 340, height: 78 },
    },
  ],
  objects: [],
} as const satisfies RoomDefinition;
