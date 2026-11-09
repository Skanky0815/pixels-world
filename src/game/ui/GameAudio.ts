import { CUE_VOLUME, damageCue, actionCue, type ObjectCue } from '../assets/object-cues.ts';
import type { ChaosEvent } from '../domain/chaos-event.ts';
import { audioPreferences } from '../../settings/audio.ts';

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
  private previousY: number | undefined;
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

  updatePixel(action: string, y: number) {
    const moving = this.previousY !== undefined && Math.abs(y - this.previousY) > 0.01;

    this.previousY = y;
    this.syncAction(actionCue(action, moving));
  }

  private syncAction(cue: ObjectCue | undefined) {
    if (!this.available()) return this.stopAction();

    if (cue === this.action) return;
    this.stopAction();

    if (!cue || this.full()) return;
    this.actionKey = this.startCue(cue, true);
    this.action = this.actionKey ? cue : undefined;
  }

  private stopAction() {
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
    this.previousY = undefined;
    this.sound.stopAll();
    this.sound.removeAll();
  }

  destroy() {
    this.active = false;
    this.unsubscribe();
    this.stopEffects();
  }
}
