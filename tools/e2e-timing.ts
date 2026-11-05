import type { RoundConfig } from '../src/game/domain/round-controller.ts';

export const FAST_ROUND_CONFIG = Object.freeze({
  minDurationMs: 8_000,
  maxDurationMs: 10_000,
} satisfies RoundConfig);

/** Build-time only: production and full runs have no short-profile entry point. */
export function roundConfigForBuild(mode: string, fullRound: string | undefined) {
  if (mode !== 'e2e' || fullRound === '1') return undefined;

  if (fullRound !== undefined && fullRound !== '0')
    throw new Error('E2E_FULL_ROUND must be 0 or 1');

  return FAST_ROUND_CONFIG;
}
