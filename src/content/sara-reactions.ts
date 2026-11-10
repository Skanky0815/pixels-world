import { copy } from '../i18n/locale.ts';
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
export interface SaraDialogueCatalogue {
  readonly generic: DialoguePools;
  readonly rooms: Readonly<Record<string, DialoguePools | undefined>>;
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

export const SARA_DIALOGUE_CATALOGUE: SaraDialogueCatalogue = {
  generic: SARA_DIALOGUE,
  rooms: SARA_ROOM_DIALOGUE,
};
