type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;
interface MotionMedia {
  readonly matches: boolean;
  addEventListener(type: 'change', listener: () => void): void;
  removeEventListener(type: 'change', listener: () => void): void;
}
export const MOTION_STORAGE_KEY = 'pixels-world.reduced-motion';

export class MotionPreferences {
  private readonly storage?: StoragePort;
  private readonly media?: MotionMedia;
  private userReduced = false;
  private readonly listeners = new Set<() => void>();
  private readonly changed = () => {
    for (const listener of this.listeners) listener();
  };

  constructor(storage?: StoragePort, media?: MotionMedia) {
    this.storage = storage;
    this.media = media;

    try {
      this.userReduced = storage?.getItem(MOTION_STORAGE_KEY) === 'true';
    } catch {
      /* Keep the system default when browser storage is blocked. */
    }

    media?.addEventListener('change', this.changed);
  }

  snapshot() {
    return Object.freeze({
      reduced: this.userReduced || !!this.media?.matches,
      system: !!this.media?.matches,
    });
  }

  setReduced(reduced: boolean) {
    this.userReduced = reduced;

    try {
      this.storage?.setItem(MOTION_STORAGE_KEY, String(reduced));
    } catch {
      /* The current preference remains usable without storage. */
    }

    this.changed();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  destroy() {
    this.media?.removeEventListener('change', this.changed);
    this.listeners.clear();
  }
}

function storage() {
  try {
    return localStorage;
  } catch {
    return undefined;
  }
}

export const motionPreferences = new MotionPreferences(
  storage(),
  typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : undefined,
);
