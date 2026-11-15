export interface PreviewClip {
  readonly frames: readonly number[];
  readonly frameRate: number;
}

/** Per-figure preview time; a single page RAF supplies deltas to both figures. */
export class PreviewPlayback {
  private elapsed = 0;
  private offset = 0;
  private stopped = false;
  private globalStopped = false;

  get paused() {
    return this.stopped;
  }

  get canStep() {
    return this.stopped || this.globalStopped;
  }

  advance(delta: number) {
    if (!this.canStep) this.elapsed += Math.max(0, Math.min(delta, 100));
  }

  frame(clip: PreviewClip) {
    return clip.frames[
      (Math.floor((this.elapsed * clip.frameRate) / 1000) + this.offset) % clip.frames.length
    ];
  }

  reset() {
    this.elapsed = 0;
    this.offset = 0;
  }

  step() {
    this.offset++;
  }

  toggle() {
    this.stopped = !this.stopped;
  }

  setGlobalPaused(paused: boolean) {
    this.globalStopped = paused;
  }
}

// eslint-disable-next-line max-lines-per-function -- Eine kleine Toolbar bindet dieselbe Vorschauuhr an globale und figurspezifische Bedienung und räumt alle Listener gemeinsam auf.
export function previewControls(
  card: HTMLElement,
  name: string,
  clock: PreviewPlayback,
  render: () => void,
  abort: AbortController,
) {
  const toolbar = document.createElement('div');
  const pause = document.createElement('button');
  const step = document.createElement('button');
  const refresh = () => {
    pause.textContent = clock.paused ? 'Weiterlaufen' : 'Anhalten';
    pause.setAttribute('aria-pressed', String(clock.paused));
    step.disabled = !clock.canStep;
  };

  toolbar.className = 'preview-controls';
  pause.type = step.type = 'button';
  pause.setAttribute('aria-label', `${name} pausieren`);
  step.setAttribute('aria-label', `${name} ein Frame weiter`);
  step.textContent = 'Ein Frame weiter';
  pause.addEventListener(
    'click',
    () => {
      clock.toggle();
      refresh();
      render();
    },
    { signal: abort.signal },
  );
  step.addEventListener(
    'click',
    () => {
      clock.step();
      render();
    },
    { signal: abort.signal },
  );
  toolbar.append(pause, step);
  card.append(toolbar);
  refresh();

  return {
    draw(delta = 0) {
      clock.advance(delta);
      render();
    },
    step() {
      clock.step();
      render();
    },
    setGlobalPaused(paused: boolean) {
      clock.setGlobalPaused(paused);
      refresh();
      render();
    },
    destroy() {
      abort.abort();
      card.remove();
    },
  };
}
