export const WASD_STORAGE_KEY = 'pixels-world.wasd';
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;

export class KeyboardPreferences {
  private enabled = false;
  private readonly listeners = new Set<() => void>();

  private readonly storage?: StoragePort;

  constructor(storage?: StoragePort) {
    this.storage = storage;

    try {
      this.enabled = storage?.getItem(WASD_STORAGE_KEY) === 'true';
    } catch {
      /* Keep arrow keys as the default when storage is blocked. */
    }
  }

  snapshot() {
    return this.enabled;
  }

  setEnabled(enabled: boolean) {
    if (enabled === this.enabled) return;
    this.enabled = enabled;

    try {
      this.storage?.setItem(WASD_STORAGE_KEY, String(enabled));
    } catch {
      /* The current session remains usable without storage. */
    }

    for (const listener of this.listeners) listener();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }
}

function storage() {
  try {
    return localStorage;
  } catch {
    return undefined;
  }
}

export const keyboardPreferences = new KeyboardPreferences(storage());
