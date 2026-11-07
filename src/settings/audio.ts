export interface AudioLevels {
  readonly master: number;
  readonly effects: number;
}
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;
export const AUDIO_STORAGE_KEY = 'pixels-world.audio';
const defaults: AudioLevels = { master: 1, effects: 1 };

function valid(value: unknown): value is AudioLevels {
  if (!value || typeof value !== 'object') return false;
  const levels = value as AudioLevels;

  return [levels.master, levels.effects].every(
    (level) => Number.isFinite(level) && level >= 0 && level <= 1,
  );
}

function restore(storage?: StoragePort): AudioLevels {
  try {
    const value: unknown = JSON.parse(storage?.getItem(AUDIO_STORAGE_KEY) ?? 'null');

    return valid(value) ? { master: value.master, effects: value.effects } : defaults;
  } catch {
    return defaults;
  }
}

export class AudioPreferences {
  private levels: AudioLevels;
  private readonly storage?: StoragePort;
  private readonly listeners = new Set<() => void>();

  constructor(storage?: StoragePort) {
    this.storage = storage;
    this.levels = restore(storage);
  }

  snapshot(): AudioLevels {
    return Object.freeze({ ...this.levels });
  }

  update(channel: keyof AudioLevels, value: number) {
    const next = { ...this.levels, [channel]: value };

    if (!valid(next)) return;
    this.levels = next;
    this.save();

    for (const listener of this.listeners) listener();
  }

  private save() {
    try {
      this.storage?.setItem(AUDIO_STORAGE_KEY, JSON.stringify(this.levels));
    } catch {
      /* Settings stay available when storage is blocked. */
    }
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }
}

function browserStorage() {
  try {
    return localStorage;
  } catch {
    return undefined;
  }
}

export const audioPreferences = new AudioPreferences(browserStorage());
