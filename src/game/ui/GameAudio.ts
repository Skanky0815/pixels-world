import { CUE_VOLUME, damageCue, type ObjectCue } from '../assets/object-cues.ts';
import type { ChaosEvent } from '../domain/chaos-event.ts';
import { audioPreferences } from '../../settings/audio.ts';

interface SoundPort {
  volume: number;
  pauseOnBlur: boolean;
  locked?: boolean;
  context?: { state: string };
  play?(key: string, config: { volume: number }): boolean;
  getAllPlaying?(): readonly unknown[];
  removeAll(): void;
  stopAll(): void;
}

/** The game currently has only an effects channel; all audio uses master × effects. */
export class GameAudio {
  private variation = 0;
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

  // eslint-disable-next-line complexity -- Freigabe und Begrenzung verwerfen Ereignisse sofort; es gibt keine Warteschlange.
  playObject(cue: ObjectCue) {
    if (!this.active || this.sound.locked || this.sound.volume === 0) return;

    if (this.sound.context && this.sound.context.state !== 'running') return;

    if ((this.sound.getAllPlaying?.().length ?? 0) >= 3) return;
    this.sound.play?.(`object-${cue}-${this.variation++ % 2}`, { volume: CUE_VOLUME[cue] });
  }

  snapshot() {
    return Object.freeze({
      ...audioPreferences.snapshot(),
      volume: this.sound.volume,
      paused: !this.active,
    });
  }

  private stopEffects() {
    this.sound.stopAll();
    this.sound.removeAll();
  }

  destroy() {
    this.active = false;
    this.unsubscribe();
    this.stopEffects();
  }
}
