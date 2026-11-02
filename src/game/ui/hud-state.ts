/** Display data only: the scene owns gameplay decisions and score calculation. */
export interface HudState {
  readonly score: number;
  readonly anger: { readonly label: string; readonly color: number };
  readonly angerRatio: number;
  readonly activity: 'idle' | 'climbing' | 'sliding' | 'scratching' | 'nibbling' | 'wobbling';
  readonly nearCurtain: boolean;
}
