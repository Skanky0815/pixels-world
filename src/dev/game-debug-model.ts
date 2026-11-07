import { HOMECOMING_TIMING, type HomecomingSequence } from '../game/domain/homecoming.ts';
import type { RoundController } from '../game/domain/round-controller.ts';
import type { Reconciliation } from '../game/domain/reconciliation.ts';

export const DEBUG_TARGETS = {
  chaos: 'Chaos',
  returning: 'Heimkehr',
  reaction: 'Reaktion',
  reconciliation: 'Versöhnung',
  'result-success': 'Ergebnis · versöhnt',
  'result-failed': 'Ergebnis · gescheitert',
} as const;
export interface DebugScenario {
  readonly target: keyof typeof DEBUG_TARGETS;
  readonly score: number;
  readonly seconds: number;
  readonly seed: number;
}
export interface DebugPort {
  readonly round: RoundController;
  readonly homecoming: HomecomingSequence;
  readonly charm: Reconciliation;
  configure(scenario: DebugScenario, random: () => number): void;
  restart(scenario: DebugScenario): void;
  startHomecoming(): void;
  sync(): void;
  forward(): void;
  release(): void;
  read(): {
    readonly generation: number;
    readonly started: boolean;
    readonly active: boolean;
    readonly round: ReturnType<RoundController['snapshot']>;
    readonly chaos: { readonly score: number; readonly anger: string };
    readonly homecoming: ReturnType<HomecomingSequence['snapshot']>;
    readonly reconciliation: ReturnType<Reconciliation['snapshot']>;
    readonly pixelReturn: { readonly stage: string };
    readonly pixel: {
      readonly x: number;
      readonly y: number;
      readonly animation: string | null;
      readonly animationFrame: number;
    };
    readonly blurListeners: number;
  };
}

/** Validate at the DEV boundary before replacing a scene; never accept partial/broken scenarios. */
export function debugScenario(value: DebugScenario): DebugScenario {
  const { target, score, seconds, seed } = value;

  if (!Object.hasOwn(DEBUG_TARGETS, target)) throw new Error('Ungültige Debug-Phase');
  integer(score, 0, 10_000);
  integer(seconds, 1, 600);
  integer(seed, 0, 0xffffffff);

  return Object.freeze({ target, score, seconds, seed });
}

function integer(value: number, min: number, max: number) {
  if (!Number.isSafeInteger(value) || value < min || value > max)
    throw new Error(`Debug-Wert muss ganzzahlig zwischen ${min} und ${max} liegen.`);
}

// eslint-disable-next-line max-lines-per-function -- Das Szenario setzt ausschließlich bestehende Modelle auf und folgt deren echten Übergängen.
export function prepareDebugScenario(
  port: DebugPort,
  scenario: DebugScenario,
  random: () => number,
) {
  port.configure(scenario, random);

  if (scenario.target === 'chaos') return;
  port.startHomecoming();

  if (scenario.target === 'returning') return;
  port.homecoming.advance(
    HOMECOMING_TIMING.entering + (scenario.target === 'reaction' ? 0 : HOMECOMING_TIMING.reacting),
  );
  port.sync();
}

export function advanceDebugScenario(port: DebugPort, target: DebugScenario['target']) {
  if (port.read().pixelReturn.stage !== 'seated') return false;
  port.homecoming.confirm();
  port.sync();

  if (target === 'result-success' || target === 'result-failed')
    finishDebugReconciliation(port.charm, target === 'result-success');
  port.sync();

  return true;
}

/** Drive the real minigame APIs instead of setting hearts, phase or result fields. */

export function finishDebugReconciliation(charm: Reconciliation, success: boolean) {
  for (let step = 0; step < 100; step++) {
    const snapshot = charm.snapshot();

    if (snapshot.stage === 'complete' || snapshot.stage === 'failed') return;

    stepReconciliation(charm, success);
  }

  throw new Error('Debug-Ablauf überschreitet sein Schrittlimit.');
}

function stepReconciliation(charm: Reconciliation, success: boolean) {
  const snapshot = charm.snapshot();

  if (snapshot.stage === 'reading' || snapshot.stage === 'feedback') return void charm.confirm();

  if (snapshot.stage === 'input') return inputReconciliation(charm, success);

  if (snapshot.stage === 'cue' || snapshot.stage === 'finale')
    return void charm.advance(snapshot.remainingMs);
  throw new Error('Versöhnung wurde noch nicht gestartet.');
}

function inputReconciliation(charm: Reconciliation, success: boolean) {
  const snapshot = charm.snapshot();

  if (success && snapshot.expected) charm.input([snapshot.expected]);
  else charm.advance(snapshot.remainingMs);
}
