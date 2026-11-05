import type { RoundHint, RoundPhase } from '../domain/round-controller';

/** Display data only: the scene owns gameplay decisions and score calculation. */
export interface HudState {
  readonly round: {
    readonly phase: RoundPhase;
    readonly hint: RoundHint;
    readonly paused: boolean;
  };
  readonly score: number;
  readonly anger: { readonly label: string; readonly color: number };
  readonly angerRatio: number;
  readonly activity: 'idle' | 'climbing' | 'sliding' | 'scratching' | 'nibbling' | 'wobbling';
  readonly nearCurtain: boolean;
}
