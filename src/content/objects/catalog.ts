import { CARPET_RULES } from '../../game/interactions/carpet-hairball.ts';
import { PICTURE_RULES } from '../../game/interactions/picture-falling.ts';
import type { ObjectCatalog } from '../../game/content/definitions.ts';
import { COUCH_SCRATCH } from '../../game/interactions/couch-scratching.ts';
import { CURTAIN_SLIDE } from '../../game/interactions/curtain-sliding.ts';
import { PLANT_NIBBLE } from '../../game/interactions/plant-nibbling.ts';
import { FOOD_BAG_RULES } from '../../game/interactions/toppling.ts';
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

const picture = {
  kind: 'picture',
  asset: 'wall-picture',
  spawn: { size: 'large', category: 'decoration', random: false, reason: 'room-fixture' },
  capabilities: ['automatic', 'damage'],
  rules: PICTURE_RULES,
} as const;

export const OBJECTS = {
  'dry-food-bag': {
    kind: 'food-bag',
    asset: 'food-bag',
    capabilities: ['automatic', 'damage'],
    spawn: { size: 'medium', category: 'decoration', random: true, support: 'any-surface' },
    rules: FOOD_BAG_RULES,
    album: {
      id: 'food-bag.dry',
      asset: 'food-bag-intact',
      previewOnly: true,
      rooms: ['kitchen'],
      name: { de: 'Der Trockenfutterbeutel', en: 'The dry-food bag' },
      condition: { kind: 'spill', stage: 1 },
      fluff: {
        de: 'Ein Buffet auf Bodenniveau. Selbst eröffnet, versteht sich.',
        en: 'A floor-level buffet. Self-service, naturally.',
      },
      sara: {
        de: 'Pixel, dafür gibt es einen Napf. Du kennst den sogar schon.',
        en: 'Pixel, that is what the bowl is for. You already know where it is.',
      },
    },
  },
  'living-room-rug': {
    kind: 'carpet',
    asset: 'carpet-default',
    spawn: { size: 'large', category: 'furniture', random: false, reason: 'room-fixture' },
    capabilities: ['automatic', 'damage'],
    geometry: { width: 430, height: 30 },
    rules: CARPET_RULES,
    album: {
      id: 'carpet.hairball',
      name: { de: 'Der Wohnzimmerteppich', en: 'The living room rug' },
      rooms: ['living-room'],
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
  },
  'pixel-portrait': {
    ...picture,
    appearance: 'pixel',
    album: {
      id: 'picture.pixel',
      name: { de: 'Pixels Porträt', en: 'Pixel’s portrait' },
      rooms: ['living-room'],
      asset: 'picture-pixel',
      condition: { kind: 'picture-fall', stage: 1 },
      fluff: { de: 'Kunstkritik mit Pfoteneinsatz.', en: 'Art criticism, paws first.' },
      sara: {
        de: 'Pixel, das war ein Porträt. Kein Spiegelgegner.',
        en: 'Pixel, that was a portrait. Not a mirror rival.',
      },
    },
  },
  'berlin-tower': {
    ...picture,
    appearance: 'berlin',
    album: {
      id: 'picture.berlin',
      name: { de: 'Berliner Fernsehturm', en: 'Berlin TV tower' },
      rooms: ['living-room'],
      asset: 'picture-berlin',
      condition: { kind: 'picture-fall', stage: 1 },
      fluff: {
        de: 'Der Fernsehturm steht jetzt eine Etage tiefer.',
        en: 'The TV tower has moved down a floor.',
      },
      sara: {
        de: 'Die Berliner Skyline hing vorher höher.',
        en: 'The Berlin skyline used to hang higher.',
      },
    },
  },
  'cozy-nook': {
    ...picture,
    appearance: 'cozy',
    album: {
      id: 'picture.cozy',
      name: { de: 'Gemütliche Ecke', en: 'Cozy nook' },
      rooms: ['living-room'],
      asset: 'picture-cozy',
      condition: { kind: 'picture-fall', stage: 1 },
      fluff: {
        de: 'Ein Stillleben mit sehr bewegtem Rahmen.',
        en: 'A still life with a very lively frame.',
      },
      sara: {
        de: 'Gemütlich war es auch schon an der Wand.',
        en: 'It was perfectly cozy on the wall, too.',
      },
    },
  },
  'cozy-couch': {
    ...cozyCouch,
    album: {
      id: 'couch.cozy',
      asset: 'couch-cozy',
      rooms: ['living-room'],
      name: { de: 'Das gemütliche Sofa', en: 'The cozy couch' },
      condition: { kind: 'scratch', stage: 1 },
      fluff: {
        de: 'Ein Lieblingsplatz mit persönlicher Signatur.',
        en: 'A favourite spot with a personal signature.',
      },
      sara: {
        de: 'Gemütlich war es auch ohne Autogramm.',
        en: 'It was cozy without the autograph, too.',
      },
    },
  },
  'worn-couch': {
    ...cozyCouch,
    appearance: 'worn',
    rules: { ...COUCH_SCRATCH, damageValue: 1 },
    album: {
      previewOnly: true,
      id: 'couch.worn',
      asset: 'couch-worn',
      rooms: ['living-room'],
      name: { de: 'Das alte Lieblingssofa', en: 'The old favourite couch' },
      condition: { kind: 'scratch', stage: 1 },
      fluff: { de: 'Patina? Pixel hilft gern nach.', en: 'Patina? Pixel is happy to help.' },
      sara: { de: 'Alt heißt nicht Freiwild.', en: 'Old does not mean fair game.' },
    },
  },
  'warm-curtain': {
    kind: 'curtain',
    spawn: { size: 'large', category: 'furniture', random: false, reason: 'room-fixture' },
    asset: 'curtain-default',
    capabilities: ['climb', 'damage'],
    geometry: { width: 112, height: 356 },
    rules: CURTAIN_SLIDE,
    album: {
      id: 'curtain.warm',
      asset: 'curtain-rust',
      rooms: ['living-room'],
      name: { de: 'Der rostrote Vorhang', en: 'The rust-red curtain' },
      condition: { kind: 'tear', stage: 1 },
      fluff: {
        de: 'Sichtschutz mit neuer Aussicht.',
        en: 'A privacy curtain with a brand-new view.',
      },
      sara: {
        de: 'Das ist keine Kletterwand mit Sollbruchstelle.',
        en: 'That is not a climbing wall with a tear-away feature.',
      },
    },
  },
  catgrass: {
    kind: 'plant',
    spawn: { size: 'medium', category: 'plant', random: true, support: 'floor' },
    asset: 'catgrass-default',
    capabilities: ['automatic', 'damage'],
    reach: { left: -38, right: 22 },
    rules: PLANT_NIBBLE,
    album: {
      id: 'plant.catgrass',
      asset: 'catgrass-intact',
      rooms: ['living-room'],
      name: { de: 'Das Katzengras', en: 'The cat grass' },
      condition: { kind: 'nibble', stage: 1 },
      fluff: {
        de: 'Ein kleiner Salat. Mit sehr eigenwilliger Tischkultur.',
        en: 'A small salad. With very peculiar table manners.',
      },
      sara: {
        de: 'Knabbern darfst du. Den Rest besprechen wir noch.',
        en: 'Nibbling is allowed. We will discuss the rest.',
      },
    },
  },
  'small-vase': {
    kind: 'vase',
    spawn: { size: 'small', category: 'decoration', random: true, support: 'any-surface' },
    asset: 'vase-default',
    appearance: 'terracotta',
    capabilities: ['push', 'damage'],
    points: 25,
    color: 0xc5875f,
    album: {
      id: 'vase.terracotta',
      asset: 'vase-terracotta',
      rooms: ['living-room'],
      name: { de: 'Die Terrakottavase', en: 'The terracotta vase' },
      condition: { kind: 'break', stage: 1 },
      fluff: {
        de: 'Ein warmer Farbton. Ein sehr kalter Aufprall.',
        en: 'A warm shade. A very cold landing.',
      },
      sara: {
        de: 'Die stand da seit Jahren. Du warst fünf Minuten allein.',
        en: 'It stood there for years. You were alone for five minutes.',
      },
    },
  },
  'blue-vase': {
    kind: 'vase',
    spawn: { size: 'small', category: 'decoration', random: true, support: 'any-surface' },
    asset: 'vase-default',
    appearance: 'blue',
    capabilities: ['push', 'damage'],
    points: 35,
    color: 0x638c97,
    album: {
      id: 'vase.blue',
      asset: 'vase-blue',
      rooms: ['living-room'],
      name: { de: 'Die blaue Vase', en: 'The blue vase' },
      condition: { kind: 'break', stage: 1 },
      fluff: {
        de: 'Stand dekorativ herum. Pixel hat das Problem gelöst.',
        en: 'Just stood there looking decorative. Pixel solved that problem.',
      },
      sara: { de: 'Ich mochte die. Wirklich.', en: 'I liked that one. Really.' },
    },
  },
  'heirloom-vase': {
    kind: 'vase',
    spawn: { size: 'small', category: 'decoration', random: true, support: 'any-surface' },
    asset: 'vase-default',
    appearance: 'gold',
    capabilities: ['push', 'damage'],
    points: 40,
    color: 0xc5ae70,
    album: {
      id: 'vase.gold',
      asset: 'vase-gold',
      rooms: ['living-room'],
      name: { de: 'Das goldene Erbstück', en: 'The golden heirloom' },
      condition: { kind: 'break', stage: 1 },
      fluff: {
        de: 'Tradition, von Generation zu Scherbe weitergegeben.',
        en: 'Tradition, passed down from generation to shard.',
      },
      sara: {
        de: 'Das erklären wir Oma gemeinsam.',
        en: 'We are explaining this to Grandma together.',
      },
    },
  },
  'mellow-vase': {
    kind: 'vase',
    spawn: { size: 'small', category: 'decoration', random: true, support: 'any-surface' },
    asset: 'vase-default',
    appearance: 'mellow',
    capabilities: ['push', 'damage'],
    points: 15,
    color: 0xc5875f,
    album: {
      id: 'vase.mellow',
      asset: 'vase-mellow',
      rooms: ['living-room'],
      name: { de: 'Die kleine Bauchige', en: 'The little round vase' },
      condition: { kind: 'break', stage: 1 },
      fluff: {
        de: 'Klein, rund und offenbar nicht katzensicher.',
        en: 'Small, round, and apparently not cat-proof.',
      },
      sara: { de: 'Die hat dir wirklich nichts getan.', en: 'It really did nothing to you.' },
    },
  },
  'reading-books': {
    kind: 'books',
    asset: 'book-stack',
    capabilities: ['automatic', 'damage'],
    spawn: { size: 'medium', category: 'decoration', random: true, support: 'any-surface' },
    rules: BOOK_TOPPLE,
    album: {
      id: 'books.stacked',
      asset: 'books-stacked',
      rooms: ['living-room'],
      name: { de: 'Der Lesestapel', en: 'The reading pile' },
      condition: { kind: 'topple', stage: 1 },
      fluff: {
        de: 'Eine mitreißende Geschichte. Alle Bände auf einmal.',
        en: 'A gripping story. Every volume at once.',
      },
      sara: {
        de: 'Ich hatte die Reihenfolge gerade erst sortiert.',
        en: 'I had only just put them in order.',
      },
    },
  },
  'upright-books': {
    kind: 'books',
    asset: 'book-stack',
    appearance: 'upright',
    capabilities: ['automatic', 'damage'],
    spawn: { size: 'medium', category: 'decoration', random: true, support: 'any-surface' },
    rules: BOOK_TOPPLE,
    album: {
      id: 'books.upright',
      asset: 'books-upright',
      rooms: ['living-room'],
      name: { de: 'Die standhaften Bücher', en: 'The steadfast books' },
      condition: { kind: 'topple', stage: 1 },
      fluff: { de: 'Die Buchrücken haben nachgegeben.', en: 'Their spines finally gave in.' },
      sara: {
        de: 'Lesen wäre auch eine Möglichkeit gewesen.',
        en: 'Reading them was also an option.',
      },
    },
  },
} as const satisfies ObjectCatalog;
