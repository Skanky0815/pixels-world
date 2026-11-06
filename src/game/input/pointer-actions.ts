import type { Direction } from '../../content/reconciliation.ts';

export type ControlAction = Direction | 'jump' | 'reset';

/** Pointer ownership prevents one finger from releasing another finger's action. */
export class PointerActions {
  private readonly pointers = new Map<number, ControlAction>();
  private readonly pressed = new Set<ControlAction>();

  press(id: number, action: ControlAction) {
    if (this.pointers.has(id)) return;

    if (![...this.pointers.values()].includes(action)) this.pressed.add(action);
    this.pointers.set(id, action);
  }

  release(id: number, cancelled = false) {
    const action = this.pointers.get(id);

    this.pointers.delete(id);

    if (cancelled && action && ![...this.pointers.values()].includes(action))
      this.pressed.delete(action);
  }

  action(id: number) {
    return this.pointers.get(id);
  }

  ids() {
    return [...this.pointers.keys()];
  }

  read() {
    const held = Object.freeze([...new Set(this.pointers.values())]);
    const pressed = Object.freeze([...this.pressed]);

    this.pressed.clear();

    return Object.freeze({ held, pressed });
  }

  held(action: ControlAction) {
    return [...this.pointers.values()].includes(action);
  }

  clear() {
    this.pointers.clear();
    this.pressed.clear();
  }
}
