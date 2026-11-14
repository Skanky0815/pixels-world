import { copy } from '../i18n/locale.ts';
import type { DamageKind } from '../game/domain/chaos-event.ts';
/** Semantic animation keys; #88 supplies the final frames behind this contract. */
export const SARA_ANIMATIONS = {
  enter: 'sara-enter',
  idle: 'sara-idle',
  calm: 'sara-react-calm',
  annoyed: 'sara-react-annoyed',
  angry: 'sara-react-angry',
} as const;
export const SARA_DIALOGUE = {
  calm: [
    copy('youReLookingRemarkablyInnocentPixel'),
    copy('almostEverythingIsStillStandingI'),
    copy('iWasOutYouWereGood'),
    copy('saraInnocentLook'),
    copy('saraYourVersion'),
    copy('saraLittleHousemate'),
  ],
  annoyed: [
    copy('ahYouVeRedecoratedWithoutAsking'),
    copy('saraRoomHasCharacter'),
    copy('pixelWeHaveVeryDifferentIdeas'),
    copy('saraTimeWellUsed'),
    copy('saraDesignMeeting'),
    copy('saraPurringAnswers'),
  ],
  angry: [
    copy('letMePutMyBagDown'),
    copy('thisUsedToBeALiving'),
    copy('pixelPleaseTellMeTheNeighbours'),
    copy('saraDeepBreath'),
    copy('saraQuietThenBroom'),
    copy('saraLoveAndDecisions'),
  ],
} as const;

export type SaraAnger = keyof typeof SARA_DIALOGUE;
export type DialoguePools = Readonly<Partial<Record<SaraAnger, readonly string[]>>>;
export const SARA_DAMAGE_RULES = [
  { topic: 'dish', objectKind: 'dish', eventKind: 'break', priority: 35 },
  { topic: 'foodBag', objectKind: 'food-bag', eventKind: 'spill', priority: 25 },
  { topic: 'shelf', objectKind: 'shelf', eventKind: 'collapse', priority: 50 },
  { topic: 'vase', objectKind: 'vase', eventKind: 'break', priority: 40 },
  { topic: 'plant', objectKind: 'plant', eventKind: 'tip', priority: 30 },
  { topic: 'curtain', objectKind: 'curtain', eventKind: 'tear', priority: 20 },
  { topic: 'sofa', objectKind: 'couch', eventKind: 'scratch', priority: 10 },
] as const satisfies readonly {
  topic: string;
  objectKind: string;
  eventKind: DamageKind;
  priority: number;
}[];
export type SaraDamageTopic = (typeof SARA_DAMAGE_RULES)[number]['topic'];
export interface SaraDialogueCatalogue {
  readonly generic: DialoguePools;
  readonly rooms: Readonly<Record<string, DialoguePools | undefined>>;
  readonly damage?: Readonly<Record<string, DialoguePools | undefined>>;
}

/** Room flavour describes the authored setting, never assumes a particular damaged object. */
export const SARA_ROOM_DIALOGUE = {
  'living-room': {
    calm: [copy('saraLivingRoomTrio'), copy('saraLivingRoomSeat'), copy('saraLivingRoomLookout')],
    annoyed: [
      copy('saraLivingRoomIdeas'),
      copy('saraLivingRoomProgramme'),
      copy('saraLivingRoomPlans'),
    ],
    angry: [
      copy('saraLivingRoomProject'),
      copy('saraLivingRoomPerspective'),
      copy('saraLivingRoomRules'),
    ],
  },
  'cozy-remix': {
    calm: [copy('saraCozyTwoSofas'), copy('saraCozySeat'), copy('saraCozyBooksAndCat')],
    annoyed: [
      copy('saraCozyStillBored'),
      copy('saraCozyEntertainment'),
      copy('saraCozyReadYourFace'),
    ],
    angry: [copy('saraCozyAdventure'), copy('saraCozyPlayground'), copy('saraCozyThisChapter')],
  },
} as const;

export const SARA_DAMAGE_DIALOGUE = {
  dish: {
    calm: [copy('saraDamageDish0')],
    annoyed: [copy('saraDamageDish1')],
    angry: [copy('saraDamageDish2')],
  },
  foodBag: {
    calm: [copy('saraDamageFoodBag0')],
    annoyed: [copy('saraDamageFoodBag1')],
    angry: [copy('saraDamageFoodBag2')],
  },
  sofa: {
    calm: [copy('saraDamageSofa0'), copy('saraDamageSofa1')],
    annoyed: [copy('saraDamageSofa2'), copy('saraDamageSofa3')],
    angry: [copy('saraDamageSofa4'), copy('saraDamageSofa5')],
  },
  curtain: {
    calm: [copy('saraDamageCurtain0'), copy('saraDamageCurtain1')],
    annoyed: [copy('saraDamageCurtain2'), copy('saraDamageCurtain3')],
    angry: [copy('saraDamageCurtain4'), copy('saraDamageCurtain5')],
  },
  plant: {
    calm: [copy('saraDamagePlant0'), copy('saraDamagePlant1')],
    annoyed: [copy('saraDamagePlant2'), copy('saraDamagePlant3')],
    angry: [copy('saraDamagePlant4'), copy('saraDamagePlant5')],
  },
  vase: {
    calm: [copy('saraDamageVase0'), copy('saraDamageVase1')],
    annoyed: [copy('saraDamageVase2'), copy('saraDamageVase3')],
    angry: [copy('saraDamageVase4'), copy('saraDamageVase5')],
  },
  shelf: {
    calm: [copy('saraDamageShelf0'), copy('saraDamageShelf1')],
    annoyed: [copy('saraDamageShelf2'), copy('saraDamageShelf3')],
    angry: [copy('saraDamageShelf4'), copy('saraDamageShelf5')],
  },
} as const satisfies Readonly<Record<SaraDamageTopic, DialoguePools>>;

export const SARA_DIALOGUE_CATALOGUE: SaraDialogueCatalogue = {
  generic: SARA_DIALOGUE,
  rooms: SARA_ROOM_DIALOGUE,
  damage: SARA_DAMAGE_DIALOGUE,
};
