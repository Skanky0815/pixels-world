import { CHARM_PROFILES } from './reconciliation.ts';
import type { CharmProfile, ReconciliationLevel } from './reconciliation.ts';
import type { RoomDefinition, ObjectInstance } from '../game/content/definitions.ts';
import type { RoundConfig } from '../game/domain/round-controller.ts';

export const DIFFICULTIES = ['easy', 'normal', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DIFFICULTY_LABELS = {
  easy: 'difficultyEasy',
  normal: 'difficultyNormal',
  hard: 'difficultyHard',
} as const;
/** Provisional playtest presets. Normal deliberately reuses the established values. */
export const DIFFICULTY_PRESETS = {
  easy: { timeScale: 1.5, hearts: [1, 1, 2], lengthDelta: -1, inputScale: 1.3 },
  normal: { timeScale: 1, hearts: [1, 2, 3], lengthDelta: 0, inputScale: 1 },
  hard: { timeScale: 0.75, hearts: [2, 3, 4], lengthDelta: 1, inputScale: 0.8 },
} as const;
const LEVELS = ['calm', 'annoyed', 'angry'] as const;
const EXTRA_VASES: readonly ObjectInstance[] = [
  {
    id: 'difficulty-lower-a',
    variant: 'small-vase',
    placement: { mode: 'surface', x: 535, surfaceId: 'lower-shelf' },
  },
  {
    id: 'difficulty-lower-b',
    variant: 'small-vase',
    placement: { mode: 'surface', x: 565, surfaceId: 'lower-shelf' },
  },
  {
    id: 'difficulty-middle',
    variant: 'small-vase',
    placement: { mode: 'surface', x: 670, surfaceId: 'middle-shelf' },
  },
  ...[875, 900, 930].map((x): ObjectInstance => ({
    id: `difficulty-floor-${x}`,
    variant: 'small-vase',
    placement: { mode: 'surface', x, surfaceId: 'floor' },
  })),
];

export function isDifficulty(value: unknown): value is Difficulty {
  return DIFFICULTIES.some((level) => level === value);
}

export function difficultyTimer(config: RoundConfig, difficulty: Difficulty): RoundConfig {
  const scale = DIFFICULTY_PRESETS[difficulty].timeScale;

  return {
    minDurationMs: Math.round(config.minDurationMs * scale),
    maxDurationMs: Math.round(config.maxDurationMs * scale),
  };
}

export function difficultyCharm(difficulty: Difficulty, level: ReconciliationLevel): CharmProfile {
  const preset = DIFFICULTY_PRESETS[difficulty];
  const normal = CHARM_PROFILES[level];

  return Object.freeze({
    length: normal.length + preset.lengthDelta,
    sequences: preset.hearts[LEVELS.indexOf(level)],
    inputMs: Math.round(normal.inputMs * preset.inputScale),
  });
}

export const LIVING_ROOM_DENSITY = {
  easyOmit: ['blue-vase', 'heirloom-vase'],
  hardAdd: EXTRA_VASES,
} as const;

export function difficultyRoom(room: RoomDefinition, difficulty: Difficulty): RoomDefinition {
  const density = room.difficultyObjects;

  if (difficulty === 'normal' || !density) return room;
  const objects =
    difficulty === 'easy'
      ? room.objects.filter((object) => !density.easyOmit.includes(object.id))
      : [...room.objects, ...density.hardAdd];

  return { ...room, objects };
}
