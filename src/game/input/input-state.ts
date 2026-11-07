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
  private pending: InputState | undefined;

  read(frame: number, sample: () => InputState): InputState {
    if (this.frame !== frame || !this.current) {
      this.current = Object.freeze(resumeInput(sample(), this.pending));
      this.pending = undefined;
      this.frame = frame;
    }

    return this.current;
  }

  defer(input: InputState) {
    this.pending = input;
  }

  clear() {
    this.frame = -1;
    this.current = undefined;
    this.pending = undefined;
  }
}

/** Carry only unconsumed edges across the first zero-delta resume frame, never held movement. */
// eslint-disable-next-line max-lines-per-function -- Der flache unveränderliche Eingabevertrag führt nur unbenutzte Flanken zusammen; Bewegung stammt vom aktuellen Frame.
function resumeInput(current: InputState, pending: InputState | undefined): InputState {
  if (!pending) return current;

  return {
    ...current,
    jumpPressed: current.jumpPressed || pending.jumpPressed,
    confirmPressed: current.confirmPressed || pending.confirmPressed,
    resetPressed: current.resetPressed || pending.resetPressed,
    arrows: Object.freeze([...new Set([...pending.arrows, ...current.arrows])]),
    active: current.active || pending.active,
  };
}
