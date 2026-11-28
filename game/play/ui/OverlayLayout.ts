/** Shared occupied regions; components never move each other's elements. */
export class OverlayLayout {
  private readonly resize = new ResizeObserver(() => this.refresh());
  private readonly mutations = new MutationObserver(() => this.observe());
  private readonly observed = new Set<Element>();

  // eslint-disable-next-line max-lines-per-function -- Einmalige Bindung beider Beobachter an dieselbe Spielhülle.
  constructor(private readonly host: HTMLElement) {
    const main = host.closest('main');

    if (!main) return;
    this.mutations.observe(main, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['hidden'],
    });
    this.observe();
  }

  // eslint-disable-next-line max-lines-per-function -- Neue Szenenknoten aufnehmen und entfernte Knoten gemeinsam abmelden.
  private observe() {
    const elements = document.querySelectorAll(
      '#game, .game-menu-actions, .touch-directions, .touch-actions, .album-banner, .room-selection-return, .mobile-dialogue',
    );

    for (const element of this.observed) {
      if (element.isConnected) continue;
      this.resize.unobserve(element);
      this.observed.delete(element);
    }

    for (const element of Array.from(elements)) {
      if (this.observed.has(element)) continue;
      this.observed.add(element);
      this.resize.observe(element);
    }

    this.refresh();
  }

  private refresh() {
    const main = this.host.closest('main');

    if (!main || !this.host.clientWidth) return;
    let changed = false;

    for (const region of REGIONS) changed = updateRegion(main, region) || changed;

    changed = setSize(main, 'scene-bottom', sceneReserve(this.host, main)) || changed;

    if (changed) this.host.dispatchEvent(new Event('overlaylayoutchange'));
  }

  destroy() {
    this.resize.disconnect();
    this.mutations.disconnect();
    this.observed.clear();
  }
}

const REGIONS = [
  ['menu-height', '.game-menu-actions', 'height'],
  ['dialogue-width', '.mobile-dialogue:not([hidden])', 'width'],
  ['directions-height', '.touch-directions', 'height'],
  ['directions-width', '.touch-directions', 'width'],
  ['actions-height', '.touch-actions', 'height'],
  ['actions-width', '.touch-actions', 'width'],
  ['banner-height', '.album-banner', 'height'],
  ['return-height', '#game > .room-selection-return', 'height'],
] as const;

function updateRegion(main: HTMLElement, [name, selector, dimension]: (typeof REGIONS)[number]) {
  const box = main.querySelector(selector)?.getBoundingClientRect();

  return setSize(main, name, box?.[dimension] ?? 0);
}

function setSize(main: HTMLElement, name: string, size: number) {
  const property = `--overlay-${name}`;
  const value = `${size}px`;

  if (main.style.getPropertyValue(property) === value) return false;
  main.style.setProperty(property, value);

  return true;
}

// eslint-disable-next-line max-lines-per-function -- Die Kamerafreifläche verwendet dieselben realen Bedienflächen und dieselbe Bannerhöhe wie das CSS.
function sceneReserve(host: HTMLElement, main: HTMLElement) {
  const controls = Array.from(
    main.querySelectorAll<HTMLElement>(
      '.touch-directions, .touch-actions, #game > .room-selection-return',
    ),
  );
  const tops = controls
    .filter((element) => element.offsetWidth)
    .map((element) => element.getBoundingClientRect().top);
  const controlHeight = tops.length ? host.getBoundingClientRect().bottom - Math.min(...tops) : 0;
  const bannerHeight = main.querySelector('.album-banner')?.getBoundingClientRect().height ?? 0;
  const gap = parseFloat(getComputedStyle(main).getPropertyValue('--overlay-gap'));

  return controlHeight + Math.max(72, bannerHeight) + gap * 4;
}
