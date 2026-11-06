import { TouchControls } from './TouchControls';
import { DIRECTIONS } from '../../content/reconciliation';
import Phaser from 'phaser';
import { InputFrames, type InputState } from './input-state';

const BLOCKED_INPUT: InputState = Object.freeze({
  arrows: Object.freeze([]),
  horizontal: 0,
  vertical: 0,
  jumpPressed: false,
  confirmPressed: false,
  resetPressed: false,
  active: false,
});

/** Owns keyboard and pointer bindings and their lifecycle; consumers only receive InputState. */
export class InputController {
  private readonly keyboard: Phaser.Input.Keyboard.KeyboardPlugin;
  private readonly keys: Record<
    'left' | 'right' | 'up' | 'down' | 'jump' | 'reset',
    Phaser.Input.Keyboard.Key
  >;

  private readonly frames = new InputFrames();
  private readonly touch = new TouchControls();

  // eslint-disable-next-line max-lines-per-function -- Die sechs deklarativen Tastenbindungen bleiben gemeinsam neben der zugehörigen Blur-Anmeldung.
  constructor(private readonly scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;

    if (!keyboard) throw new Error('Pixel’s World requires keyboard input.');
    this.keyboard = keyboard;
    this.keys = {
      left: keyboard.addKey('LEFT'),
      right: keyboard.addKey('RIGHT'),
      up: keyboard.addKey('UP'),
      down: keyboard.addKey('DOWN'),
      jump: keyboard.addKey('SPACE'),
      reset: keyboard.addKey('R'),
    };
    scene.game.events.on(Phaser.Core.Events.BLUR, this.release, this);
  }

  read(frame: number) {
    if (this.focusBlocked()) {
      this.release();

      return BLOCKED_INPUT;
    }

    return this.frames.read(frame, () => this.readKeys());
  }

  private focusBlocked() {
    const focused = document.activeElement;

    return (
      !!focused?.closest('a, button, input, textarea, select') &&
      !focused.closest('.touch-controls')
    );
  }

  // eslint-disable-next-line max-lines-per-function -- Ein deklarativer Snapshot konsumiert jede Tastenflanke genau einmal pro Frame.
  private readKeys() {
    const k = this.keys;
    const touch = this.touch.read();
    const held = (action: keyof typeof k) => k[action].isDown || touch.held.includes(action);
    const space = this.readSpace();

    return {
      horizontal: Number(held('right')) - Number(held('left')),
      vertical: Number(held('down')) - Number(held('up')),
      jumpPressed: space.jumpPressed || touch.pressed.includes('jump'),
      confirmPressed: space.confirmPressed || touch.pressed.includes('jump'),
      arrows: Object.freeze(
        DIRECTIONS.filter(
          (direction) => freshDown(k[direction]) || touch.pressed.includes(direction),
        ),
      ),
      resetPressed: Phaser.Input.Keyboard.JustDown(k.reset) || touch.pressed.includes('reset'),
      active:
        Object.values(k).some((key) => key.isDown) ||
        touch.held.length > 0 ||
        touch.pressed.length > 0,
    };
  }

  private readSpace() {
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.keys.jump);

    return { jumpPressed, confirmPressed: jumpPressed && !this.keys.jump.originalEvent?.repeat };
  }

  release() {
    this.keyboard.resetKeys();
    this.touch.clear();
    this.frames.clear();
  }

  destroy() {
    this.touch.destroy();
    this.scene.game.events.off(Phaser.Core.Events.BLUR, this.release, this);

    for (const key of Object.values(this.keys)) {
      // Phaser may already have removed Key objects during its own shutdown.
      this.keyboard.removeCapture(key.keyCode);
      this.keyboard.removeKey(key, true);
    }

    this.frames.clear();
  }
}

function freshDown(key: Phaser.Input.Keyboard.Key) {
  return Phaser.Input.Keyboard.JustDown(key) && !key.originalEvent?.repeat;
}
