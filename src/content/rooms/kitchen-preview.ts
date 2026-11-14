import { copy } from '../../i18n/locale.ts';
import type { RoomDefinition } from '../../game/content/definitions.ts';

/** DEV only: fixed route and kitchen art, not the published kitchen or its food goal. */
export const KITCHEN_PREVIEW = {
  id: 'kitchen-preview',
  caption: copy('kitchenPreviewTitle'),
  environment: 'kitchen-preview',
  homecomingSide: 'left',
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
      id: 'kitchen-table',
      asset: 'wood-shelf',
      appearance: 'table',
      bounds: { x: 340, y: 328, width: 220, height: 14 },
      durability: { stability: 'stable' },
    },
    {
      id: 'kitchen-counter',
      asset: 'wood-shelf',
      appearance: 'counter',
      bounds: { x: 620, y: 258, width: 340, height: 210 },
      durability: { stability: 'stable' },
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
