import type { Direction } from '../../content/reconciliation.ts';

export interface InputState {
  readonly arrows: readonly Direction[];
  readonly horizontal: number;
  readonly vertical: number;
  readonly jumpPressed: boolean;
  readonly confirmPressed: boolean;
  readonly resetPressed: boolean;
  readonly active: boolean;
}

/** Cache the adapter read, including consumed key edges, for one game frame. */
export class InputFrames {
  private frame = -1;
  private current: InputState | undefined;

  read(frame: number, sample: () => InputState): InputState {
    if (this.frame !== frame || !this.current) {
      this.current = Object.freeze(sample());
      this.frame = frame;
    }

    return this.current;
  }

  clear() {
    this.frame = -1;
    this.current = undefined;
  }
}
