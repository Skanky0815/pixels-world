import { audioPreferences } from '../../settings/audio.ts';

interface SoundPort {
  volume: number;
  pauseOnBlur: boolean;
  pauseAll(): void;
  resumeAll(): void;
  stopAll(): void;
}

/** The game currently has only an effects channel; all audio uses master × effects. */
export class GameAudio {
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

    if (active) this.sound.resumeAll();
    else this.sound.pauseAll();
  }

  snapshot() {
    return Object.freeze({
      ...audioPreferences.snapshot(),
      volume: this.sound.volume,
      paused: !this.active,
    });
  }

  destroy() {
    this.unsubscribe();
    this.sound.stopAll();
  }
}
