import { t, translateExact, onLanguageChange } from '../../i18n/locale';
import { PointerActions, type ControlAction } from './pointer-actions';

/** Scene-owned DOM adapter; game objects never see DOM events or pointer identifiers. */
export class TouchControls {
  private readonly root = document.createElement('nav');
  private readonly abort = new AbortController();
  private readonly actions = new PointerActions();
  private readonly host: HTMLElement;

  // eslint-disable-next-line max-lines-per-function -- Die zugängliche Steuerungsgruppe wird atomar neben dem Canvas initialisiert und an ihre Lebensdauer gebunden.
  constructor() {
    const host = document.getElementById('game');

    if (!host) throw new Error('Game host missing');
    this.host = host;
    this.root.className = 'touch-controls';
    this.root.setAttribute('aria-label', t('touchControls'));
    const unsubscribe = onLanguageChange(() => this.localize());

    this.abort.signal.addEventListener('abort', unsubscribe, { once: true });
    this.root.innerHTML = markup();
    host.parentElement?.append(this.root);
    this.bindPointers();
    this.bindLifecycle();
    this.root.addEventListener('click', this.virtualClick, { signal: this.abort.signal });
    this.root.addEventListener('keydown', this.keyDown, { signal: this.abort.signal });
    this.root.addEventListener('keyup', this.keyUp, { signal: this.abort.signal });
  }

  private bindPointers() {
    const options = { signal: this.abort.signal };

    this.root.addEventListener('pointerdown', this.down, options);
    this.root.addEventListener('pointermove', this.move, options);
    this.root.addEventListener('pointerup', this.up, options);
    this.root.addEventListener('pointercancel', this.cancel, options);
    this.root.addEventListener('lostpointercapture', this.cancel, options);
  }

  private bindLifecycle() {
    const options = { signal: this.abort.signal };

    window.addEventListener('blur', this.clear, options);
    window.addEventListener('resize', this.clear, options);
    document.addEventListener('visibilitychange', this.clear, options);
    this.root.addEventListener('contextmenu', (event) => event.preventDefault(), options);
  }

  // eslint-disable-next-line max-lines-per-function -- Pointer-Zuordnung und Capture entstehen gemeinsam, bevor weitere Fingerereignisse eintreffen können.
  private readonly down = (event: PointerEvent) => {
    const button = this.button(event.target);

    if (!button || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault();
    this.host.focus({ preventScroll: true });
    const action = button.dataset.control as ControlAction;

    if (action === 'reset') return this.restart();
    this.actions.press(event.pointerId, action);
    this.root.setPointerCapture(event.pointerId);
    this.render();
  };

  private readonly move = (event: PointerEvent) => {
    const action = this.actions.action(event.pointerId);
    const button = action && this.root.querySelector<HTMLElement>(`[data-control="${action}"]`);

    if (button && !inside(button.getBoundingClientRect(), event.clientX, event.clientY))
      this.finish(event.pointerId, true);
  };

  private readonly up = (event: PointerEvent) => this.finish(event.pointerId);
  private readonly cancel = (event: PointerEvent) => this.finish(event.pointerId, true);

  private finish(id: number, cancelled = false) {
    this.actions.release(id, cancelled);

    if (this.root.hasPointerCapture(id)) this.root.releasePointerCapture(id);
    this.render();
  }

  private button(target: EventTarget | null) {
    return target instanceof Element ? target.closest<HTMLButtonElement>('[data-control]') : null;
  }

  private pulse(action: ControlAction) {
    this.actions.press(-2, action);
    this.actions.release(-2);
    this.host.focus({ preventScroll: true });
  }

  private restart() {
    this.clear();

    this.pulse('reset');
  }

  private readonly virtualClick = (event: MouseEvent) => {
    const action = this.button(event.target)?.dataset.control as ControlAction | undefined;

    if (!action || event.detail !== 0) return;

    if (action === 'reset') this.restart();
    else this.pulse(action);
  };

  private readonly keyDown = (event: KeyboardEvent) => {
    const action = this.button(event.target)?.dataset.control as ControlAction | undefined;

    if (!action || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();

    if (event.repeat) return;

    if (action === 'reset') this.restart();
    else this.actions.press(-1, action);
    this.render();
  };

  private readonly keyUp = (event: KeyboardEvent) => {
    if (!['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    this.actions.release(-1);
    this.render();
  };

  private render() {
    for (const button of Array.from(
      this.root.querySelectorAll<HTMLButtonElement>('[data-control]'),
    ))
      button.setAttribute(
        'aria-pressed',
        String(this.actions.held(button.dataset.control as ControlAction)),
      );
  }

  setActionLabel(label: 'Sprung' | 'Weiter') {
    const button = this.root.querySelector<HTMLButtonElement>('[data-control="jump"]');

    if (button && button.textContent !== translateExact(label))
      button.textContent = translateExact(label);
  }

  private localize() {
    this.root.setAttribute('aria-label', t('touchControls'));

    for (const button of Array.from(this.root.querySelectorAll('button'))) {
      button.textContent = translateExact(button.textContent ?? '');
      const label = button.getAttribute('aria-label');

      if (label) button.setAttribute('aria-label', translateExact(label));
    }
  }

  showRestart(available: boolean) {
    const button = this.root.querySelector<HTMLButtonElement>('[data-control="reset"]');

    if (button) button.hidden = !available;
    const action = this.root.querySelector<HTMLButtonElement>('[data-control="jump"]');

    if (action) action.hidden = available;
  }

  read() {
    return this.actions.read();
  }

  readonly clear = () => {
    const ids = this.actions.ids();

    this.actions.clear();

    for (const id of ids) if (this.root.hasPointerCapture(id)) this.root.releasePointerCapture(id);

    if (ids.length) this.render();
  };

  destroy() {
    this.clear();
    this.abort.abort();
    this.root.remove();
  }
}

function inside(rect: DOMRect, x: number, y: number) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

// eslint-disable-next-line max-lines-per-function -- Die sechs beschrifteten Touch-Ziele bleiben als deklarativer zugänglicher Aufbau gemeinsam lesbar.
function markup() {
  return `<div class="touch-directions">
    <button type="button" data-control="up" aria-label="${t('up')}" aria-pressed="false">↑</button>
    <button type="button" data-control="left" aria-label="${t('left')}" aria-pressed="false">←</button>
    <button type="button" data-control="down" aria-label="${t('down')}" aria-pressed="false">↓</button>
    <button type="button" data-control="right" aria-label="${t('right')}" aria-pressed="false">→</button>
  </div><div class="touch-actions">
    <button type="button" data-control="jump" aria-pressed="false">${t('continueLabel')}</button>
    <button type="button" data-control="reset" aria-pressed="false" hidden>${t('newRoundLabel')}</button>
  </div>`;
}
