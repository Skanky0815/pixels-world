import type { ObjectCatalog } from '../../game/content/definitions.ts';
import { COUCH_SCRATCH } from '../../game/interactions/couch-scratching.ts';
import { CURTAIN_SLIDE } from '../../game/interactions/curtain-sliding.ts';
import { PLANT_NIBBLE } from '../../game/interactions/plant-nibbling.ts';
import { BOOK_TOPPLE } from '../../game/interactions/book-toppling.ts';

const cozyCouch = {
  kind: 'couch',
  spawn: { size: 'large', category: 'furniture', random: false, reason: 'room-fixture' },
  asset: 'couch-default',
  appearance: 'cozy',
  capabilities: ['automatic', 'damage', 'platform'],
  geometry: { width: 254, height: 28, seatRise: 98 },
  reach: 20,
  rules: COUCH_SCRATCH,
} as const;

export const OBJECTS = {
  'cozy-couch': cozyCouch,
  'worn-couch': { ...cozyCouch, appearance: 'worn', rules: { ...COUCH_SCRATCH, damageValue: 1 } },
  'warm-curtain': {
    kind: 'curtain',
    spawn: { size: 'large', category: 'furniture', random: false, reason: 'room-fixture' },
    asset: 'curtain-default',
    capabilities: ['climb', 'damage'],
    geometry: { width: 112, height: 356 },
    rules: CURTAIN_SLIDE,
  },
  catgrass: {
    kind: 'plant',
    spawn: { size: 'medium', category: 'plant', random: true, support: 'floor' },
    asset: 'catgrass-default',
    capabilities: ['automatic', 'damage'],
    reach: { left: -38, right: 22 },
    rules: PLANT_NIBBLE,
  },
  'small-vase': {
    kind: 'vase',
    spawn: { size: 'small', category: 'decoration', random: true, support: 'any-surface' },
    asset: 'vase-default',
    appearance: 'terracotta',
    capabilities: ['push', 'damage'],
    points: 25,
    color: 0xc5875f,
  },
  'blue-vase': {
    kind: 'vase',
    spawn: { size: 'small', category: 'decoration', random: true, support: 'any-surface' },
    asset: 'vase-default',
    appearance: 'blue',
    capabilities: ['push', 'damage'],
    points: 35,
    color: 0x638c97,
  },
  'heirloom-vase': {
    kind: 'vase',
    spawn: { size: 'small', category: 'decoration', random: true, support: 'any-surface' },
    asset: 'vase-default',
    appearance: 'gold',
    capabilities: ['push', 'damage'],
    points: 40,
    color: 0xc5ae70,
  },
  'mellow-vase': {
    kind: 'vase',
    spawn: { size: 'small', category: 'decoration', random: true, support: 'any-surface' },
    asset: 'vase-default',
    appearance: 'mellow',
    capabilities: ['push', 'damage'],
    points: 15,
    color: 0xc5875f,
  },
  'reading-books': {
    kind: 'books',
    asset: 'book-stack',
    capabilities: ['automatic', 'damage'],
    spawn: { size: 'medium', category: 'decoration', random: false, reason: 'room-fixture' },
    rules: BOOK_TOPPLE,
  },
} as const satisfies ObjectCatalog;
