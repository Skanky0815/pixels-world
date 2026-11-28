import { PICTURE_RULES } from '../../interactions/picture-falling.ts';
import type { ObjectCatalog } from '../definitions.ts';
import { BOOK_TOPPLE } from '../../interactions/book-toppling.ts';

const poster = {
  kind: 'picture',
  asset: 'wall-picture',
  spawn: { size: 'large', category: 'decoration', random: false, reason: 'room-fixture' },
  capabilities: ['automatic', 'damage'],
  rules: PICTURE_RULES,
} as const;

export const STUDY_OBJECTS = {
  'study-space-poster': {
    ...poster,
    appearance: 'poster-space',
    album: {
      id: 'picture.poster-space',
      asset: 'picture-poster-space',
      rooms: ['study'],
      name: { de: 'Weltraumkatzen-Poster', en: 'Space cat poster' },
      condition: { kind: 'picture-fall', stage: 1 },
      fluff: { de: 'Die Schwerkraft hat gewonnen.', en: 'Gravity won.' },
      sara: {
        de: 'Pixel, selbst die Weltraumkatze hängt lieber an der Wand.',
        en: 'Pixel, even the space cat prefers the wall.',
      },
    },
  },
  'study-arcade-poster': {
    ...poster,
    appearance: 'poster-arcade',
    album: {
      id: 'picture.poster-arcade',
      asset: 'picture-poster-arcade',
      rooms: ['study'],
      name: { de: 'Retro-Spielposter', en: 'Retro arcade poster' },
      condition: { kind: 'picture-fall', stage: 1 },
      fluff: { de: 'Game over. Für die Wanddekoration.', en: 'Game over for the wall decoration.' },
      sara: {
        de: 'Den Highscore hätte ich auch so geglaubt, Pixel.',
        en: 'I would have believed the high score anyway, Pixel.',
      },
    },
  },
  'study-papers': {
    kind: 'books',
    asset: 'book-stack',
    appearance: 'paper',
    capabilities: ['automatic', 'damage'],
    spawn: { size: 'medium', category: 'decoration', random: true, support: 'any-surface' },
    rules: BOOK_TOPPLE,
    album: {
      id: 'books.paper',
      asset: 'study-paper',
      rooms: ['study'],
      name: { de: 'Der Papierstapel', en: 'The paper stack' },
      condition: { kind: 'topple', stage: 1 },
      fluff: { de: 'Ablage P. Für Pixel.', en: 'Filed under P. For Pixel.' },
      sara: { de: 'Die Reihenfolge war Absicht, Pixel.', en: 'That order was intentional, Pixel.' },
    },
  },
  'study-pen-cup': {
    kind: 'pantry',
    asset: 'pantry',
    appearance: 'pen-cup',
    capabilities: ['push', 'damage'],
    spawn: { size: 'medium', category: 'decoration', random: true, support: 'any-surface' },
    points: 16,
    color: 0x7d8886,
    album: {
      id: 'container.pencils',
      asset: 'study-pen-cup',
      rooms: ['study'],
      name: { de: 'Der Stiftebecher', en: 'The pencil cup' },
      condition: { kind: 'spill', stage: 1 },
      fluff: {
        de: 'Alle Stifte griffbereit. Überall.',
        en: 'Every pencil within reach. Everywhere.',
      },
      sara: {
        de: 'Jetzt suchst du bitte den Bleistift, Pixel.',
        en: 'Now please find the pencil, Pixel.',
      },
    },
  },
  'study-desk-lamp': {
    kind: 'lamp',
    asset: 'bedside-lamp',
    capabilities: ['push', 'damage'],
    spawn: { size: 'medium', category: 'decoration', random: false, reason: 'room-fixture' },
    points: 20,
    color: 0xe9cc94,
    album: {
      id: 'lamp.study',
      asset: 'bedroom-lamp',
      rooms: ['study'],
      name: { de: 'Die Arbeitslampe', en: 'The desk lamp' },
      condition: { kind: 'break', stage: 1 },
      fluff: { de: 'Feierabendbeleuchtung.', en: 'Lights out for the day.' },
      sara: { de: 'Pixel, ich war noch nicht fertig.', en: 'Pixel, I was not finished yet.' },
    },
  },
} as const satisfies ObjectCatalog;
