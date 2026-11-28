import type { ObjectCatalog } from '../definitions.ts';
import { PLANT_NIBBLE } from '../../interactions/plant-nibbling.ts';
import { CURTAIN_SLIDE } from '../../interactions/curtain-sliding.ts';
import { CARPET_RULES } from '../../interactions/carpet-hairball.ts';

export const BEDROOM_OBJECTS = {
  'short-khaki-curtain': {
    kind: 'curtain',
    asset: 'curtain-default',
    appearance: 'khaki',
    capabilities: ['climb', 'damage'],
    spawn: { size: 'large', category: 'furniture', random: false, reason: 'room-fixture' },
    geometry: { width: 40, height: 120 },
    rules: CURTAIN_SLIDE,
    album: {
      id: 'curtain.khaki',
      asset: 'bedroom-curtain',
      rooms: ['bedroom'],
      name: { de: 'Die kurzen Khaki-Vorhänge', en: 'The short khaki curtains' },
      condition: { kind: 'tear', stage: 1 },
      fluff: { de: 'Kurzer Stoff. Lange Krallen.', en: 'Short fabric. Long claws.' },
      sara: { de: 'Die sind zum Anschauen, Pixel.', en: 'Those are for looking at, Pixel.' },
    },
  },
  'bedroom-spiderplant': {
    kind: 'plant',
    asset: 'catgrass-default',
    appearance: 'spiderplant',
    capabilities: ['automatic', 'damage'],
    spawn: { size: 'medium', category: 'plant', random: true, support: 'any-surface' },
    reach: { left: -38, right: 22 },
    rules: PLANT_NIBBLE,
    album: {
      id: 'plant.spiderplant',
      asset: 'bedroom-spiderplant',
      rooms: ['bedroom', 'study'],
      name: { de: 'Die Grünlilie', en: 'The spider plant' },
      condition: { kind: 'nibble', stage: 1 },
      also: [{ kind: 'tip', stage: 2 }],
      fluff: {
        de: 'Lange Blätter. Sehr kurze Ruhe vor Pixel.',
        en: 'Long leaves. Very little peace from Pixel.',
      },
      sara: { de: 'Die stand extra da oben, Pixel.', en: 'I put it up there for a reason, Pixel.' },
    },
  },
  'bedside-lamp': {
    kind: 'lamp',
    asset: 'bedside-lamp',
    capabilities: ['push', 'damage'],
    spawn: { size: 'medium', category: 'decoration', random: false, reason: 'room-fixture' },
    points: 20,
    color: 0xe9cc94,
    album: {
      id: 'lamp.bedside',
      asset: 'bedroom-lamp',
      rooms: ['bedroom'],
      name: { de: 'Die Nachttischlampe', en: 'The bedside lamp' },
      condition: { kind: 'break', stage: 1 },
      fluff: { de: 'Licht aus. Sehr gründlich.', en: 'Lights out. Very thoroughly.' },
      sara: {
        de: 'Pixel, zum Ausschalten gibt es einen Schalter.',
        en: 'Pixel, there is a switch for that.',
      },
    },
  },
  'bedroom-runner': {
    kind: 'carpet',
    asset: 'carpet-default',
    appearance: 'runner',
    capabilities: ['automatic', 'damage'],
    spawn: { size: 'large', category: 'furniture', random: false, reason: 'room-fixture' },
    geometry: { width: 310, height: 36 },
    rules: CARPET_RULES,
    album: {
      id: 'carpet.bedroom-runner',
      asset: 'bedroom-runner',
      rooms: ['bedroom'],
      name: { de: 'Der Läufer vorm Bett', en: 'The bedside runner' },
      condition: { kind: 'hairball', stage: 1 },
      fluff: {
        de: 'Weich, warm und jetzt mit persönlicher Widmung.',
        en: 'Soft, warm, and now personally dedicated.',
      },
      sara: {
        de: 'Natürlich auf den Läufer. Die Dielen waren ja frei.',
        en: 'Of course, on the runner. The floorboards were available.',
      },
    },
  },
} as const satisfies ObjectCatalog;
