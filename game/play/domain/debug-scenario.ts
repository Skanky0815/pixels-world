/** Scene-owned input contract; developer tools provide these values through their guarded port. */
export interface DebugScenario {
  readonly target:
    'chaos' | 'returning' | 'reaction' | 'reconciliation' | 'result-success' | 'result-failed';
  readonly score: number;
  readonly seconds: number;
  readonly seed: number;
}
