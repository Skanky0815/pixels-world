import { KeyboardRelease } from '../../shared/input/keyboard-release';
import { keyboardBindings } from '../../shared/input/keyboard-bindings';
import { keyboardPreferences } from '../../shared/input/keyboard-preferences';
import { InputSources } from './input-sources';
import { TouchControls } from './TouchControls';
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
  private keys: {
    binding: ReturnType<typeof keyboardBindings>[number];
    key: Phaser.Input.Keyboard.Key;
  }[] = [];

  private readonly sources = new InputSources();
  private readonly freshKeys = new Set<string>();
  private readonly unsubscribeKeyboard: () => void;

  private readonly frames = new InputFrames();
  private readonly keyboardRelease = new KeyboardRelease();
  private readonly abort = new AbortController();
  private readonly touch = new TouchControls(this.sources);

  // eslint-disable-next-line max-lines-per-function -- Bindungen, Optionswechsel und Fokusgrenzen teilen die Szenenlebensdauer.
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly acceptsPageFocus: () => boolean = () => false,
  ) {
    const keyboard = scene.input.keyboard;

    if (!keyboard) throw new Error('Pixel’s World requires keyboard input.');
    this.keyboard = keyboard;
    this.bindKeys();
    this.unsubscribeKeyboard = keyboardPreferences.subscribe(() => {
      this.release();
      this.removeKeys();
      this.bindKeys();
    });
    this.bindKeyboardRelease();
    scene.game.events.on(Phaser.Core.Events.BLUR, this.release, this);
  }

  // eslint-disable-next-line max-lines-per-function -- Physische Tasten und beide Browser-Fokusgrenzen teilen denselben abbrechbaren Listener-Lebenszyklus.
  private bindKeyboardRelease() {
    const options = { capture: true, signal: this.abort.signal };

    window.addEventListener('keydown', (event) => this.trackDown(event), options);
    window.addEventListener(
      'keydown',
      (event) => {
        if (
          !this.focusBlocked() &&
          !modified(event) &&
          this.keys.some(({ binding }) => binding.code === event.code)
        )
          event.preventDefault();
      },
      { signal: this.abort.signal },
    );
    window.addEventListener(
      'keyup',
      (event) => {
        this.keyboardRelease.up(event.code);
        this.sources.releaseSource(event.code);
      },
      options,
    );
    window.addEventListener('blur', () => this.keyboardRelease.blur(), options);
    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.hidden) this.keyboardRelease.blur();
      },
      options,
    );
  }

  private trackDown(event: KeyboardEvent) {
    const fresh = this.keyboardRelease.down(event.code, event.repeat);

    if (this.focusBlocked() || modified(event)) return this.release();
    const binding = this.keys.find(({ binding }) => binding.code === event.code)?.binding;

    if (!binding || !fresh || controlActivation(event)) return;

    if (this.sources.press(event.code, binding.action)) this.freshKeys.add(event.code);
  }

  private bindKeys() {
    this.keys = keyboardBindings(keyboardPreferences.snapshot()).map((binding) => ({
      binding,
      key: this.keyboard.addKey(binding.key, false),
    }));
  }

  private removeKeys() {
    for (const { key } of this.keys) {
      this.keyboard.removeCapture(key.keyCode);
      this.keyboard.removeKey(key, true);
    }
  }

  read(frame: number) {
    if (this.focusBlocked()) {
      this.release();

      return BLOCKED_INPUT;
    }

    return this.frames.read(frame, () => this.readKeys());
  }

  // eslint-disable-next-line max-lines-per-function -- Spielhost und native Bedienfelder definieren gemeinsam die Grenze für Spielaktionen.
  private focusBlocked() {
    const focused = document.activeElement;

    return (
      !!document.querySelector('dialog[open]') ||
      ['menu-open', 'room-selecting', 'album-open'].some((screen) =>
        document.documentElement.classList.contains(screen),
      ) ||
      (!focused?.closest('#game, [data-control]') && !this.acceptsPageFocus()) ||
      !!focused?.closest(
        'a, button:not([data-control]), input, textarea, select, summary, [contenteditable]:not([contenteditable="false"])',
      )
    );
  }

  // eslint-disable-next-line max-lines-per-function -- Physische Tastatur- und Touchquellen werden einmal pro Frame vor der semantischen Zusammenführung erfasst.
  private readKeys() {
    const touch = this.touch.read();
    const keyboard = this.keys.map(({ binding, key }) => ({
      id: binding.code,
      action: binding.action,
      held: key.isDown && this.keyboardRelease.allows(binding.code),
      pressed:
        freshDown(key) &&
        this.freshKeys.has(binding.code) &&
        this.keyboardRelease.allows(binding.code),
    }));
    const actions = new Set([...touch.held, ...touch.pressed]);

    this.freshKeys.clear();

    return this.sources.read([
      ...keyboard,
      ...Array.from(actions, (action) => ({
        id: `touch:${action}`,
        action,
        held: touch.held.includes(action),
        pressed: touch.pressed.includes(action),
      })),
    ]);
  }

  defer(input: InputState) {
    this.frames.defer(input);
  }

  setActionLabel(label: 'Sprung' | 'Weiter') {
    this.touch.setActionLabel(label);
  }

  showResult(available: boolean) {
    this.touch.showResult(available);
  }

  release() {
    this.keyboardRelease.release();
    this.keyboard.resetKeys();
    this.touch.clear();
    this.frames.clear();
    this.sources.clear();
    this.freshKeys.clear();
  }

  destroy() {
    this.abort.abort();
    this.touch.destroy();
    this.scene.game.events.off(Phaser.Core.Events.BLUR, this.release, this);

    this.unsubscribeKeyboard();
    this.removeKeys();

    this.frames.clear();
  }
}

function freshDown(key: Phaser.Input.Keyboard.Key) {
  return Phaser.Input.Keyboard.JustDown(key) && !key.originalEvent?.repeat;
}

function modified(event: KeyboardEvent) {
  return event.altKey || event.ctrlKey || event.metaKey;
}

function controlActivation(event: KeyboardEvent) {
  return (
    event.target instanceof Element &&
    !!event.target.closest('[data-control]') &&
    ['Space', 'Enter'].includes(event.code)
  );
}
