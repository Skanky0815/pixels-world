import config from './difficulty.json' with { type: 'json' };
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
/** Provisional playtest values; edit difficulty.json and start a fresh round. */
export const DIFFICULTY_PRESETS = config.presets;
const LEVELS = ['calm', 'annoyed', 'angry'] as const;

export function validateDifficultyPresets(presets: typeof DIFFICULTY_PRESETS) {
  for (const difficulty of DIFFICULTIES) {
    const preset = presets[difficulty];

    positive(preset.timeScale, `${difficulty}.timeScale`);
    positive(preset.inputScale, `${difficulty}.inputScale`);

    for (const level of LEVELS) validateCharm(preset, level, difficulty);
  }
}

function positive(value: number, path: string) {
  if (!Number.isFinite(value) || value <= 0)
    throw new Error(`difficulty.json: ${path} must be finite and positive`);
}

function integer(value: number, path: string) {
  positive(value, path);

  if (!Number.isSafeInteger(value)) throw new Error(`difficulty.json: ${path} must be an integer`);
}

type DifficultyPreset = typeof DIFFICULTY_PRESETS.normal;

function validateCharm(preset: DifficultyPreset, level: ReconciliationLevel, path: string) {
  const length = CHARM_PROFILES[level].length + preset.lengthDelta;
  const inputMs = Math.round(CHARM_PROFILES[level].inputMs * preset.inputScale);

  integer(preset.hearts[level], `${path}.hearts.${level}`);
  integer(length, `${path}.lengthDelta + ${level} length`);
  positive(inputMs, `${path}.${level} inputMs`);
}

validateDifficultyPresets(DIFFICULTY_PRESETS);

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
    sequences: preset.hearts[level],
    inputMs: Math.round(normal.inputMs * preset.inputScale),
  });
}

export const LIVING_ROOM_DENSITY = {
  easyOmit: config.livingRoom.easyOmit,
  hardPlatforms: config.livingRoom.hardPlatforms.map((shelf) => ({
    id: shelf.id,
    asset: 'wood-shelf' as const,
    bounds: { x: shelf.x, y: shelf.y, width: shelf.width, height: 16 },
  })),
  hardAdd: config.livingRoom.hardAdd.map((vase): ObjectInstance => ({
    id: vase.id,
    variant: vase.variant,
    placement: { mode: 'surface', x: vase.x, surfaceId: vase.surfaceId },
  })),
} as const;

export function difficultyRoom(room: RoomDefinition, difficulty: Difficulty): RoomDefinition {
  const density = room.difficultyObjects;

  if (difficulty === 'normal' || !density) return room;
  const objects =
    difficulty === 'easy'
      ? room.objects.filter((object) => !density.easyOmit.includes(object.id))
      : [...room.objects, ...density.hardAdd];

  const platforms = difficultyPlatforms(room, difficulty);

  return { ...room, objects, platforms };
}

function difficultyPlatforms(room: RoomDefinition, difficulty: Difficulty) {
  return difficulty === 'hard'
    ? [...room.platforms, ...(room.difficultyObjects?.hardPlatforms ?? [])]
    : room.platforms;
}
