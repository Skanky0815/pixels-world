/** Known assets only; content never supplies executable class names or raw URLs. */
export const ASSETS = {
  pixel: { kind: 'sprite', frameWidth: 32, frameHeight: 32 },
  'couch-default': { kind: 'couch', capabilities: ['automatic', 'damage', 'platform'] },
  'curtain-default': { kind: 'curtain', capabilities: ['climb', 'damage'] },
  'catgrass-default': { kind: 'plant', capabilities: ['automatic', 'damage'], width: 40, height: 60 },
  'vase-default': { kind: 'vase', capabilities: ['push', 'damage'], width: 18, height: 28 },
  'wood-shelf': { kind: 'shelf', color: 0x70503e, edgeColor: 0xc49464, bracketColor: 0x87644a },
} as const;
export type AssetKey = keyof typeof ASSETS;
