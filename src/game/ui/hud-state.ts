import type { RoundPhase } from '../domain/round-controller';

/** Display data only: the scene owns gameplay decisions and score calculation. */
export interface HudState {
  readonly round: { readonly phase: RoundPhase };
  readonly score: number;
  readonly nearCurtain: boolean;
}
