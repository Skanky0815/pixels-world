/** Known assets only; content never supplies executable class names or raw URLs. */
export const ASSETS = {
  pixel: { kind: 'sprite', frameWidth: 32, frameHeight: 32 },
  sara: { kind: 'sprite', frameWidth: 64, frameHeight: 96 },
  'couch-default': { kind: 'couch', capabilities: ['automatic', 'damage', 'platform'] },
  'curtain-default': { kind: 'curtain', capabilities: ['climb', 'damage'] },
  'catgrass-default': { kind: 'plant', capabilities: ['automatic', 'damage'], width: 40, height: 60 },
  'vase-default': { kind: 'vase', capabilities: ['push', 'damage'], width: 18, height: 28 },
  'carpet-default': { kind: 'carpet', capabilities: ['automatic', 'damage'] },
  'wall-picture': { kind: 'picture', capabilities: ['automatic', 'damage'], width: 108, height: 112 },
  'book-stack': { kind: 'books', capabilities: ['automatic', 'damage'], width: 48, height: 36 },
  'favorite-ball': { kind: 'toy', width: 16, height: 16 },
  'room-plaster': { kind: 'tile' },
  'room-panel': { kind: 'tile' },
  'room-floor': { kind: 'tile' },
  'room-ceiling': { kind: 'tile' },
  'kitchen-wall-cabinet': { kind: 'decoration' },
  'room-window': { kind: 'decoration' },
  'room-picture': { kind: 'decoration' },
  'room-door': { kind: 'decoration' },
  'room-rug': { kind: 'decoration' },
  'wood-shelf': { kind: 'shelf', color: 0x70503e, edgeColor: 0xc49464, bracketColor: 0x87644a },
} as const;
export type AssetKey = keyof typeof ASSETS;

export type DecorationAssetKey = {
  [K in AssetKey]: (typeof ASSETS)[K] extends { kind: 'decoration' } ? K : never;
}[AssetKey];
