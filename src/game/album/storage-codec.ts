import { EMPTY_ACHIEVEMENTS, type AchievementData } from './achievements.ts';

// eslint-disable-next-line max-lines-per-function -- Alte Albumdaten und der gemeinsame neue Speicherstand werden an einer Versionsgrenze gelesen.
export function decodeAlbum(raw: string) {
  const data = JSON.parse(raw) as {
    version?: unknown;
    discovered?: unknown;
    unlocked?: unknown;
    achievements?: unknown;
  };

  if (newer(data)) return null;

  if (!data || !supported(data.version)) throw new Error('Unsupported album');
  const entries = strings(data.version === 0 ? data.unlocked : data.discovered);

  if (data.version !== 2)
    return {
      entries,
      achievements: EMPTY_ACHIEVEMENTS,
      recovered: false,
      migrate: data.version === 0,
    };

  try {
    return {
      entries,
      achievements: achievements(data.achievements),
      recovered: false,
      migrate: false,
    };
  } catch {
    return { entries, achievements: EMPTY_ACHIEVEMENTS, recovered: true, migrate: false };
  }
}

function strings(value: unknown): string[] {
  if (!Array.isArray(value) || value.some((id) => typeof id !== 'string'))
    throw new Error('Invalid entries');

  return value;
}

function achievements(value: unknown): AchievementData {
  const data = value as AchievementData | undefined;

  if (!data || !Number.isSafeInteger(data.reconciliations) || data.reconciliations < 0)
    throw new Error('Invalid progress');

  return {
    reconciliations: data.reconciliations,
    ruined: strings(data.ruined),
    unlocked: strings(data.unlocked),
  };
}

function supported(version: unknown) {
  return typeof version === 'number' && [0, 1, 2].includes(version);
}

function newer(data: { version?: unknown } | null) {
  return !!data && typeof data.version === 'number' && data.version > 2;
}
