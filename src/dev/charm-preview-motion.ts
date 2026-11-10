export const CHARM_PREVIEW_ACTIONS = {
  rub: {
    label: 'Um die Beine streichen',
    moment: 'Anschmiegen nach einer geschafften Folge',
    approach: 700,
    cycle: 2800,
    x: 52,
  },
  headbutt: {
    label: 'Köpfchen geben',
    moment: 'Alternative zum Anschmiegen nach einer Folge',
    approach: 800,
    cycle: 1800,
    x: 40,
  },
  purr: {
    label: 'Schnurren',
    moment: 'Vorhandenes Feedback nach einer richtigen Pfeiltaste',
    approach: 350,
    cycle: 1600,
    x: 0,
  },
  paw: {
    label: 'Pfote antippen',
    moment: 'Optionale Pose; bisher keine eigene Spielaktion',
    approach: 700,
    cycle: 1600,
    x: 32,
  },
  roll: {
    label: 'Bauch zeigen',
    moment: 'Optionale Lageprobe; eigene Bauch-Frames fehlen noch',
    approach: 1500,
    cycle: 2400,
    x: 10,
  },
} as const;

export type CharmPreviewAction = keyof typeof CHARM_PREVIEW_ACTIONS;
export interface CharmPreviewPose {
  readonly x: number;
  readonly y: number;
  readonly angle: number;
  readonly scale: number;
  readonly stretch: number;
  readonly frame: number;
  readonly faceLeft: boolean;
  readonly behindSara: boolean;
}
const IDLE: CharmPreviewPose = {
  x: 0,
  y: 0,
  angle: 0,
  scale: 2,
  stretch: 1,
  frame: 0,
  faceLeft: false,
  behindSara: false,
};
const RELEASE_MS = 500;

/** DEV-only choreography. No timers, inputs, score or reconciliation state are changed. */
export class CharmPreviewMotion {
  private action: CharmPreviewAction | null = null;
  private elapsed = 0;
  private releasing = false;
  private from: CharmPreviewPose = IDLE;

  trigger(action: CharmPreviewAction, reduced = false) {
    this.from = this.pose(reduced);
    this.action = action;
    this.elapsed = 0;
    this.releasing = false;
  }

  release(reduced = false) {
    this.from = this.pose(reduced);
    this.action = null;
    this.elapsed = 0;
    this.releasing = true;
  }

  reset() {
    this.action = null;
    this.elapsed = 0;
    this.releasing = false;
    this.from = IDLE;
  }

  advance(delta: number) {
    if (!Number.isFinite(delta) || delta <= 0) return;
    this.elapsed += delta;

    if (this.releasing && this.elapsed >= RELEASE_MS) this.reset();
  }

  pose(reduced = false): CharmPreviewPose {
    if (reduced) return { ...IDLE, frame: this.action === 'purr' ? 2 : 0 };

    if (this.releasing) return blend(this.from, IDLE, this.elapsed / RELEASE_MS);

    if (!this.action) return IDLE;
    const config = CHARM_PREVIEW_ACTIONS[this.action];

    if (this.elapsed < config.approach) return approach(this.action, this.elapsed, this.from);

    return loop(this.action, this.elapsed - config.approach);
  }

  snapshot() {
    return Object.freeze({ action: this.action, elapsed: this.elapsed, phase: this.phase() });
  }

  private phase() {
    if (this.releasing) return 'release' as const;

    if (!this.action) return 'idle' as const;

    return this.elapsed < CHARM_PREVIEW_ACTIONS[this.action].approach
      ? ('approach' as const)
      : ('loop' as const);
  }
}

function ease(value: number) {
  const t = Math.max(0, Math.min(1, value));

  return t * t * (3 - 2 * t);
}

// eslint-disable-next-line max-lines-per-function -- Die vollständige skalare Pose wird ohne Positionssprung gemeinsam interpoliert.
function blend(from: CharmPreviewPose, to: CharmPreviewPose, progress: number): CharmPreviewPose {
  const t = ease(progress);
  const mix = (a: number, b: number) => a + (b - a) * t;

  return {
    ...to,
    x: mix(from.x, to.x),
    y: mix(from.y, to.y),
    angle: mix(from.angle, to.angle),
    scale: mix(from.scale, to.scale),
    stretch: mix(from.stretch, to.stretch),
  };
}

// eslint-disable-next-line max-lines-per-function -- Einmalige Annäherung und Laufpose benutzen denselben kontinuierlichen Übergang zur Schleife.
function approach(
  action: CharmPreviewAction,
  elapsed: number,
  from: CharmPreviewPose,
): CharmPreviewPose {
  const config = CHARM_PREVIEW_ACTIONS[action];
  const pose = blend(from, loop(action, 0), elapsed / config.approach);
  const walking = Math.abs(pose.x - config.x) > 2;

  return {
    ...pose,
    frame: walking ? 5 + (Math.floor(elapsed / 100) % 5) : pose.frame,
    behindSara: false,
  };
}

function loop(action: CharmPreviewAction, elapsed: number): CharmPreviewPose {
  const config = CHARM_PREVIEW_ACTIONS[action];
  const phase = (elapsed % config.cycle) / config.cycle;
  const wave = Math.sin(phase * Math.PI * 2);
  const press = (1 - Math.cos(phase * Math.PI * 2)) / 2;

  return actionPose(action, config.x, phase, wave, press);
}

// eslint-disable-next-line max-lines-per-function, complexity -- Die fünf ausdrücklich als Entwurf gekennzeichneten Bewegungen teilen dieselbe periodische Phase und Pfotenbasis.
function actionPose(
  action: CharmPreviewAction,
  x: number,
  phase: number,
  wave: number,
  press: number,
): CharmPreviewPose {
  switch (action) {
    case 'rub':
      return {
        ...IDLE,
        x: x + wave * 16,
        y: press * 3,
        frame: 5 + (Math.floor(phase * 10) % 5),
        faceLeft: Math.cos(phase * Math.PI * 2) < 0,
        behindSara: phase < 0.5,
      };
    case 'headbutt':
      return {
        ...IDLE,
        x: x + press * 7,
        y: press * 2,
        angle: -press * 4,
        frame: phase > 0.2 && phase < 0.8 ? 2 : 0,
      };
    case 'purr':
      return { ...IDLE, x, frame: phase > 0.12 && phase < 0.85 ? 2 : 0, stretch: 1 + wave * 0.018 };
    case 'paw':
      return {
        ...IDLE,
        x: x + press * 3,
        scale: 2.5,
        frame: [20, 21, 22, 21][Math.floor(phase * 4)],
      };
    case 'roll':
      return { ...IDLE, x, angle: 180 + wave * 4, frame: 2, stretch: 1 + wave * 0.012 };
  }
}
