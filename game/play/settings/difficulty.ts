import { isDifficulty, type Difficulty } from '../content/difficulty.ts';
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;
export const DIFFICULTY_STORAGE_KEY = 'pixels-world.difficulty';

function restore(storage?: StoragePort): Difficulty {
  try {
    const value = storage?.getItem(DIFFICULTY_STORAGE_KEY);

    return isDifficulty(value) ? value : 'normal';
  } catch {
    return 'normal';
  }
}

export class DifficultyPreferences {
  private selected: Difficulty;
  private readonly listeners = new Set<() => void>();
  private readonly storage?: StoragePort;

  constructor(storage?: StoragePort) {
    this.storage = storage;
    this.selected = restore(storage);
  }

  snapshot() {
    return this.selected;
  }

  set(value: Difficulty) {
    if (!isDifficulty(value) || value === this.selected) return;
    this.selected = value;

    this.save(value);

    for (const listener of this.listeners) listener();
  }

  private save(value: Difficulty) {
    try {
      this.storage?.setItem(DIFFICULTY_STORAGE_KEY, value);
    } catch {
      /* Session settings remain usable. */
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
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

export const difficultyPreferences = new DifficultyPreferences(browserStorage());
