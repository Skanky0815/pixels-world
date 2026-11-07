import { difficultyCharm, type Difficulty } from '../../content/difficulty.ts';
import { angerFor } from './chaos.ts';
import { CHARM_PROFILES, CHARM_TIMING, DIRECTIONS } from '../../content/reconciliation.ts';
import type { CharmProfile, Direction, ReconciliationLevel } from '../../content/reconciliation.ts';

type Stage =
  'waiting' | 'reading' | 'cue' | 'input' | 'feedback' | 'finale' | 'complete' | 'failed';
type Feedback = 'none' | 'correct' | 'sequence' | 'wrong' | 'timeout';
export type ReconciliationSnapshot = ReturnType<Reconciliation['snapshot']>;

/** Pure active-time minigame; snapshots expose only the next arrow, never the sequence. */
export class Reconciliation {
  private stage: Stage = 'waiting';
  private level: ReconciliationLevel = 'calm';
  private difficulty: Difficulty = 'normal';
  private profile: CharmProfile = CHARM_PROFILES.calm;
  private sequence: Direction[] = [];
  private index = 0;
  private successes = 0;
  private failures = 0;
  private heartFailures = 0;
  private remainingMs = 0;
  private feedback: Feedback = 'none';
  private readonly random: () => number;

  constructor(random: () => number = Math.random) {
    this.random = random;
  }

  start(score: number, difficulty: Difficulty = 'normal') {
    if (this.stage !== 'waiting') return false;
    this.level = angerFor(score).id;
    this.difficulty = difficulty;
    this.profile = difficultyCharm(difficulty, this.level);
    this.stage = 'reading';

    return true;
  }

  advance(deltaMs: number) {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0 || !this.timed()) return;
    this.remainingMs = Math.max(0, this.remainingMs - deltaMs);

    if (this.remainingMs === 0) this.expire();
  }

  private timed() {
    return ['cue', 'input', 'finale'].includes(this.stage);
  }

  private expire() {
    if (this.stage === 'input') this.fail('timeout');
    else if (this.stage === 'cue') this.expectInput();
    else if (this.stage === 'finale') this.stage = 'complete';
  }

  confirm() {
    if (this.stage !== 'reading' && this.stage !== 'feedback') return false;
    this.nextSequence();

    return true;
  }

  input(directions: readonly Direction[]) {
    if (this.stage !== 'input' || directions.length === 0) return;

    if (directions.length !== 1 || directions[0] !== this.sequence[this.index]) this.fail('wrong');
    else this.correct();
  }

  private correct() {
    this.index++;
    this.feedback = 'correct';

    if (this.index === this.sequence.length) this.succeed();
    else this.showCue();
  }

  private succeed() {
    this.successes++;
    this.heartFailures = 0;
    this.feedback = 'sequence';
    this.stage = this.successes === this.profile.sequences ? 'finale' : 'feedback';
    this.remainingMs = this.stage === 'finale' ? CHARM_TIMING.finaleMs : 0;
  }

  private fail(reason: 'wrong' | 'timeout') {
    this.failures++;
    this.heartFailures++;
    this.feedback = reason;
    this.stage = this.heartFailures >= CHARM_TIMING.attemptsPerHeart ? 'failed' : 'feedback';
    this.remainingMs = 0;
  }

  private nextSequence() {
    this.sequence = Array.from({ length: this.profile.length }, () => this.chooseDirection());
    this.index = 0;
    this.showCue();
  }

  private chooseDirection(): Direction {
    const sample = this.random();

    if (!Number.isFinite(sample) || sample < 0 || sample > 1)
      throw new Error('Invalid random sample');

    return DIRECTIONS[Math.min(DIRECTIONS.length - 1, Math.floor(sample * DIRECTIONS.length))];
  }

  private showCue() {
    this.stage = 'cue';
    this.remainingMs = CHARM_TIMING.cueMs;
  }

  private expectInput() {
    this.stage = 'input';
    this.remainingMs = this.inputWindow();
    this.feedback = 'none';
  }

  private inputWindow() {
    const help =
      Math.floor(this.heartFailures / CHARM_TIMING.helpEveryFailures) * CHARM_TIMING.helpStepMs;

    return Math.min(CHARM_TIMING.maxInputMs, this.profile.inputMs + help);
  }

  // eslint-disable-next-line max-lines-per-function -- Der flache unveränderliche Spielvertrag enthält ausschließlich die nächste Taste und sichtbaren Fortschritt.
  snapshot() {
    return Object.freeze({
      stage: this.stage,
      level: this.level,
      difficulty: this.difficulty,
      feedback: this.feedback,
      expected: this.stage === 'input' ? this.sequence[this.index] : null,
      step: this.index,
      length: this.profile.length,
      successes: this.successes,
      required: this.profile.sequences,
      failures: this.failures,
      attemptsLeft: CHARM_TIMING.attemptsPerHeart - this.heartFailures,
      remainingMs: this.remainingMs,
      inputMs: this.inputWindow(),
      progress: this.successes / this.profile.sequences,
    });
  }
}
