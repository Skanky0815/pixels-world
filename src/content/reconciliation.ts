import { copy } from '../i18n/locale.ts';
import type { angerFor } from '../game/domain/chaos.ts';
export const DIRECTIONS = ['left', 'up', 'right', 'down'] as const;
export type Direction = (typeof DIRECTIONS)[number];
export type ReconciliationLevel = ReturnType<typeof angerFor>['id'];
export interface CharmProfile {
  readonly length: number;
  readonly sequences: number;
  readonly inputMs: number;
}
/** Initial playtest values; no total time limit and no progress loss on failure. */
export const CHARM_PROFILES: Record<ReconciliationLevel, CharmProfile> = {
  calm: { length: 3, sequences: 1, inputMs: 1800 },
  annoyed: { length: 4, sequences: 2, inputMs: 1500 },
  angry: { length: 4, sequences: 3, inputMs: 1200 },
};
export const CHARM_TIMING = {
  cueMs: 700,
  finaleMs: 1800,
  attemptsPerHeart: 2,
  helpEveryFailures: 1,
  helpStepMs: 300,
  maxInputMs: 3000,
} as const;
export const CHARM_LINES = {
  calm: [copy('allRightYouCanComeA'), copy('thatPurringIsUnfair')],
  annoyed: [copy('theSofaStillLooksLikeThat'), copy('youKnowExactlyWhatYouRe')],
  angry: [copy('iMNotConvincedYet'), copy('donTGiveMeThatLook')],
} as const;
export const ARROW_LABELS: Record<Direction, string> = {
  left: '←',
  up: '↑',
  right: '→',
  down: '↓',
};
