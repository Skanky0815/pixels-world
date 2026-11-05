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
  calm: { length: 3, sequences: 3, inputMs: 1800 },
  annoyed: { length: 4, sequences: 3, inputMs: 1500 },
  angry: { length: 4, sequences: 4, inputMs: 1200 },
};
export const CHARM_TIMING = {
  cueMs: 400,
  feedbackMs: 900,
  finaleMs: 1800,
  helpEveryFailures: 2,
  helpStepMs: 300,
  maxInputMs: 3000,
} as const;
export const CHARM_LINES = {
  calm: ['Na gut. Ein bisschen näher darfst du.', 'Dieses Schnurren ist unfair.'],
  annoyed: ['Das Sofa sieht trotzdem so aus.', 'Du weißt genau, was du da tust.'],
  angry: ['Ich bin noch nicht überzeugt.', 'Nicht so schauen. Das zählt als Bestechung.'],
} as const;
export const ARROW_LABELS: Record<Direction, string> = {
  left: '←',
  up: '↑',
  right: '→',
  down: '↓',
};
