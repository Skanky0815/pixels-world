import type { PhysicsProgress } from '../domain/physics-progress.ts';
import { CUE_VOLUME, damageCue, actionCue, type ObjectCue } from '../assets/object-cues.ts';
import type { ChaosEvent } from '../domain/chaos-event.ts';
import { audioPreferences } from '../settings/audio.ts';

interface PixelAudioFrame {
  readonly x: number;
  readonly y: number;
  readonly grounded: boolean;
  readonly climbing: boolean;
  readonly velocityX: number;
  readonly velocityY: number;
}

interface SoundPort {
  volume: number;
  pauseOnBlur: boolean;
  locked?: boolean;
  context?: { state: string };
  play?(key: string, config: { volume: number; loop: boolean }): boolean;
  getAllPlaying?(): readonly unknown[];
  removeByKey(key: string): number;
  removeAll(): void;
  stopAll(): void;
}

/** The game currently has only an effects channel; all audio uses master × effects. */
export class GameAudio {
  private variation = 0;
  private action: ObjectCue | undefined;
  private actionKey: string | undefined;
  private previousMotion: PhysicsProgress | undefined;
  private active: boolean | undefined;
  private readonly sound: SoundPort;
  private readonly unsubscribe: () => void;

  constructor(sound: SoundPort) {
    this.sound = sound;
    sound.pauseOnBlur = false;
    this.unsubscribe = audioPreferences.subscribe(() => this.apply());
    this.apply();
  }

  private apply() {
    const levels = audioPreferences.snapshot();

    this.sound.volume = levels.master * levels.effects;

    if (this.sound.volume === 0) this.stopAction();
  }

  setActive(active: boolean) {
    if (this.active === active) return;
    this.active = active;

    if (!active) this.stopEffects();
  }

  playDamage(event: ChaosEvent) {
    const cue = damageCue(event.kind);

    if (cue) this.playObject(cue);
  }

  private available() {
    return (
      this.active &&
      !this.sound.locked &&
      this.sound.volume > 0 &&
      (!this.sound.context || this.sound.context.state === 'running')
    );
  }

  private full() {
    return (this.sound.getAllPlaying?.().length ?? 0) >= 3;
  }

  playObject(cue: ObjectCue) {
    if (this.available() && !this.full()) this.startCue(cue, false);
  }

  private startCue(cue: ObjectCue, loop: boolean) {
    const key = `object-${cue}-${this.variation++ % 2}`;

    return this.sound.play?.(key, { volume: CUE_VOLUME[cue], loop }) ? key : undefined;
  }

  updateMovement(action: string, pixel: PixelAudioFrame, progress: PhysicsProgress) {
    const previous = this.previousMotion;

    this.previousMotion = progress;
    const cue =
      previous?.step === progress.step
        ? this.retainedCue(action, pixel)
        : this.progressCue(action, pixel, progress, previous);

    this.syncAction(cue);
  }

  // eslint-disable-next-line max-lines-per-function -- Echter Schrittfortschritt und aktuelle Bewegungsart entscheiden gemeinsam über den passenden Loop.
  private progressCue(
    action: string,
    pixel: PixelAudioFrame,
    progress: PhysicsProgress,
    previous?: PhysicsProgress,
  ) {
    const dx = previous ? progress.x - previous.x : 0;
    const dy = previous ? progress.y - previous.y : 0;

    if (this.walking(action, pixel) && Math.abs(dx) > 0.01) return 'walk';

    return actionCue(action, pixel.climbing && (action === 'climbing' ? dy < -0.01 : dy > 0.01));
  }

  private retainedCue(action: string, pixel: PixelAudioFrame): ObjectCue | undefined {
    if (this.action === 'walk' && this.walking(action, pixel)) return 'walk';
    const stationary = actionCue(action, false);

    if (stationary) return stationary;
    const movement = actionCue(action, pixel.climbing && Math.abs(pixel.velocityY) > 1);

    return movement === this.action ? movement : undefined;
  }

  private walking(action: string, pixel: PixelAudioFrame) {
    return (
      action === 'idle' &&
      pixel.grounded &&
      !pixel.climbing &&
      Math.abs(pixel.velocityX) > 1 &&
      Math.abs(pixel.velocityY) < 1
    );
  }

  private syncAction(cue: ObjectCue | undefined) {
    if (!this.available()) return this.stopAction();

    if (cue === this.action) return;
    this.stopAction();

    if (!cue || this.full()) return;
    this.actionKey = this.startCue(cue, true);
    this.action = this.actionKey ? cue : undefined;
  }

  stopAction() {
    if (this.actionKey) this.sound.removeByKey(this.actionKey);
    this.action = undefined;
    this.actionKey = undefined;
  }

  snapshot() {
    return Object.freeze({
      ...audioPreferences.snapshot(),
      volume: this.sound.volume,
      paused: !this.active,
    });
  }

  private stopEffects() {
    this.action = undefined;
    this.actionKey = undefined;
    this.previousMotion = undefined;
    this.sound.stopAll();
    this.sound.removeAll();
  }

  destroy() {
    this.active = false;
    this.unsubscribe();
    this.stopEffects();
  }
}
