import type { KeyboardAction } from '../../shared/input/keyboard-bindings.ts';
import { DIRECTIONS } from '../content/reconciliation.ts';
import type { InputState } from './input-state.ts';

export interface InputSource {
  readonly id: string;
  readonly action: KeyboardAction;
  readonly held: boolean;
  readonly pressed: boolean;
}

/** Merge physical sources before publishing semantic movement and fresh action edges. */
export class InputSources {
  private previous = new Set<string>();
  private readonly physical = new Map<string, KeyboardAction>();

  /** Event order matters when overlapping sources change between two sampled frames. */
  press(id: string, action: KeyboardAction) {
    const fresh = ![...this.physical.values()].includes(action);

    this.physical.set(id, action);

    return fresh;
  }

  releaseSource(id: string) {
    this.physical.delete(id);
  }

  // eslint-disable-next-line max-lines-per-function -- Derselbe Snapshot vereinigt gehaltene Quellen und dedupliziert Flanken vor allen Spielverbrauchern.
  read(sources: readonly InputSource[]): InputState {
    const held = new Set(sources.filter((source) => source.held).map((source) => source.action));
    const continuing = new Set(
      sources
        .filter((source) => source.held && !source.pressed && this.previous.has(source.id))
        .map((source) => source.action),
    );
    const fresh = new Set(
      sources
        .filter((source) => source.pressed && !continuing.has(source.action))
        .map((source) => source.action),
    );

    this.previous = new Set(sources.filter((source) => source.held).map((source) => source.id));

    return Object.freeze({
      horizontal: Number(held.has('right')) - Number(held.has('left')),
      vertical: Number(held.has('down')) - Number(held.has('up')),
      arrows: Object.freeze(DIRECTIONS.filter((direction) => fresh.has(direction))),
      jumpPressed: fresh.has('jump'),
      confirmPressed: fresh.has('jump'),
      resetPressed: fresh.has('reset'),
      active: held.size > 0 || fresh.size > 0,
    });
  }

  clear() {
    this.previous.clear();
    this.physical.clear();
  }
}
