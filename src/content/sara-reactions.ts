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
  ],
  annoyed: [
    copy('ahYouVeRedecoratedWithoutAsking'),
    copy('theSofaUsedToHaveLess'),
    copy('pixelWeHaveVeryDifferentIdeas'),
  ],
  angry: [
    copy('letMePutMyBagDown'),
    copy('thisUsedToBeALiving'),
    copy('pixelPleaseTellMeTheNeighbours'),
  ],
} as const;
