import Phaser from 'phaser';
import { InputFrames } from './input-state';

/** Owns keyboard bindings and their lifecycle; consumers only receive InputState. */
export class InputController {
  private readonly keyboard: Phaser.Input.Keyboard.KeyboardPlugin;
  private readonly keys: Record<
    'left' | 'right' | 'up' | 'down' | 'jump' | 'reset',
    Phaser.Input.Keyboard.Key
  >;

  private readonly frames = new InputFrames();

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
    return this.frames.read(frame, () => this.readKeys());
  }

  private readKeys() {
    const k = this.keys;

    return {
      horizontal: Number(k.right.isDown) - Number(k.left.isDown),
      vertical: Number(k.down.isDown) - Number(k.up.isDown),
      jumpPressed: Phaser.Input.Keyboard.JustDown(k.jump),
      resetPressed: Phaser.Input.Keyboard.JustDown(k.reset),
      active: [k.left, k.right, k.up, k.down, k.jump].some((key) => key.isDown),
    };
  }

  release() {
    this.keyboard.resetKeys();
    this.frames.clear();
  }

  destroy() {
    this.scene.game.events.off(Phaser.Core.Events.BLUR, this.release, this);

    for (const key of Object.values(this.keys)) {
      // Phaser may already have removed Key objects during its own shutdown.
      this.keyboard.removeCapture(key.keyCode);
      this.keyboard.removeKey(key, true);
    }

    this.frames.clear();
  }
}
