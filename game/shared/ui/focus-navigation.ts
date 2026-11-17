import { nextFocusIndex, type FocusDirection } from './focus-target.ts';

const ARROWS: Readonly<Record<string, FocusDirection>> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};
const TARGETS = 'button, a[href], input, select, textarea, summary, [tabindex]';

export function focusTargets(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>(TARGETS)).filter(canFocus);
}

export function canFocus(element: HTMLElement) {
  return (
    element.tabIndex >= 0 &&
    !element.matches(':disabled, [aria-disabled="true"]') &&
    !element.closest('[hidden], [inert], [aria-hidden="true"]') &&
    element.getClientRects().length > 0 &&
    getComputedStyle(element).visibility !== 'hidden'
  );
}

export function preserveFocus(root: HTMLElement, update: () => void) {
  const index = focusTargets(root).indexOf(document.activeElement as HTMLElement);

  update();

  if (index >= 0 && !root.contains(document.activeElement))
    focusTargets(root)[index]?.focus({ preventScroll: true });
}

/** DOM navigation only; native fields and the game input adapter retain their responsibilities. */
export function installFocusNavigation(root: HTMLElement, signal: AbortSignal, spatial = false) {
  const navigation = new FocusNavigation(root, spatial);
  const options = { signal };

  root.addEventListener('keydown', navigation.down, options);
  root.addEventListener('keyup', navigation.up, options);
  window.addEventListener('keyup', navigation.cancel, options);
  window.addEventListener('blur', navigation.cancel, options);
  root.addEventListener('focusout', navigation.cancel, options);
  document.addEventListener('visibilitychange', navigation.cancel, options);
}

class FocusNavigation {
  private pressed: HTMLElement | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly spatial: boolean,
  ) {}

  // eslint-disable-next-line max-lines-per-function -- Native Felder, Pfeilfokus und einmalige Aktivierung werden an derselben DOM-Eingabegrenze getrennt.
  readonly down = (event: KeyboardEvent) => {
    if (
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      nativeField(event.target)
    )
      return;
    const direction = ARROWS[event.code];

    if (direction) {
      event.preventDefault();

      if (!event.repeat) this.move(direction);

      return;
    }

    this.activate(event);
  };

  private activate(event: KeyboardEvent) {
    const target =
      event.target instanceof Element ? event.target.closest<HTMLElement>('button, a[href]') : null;

    if (!target || !canFocus(target) || !['Space', 'Enter'].includes(event.code)) return;
    event.preventDefault();

    if (event.repeat) return;

    if (event.code === 'Enter') target.click();
    else this.pressed = target;
  }

  readonly up = (event: KeyboardEvent) => {
    if (event.code !== 'Space' || !this.pressed) return;
    const target = this.pressed;

    this.cancel();
    event.preventDefault();

    if (document.activeElement === target && canFocus(target)) target.click();
  };

  readonly cancel = () => {
    this.pressed = null;
  };

  // eslint-disable-next-line max-lines-per-function -- Nur aktuell bedienbare Ziele liefern Geometrie und das daraus folgende Fokusziel.
  private move(direction: FocusDirection) {
    const targets = focusTargets(this.root);
    const current = targets.indexOf(document.activeElement as HTMLElement);
    const next = nextFocusIndex(
      targets.map((target) => target.getBoundingClientRect()),
      current,
      direction,
      this.spatial,
    );

    targets[next]?.focus();
  }
}

function nativeField(target: EventTarget | null) {
  return (
    target instanceof Element &&
    !!target.closest('input, select, textarea, [contenteditable]:not([contenteditable="false"])')
  );
}
