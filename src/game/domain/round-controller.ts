export type RoundPhase = 'chaos' | 'returning' | 'reaction' | 'reconciliation';
export type RoundHint = 'time' | 'soon' | 'imminent' | 'home';
export interface RoundConfig {
  readonly minDurationMs: number;
  readonly maxDurationMs: number;
}
export interface RoundSnapshot {
  readonly phase: RoundPhase;
  readonly elapsedMs: number;
  readonly returnAtMs: number;
  readonly finalChaosScore: number | null;
  readonly hint: RoundHint;
}

export const ROUND_CONFIG: RoundConfig = { minDurationMs: 60_000, maxDurationMs: 105_000 };
export const ROUND_HINTS = { soonRemainingRatio: 0.4, imminentRemainingRatio: 0.15 } as const;

/** Pure round lifecycle; only ordered one-shot homecoming transitions are accepted. */
export class RoundController {
  private phase: RoundPhase = 'chaos';
  private elapsedMs = 0;
  private finalChaosScore: number | null = null;
  private returnAtMs: number;
  private readonly config: RoundConfig;
  private readonly random: () => number;

  constructor(config: RoundConfig = ROUND_CONFIG, random: () => number = Math.random) {
    validateConfig(config);
    this.config = { ...config };
    this.random = random;
    this.returnAtMs = chooseDuration(this.config, this.random());
  }

  /** Called after the last eligible frame's actions, including all score awards. */
  advance(deltaMs: number, score: number, active = true): boolean {
    if (!active || this.phase !== 'chaos' || !Number.isFinite(deltaMs) || deltaMs <= 0)
      return false;
    this.elapsedMs = Math.min(this.returnAtMs, this.elapsedMs + deltaMs);

    if (this.elapsedMs < this.returnAtMs) return false;
    this.finish(score);

    return true;
  }

  private finish(score: number) {
    if (!Number.isSafeInteger(score) || score < 0) throw new Error('Invalid final chaos score');
    this.finalChaosScore = score;
    this.phase = 'returning';
  }

  startReaction() {
    if (this.phase !== 'returning') return false;
    this.phase = 'reaction';

    return true;
  }

  startReconciliation() {
    if (this.phase !== 'reaction') return false;
    this.phase = 'reconciliation';

    return true;
  }

  reset() {
    const duration = chooseDuration(this.config, this.random());

    this.phase = 'chaos';
    this.elapsedMs = 0;
    this.finalChaosScore = null;
    this.returnAtMs = duration;
  }

  snapshot(): RoundSnapshot {
    return Object.freeze({
      phase: this.phase,
      elapsedMs: this.elapsedMs,
      returnAtMs: this.returnAtMs,
      finalChaosScore: this.finalChaosScore,
      hint: this.hint(),
    });
  }

  private hint(): RoundHint {
    if (this.phase !== 'chaos') return 'home';
    const remaining = this.returnAtMs - this.elapsedMs;

    if (remaining <= this.returnAtMs * ROUND_HINTS.imminentRemainingRatio) return 'imminent';

    return remaining <= this.returnAtMs * ROUND_HINTS.soonRemainingRatio ? 'soon' : 'time';
  }
}

function validateConfig(config: RoundConfig) {
  if (!Number.isSafeInteger(config.minDurationMs) || config.minDurationMs <= 0)
    throw new Error('Invalid minimum round duration');

  if (!Number.isSafeInteger(config.maxDurationMs) || config.maxDurationMs < config.minDurationMs)
    throw new Error('Invalid maximum round duration');
}

function chooseDuration(config: RoundConfig, random: number) {
  if (!Number.isFinite(random) || random < 0 || random > 1)
    throw new Error('Invalid random sample');
  const range = config.maxDurationMs - config.minDurationMs + 1;

  return Math.min(config.maxDurationMs, config.minDurationMs + Math.floor(random * range));
}
