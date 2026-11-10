export const CHARM_ACTIONS = {
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
    moment: 'Neue Frames: Hinlegen, Rückenlage und ruhiges Atmen',
    approach: 1500,
    cycle: 2400,
    x: 10,
  },
} as const;

export type CharmAction = keyof typeof CHARM_ACTIONS;
export interface CharmPose {
  readonly x: number;
  readonly y: number;
  readonly angle: number;
  readonly scale: number;
  readonly stretch: number;
  readonly sheet: 'pixel' | 'charm';
  readonly cell: 32 | 48;
  readonly frame: number;
  readonly faceLeft: boolean;
  readonly behindSara: boolean;
}
const IDLE: CharmPose = {
  x: 0,
  y: 0,
  angle: 0,
  scale: 2,
  stretch: 1,
  sheet: 'pixel',
  cell: 32,
  frame: 0,
  faceLeft: false,
  behindSara: false,
};

/** Presentation choreography. No inputs, score or reconciliation state are changed. */
export class CharmMotion {
  private action: CharmAction | null = null;
  private elapsed = 0;
  private releasing = false;
  private from: CharmPose = IDLE;

  trigger(action: CharmAction, reduced = false) {
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

    if (this.releasing && this.elapsed >= releaseDuration(this.from)) this.reset();
  }

  pose(reduced = false): CharmPose {
    if (reduced) return reducedPose(this.action);

    if (this.releasing) return releasePose(this.from, this.elapsed);

    if (!this.action) return IDLE;
    const config = CHARM_ACTIONS[this.action];

    if (this.elapsed < config.approach) return approach(this.action, this.elapsed, this.from);

    return loop(this.action, this.elapsed - config.approach);
  }

  snapshot() {
    return Object.freeze({ action: this.action, elapsed: this.elapsed, phase: this.phase() });
  }

  private phase() {
    if (this.releasing) return 'release' as const;

    if (!this.action) return 'idle' as const;

    return this.elapsed < CHARM_ACTIONS[this.action].approach
      ? ('approach' as const)
      : ('loop' as const);
  }
}

function ease(value: number) {
  const t = Math.max(0, Math.min(1, value));

  return t * t * (3 - 2 * t);
}

// eslint-disable-next-line max-lines-per-function -- Die vollständige skalare Pose wird ohne Positionssprung gemeinsam interpoliert.
function blend(from: CharmPose, to: CharmPose, progress: number): CharmPose {
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
function approach(action: CharmAction, elapsed: number, from: CharmPose): CharmPose {
  const config = CHARM_ACTIONS[action];
  const travel = action === 'roll' ? 700 : config.approach;
  const pose = blend(from, loop(action, 0), elapsed / travel);
  const walking = Math.abs(pose.x - config.x) > 2;

  if (action === 'roll' && elapsed >= 700)
    return {
      ...pose,
      frame: 6 + Math.min(2, Math.floor((elapsed - 700) / 266)),
      behindSara: false,
    };

  return {
    ...pose,
    sheet: walking ? 'pixel' : pose.sheet,
    cell: walking ? 32 : pose.cell,
    frame: walking ? 5 + (Math.floor(elapsed / 100) % 5) : pose.frame,
    faceLeft: walking ? config.x < from.x : pose.faceLeft,
    behindSara: false,
  };
}

function loop(action: CharmAction, elapsed: number): CharmPose {
  const config = CHARM_ACTIONS[action];
  const phase = (elapsed % config.cycle) / config.cycle;
  const wave = Math.sin(phase * Math.PI * 2);
  const press = (1 - Math.cos(phase * Math.PI * 2)) / 2;

  return actionPose(action, config.x, phase, wave, press);
}

// eslint-disable-next-line max-lines-per-function -- Die fünf ausdrücklich als Entwurf gekennzeichneten Bewegungen teilen dieselbe periodische Phase und Pfotenbasis.
function actionPose(
  action: CharmAction,
  x: number,
  phase: number,
  wave: number,
  press: number,
): CharmPose {
  switch (action) {
    case 'rub':
      return {
        ...IDLE,
        x: x + wave * 16,
        y: press * 3,
        frame: 5 + (Math.floor(phase * 10) % 5),
        faceLeft: Math.cos(phase * Math.PI * 2) < 0,
        behindSara: Math.cos(phase * Math.PI * 2) < 0,
      };
    case 'headbutt':
      return {
        ...IDLE,
        x: x + press * 2,
        sheet: 'charm',
        cell: 48,
        frame: [0, 1, 2, 3, 3, 4, 1, 0][Math.floor(phase * 8)],
      };
    case 'purr':
      return { ...IDLE, x, frame: phase > 0.12 && phase < 0.85 ? 2 : 0, stretch: 1 + wave * 0.018 };
    case 'paw':
      return {
        ...IDLE,
        x: x + press * 3,
        frame: [20, 21, 22, 21][Math.floor(phase * 4)],
      };
    case 'roll':
      return {
        ...IDLE,
        x,
        sheet: 'charm',
        cell: 48,
        frame: [8, 9, 10, 9, 11, 9][Math.floor(phase * 6)],
      };
  }
}

function reducedPose(action: CharmAction | null): CharmPose {
  if (action === 'roll') return { ...IDLE, sheet: 'charm', cell: 48, frame: 8 };

  if (action === 'headbutt') return { ...IDLE, sheet: 'charm', cell: 48, frame: 3 };

  return { ...IDLE, frame: action === 'purr' ? 2 : 0 };
}

function releaseDuration(from: CharmPose) {
  return from.sheet === 'charm' && from.frame >= 6 ? 1100 : 500;
}

// eslint-disable-next-line max-lines-per-function -- Aufrichten wird einmal rückwärts aus den echten Bauch-Frames gezeigt, anschließend läuft Pixel zum Sitzanker zurück.
function releasePose(from: CharmPose, elapsed: number): CharmPose {
  const belly = from.sheet === 'charm' && from.frame >= 6;
  const rise = belly ? 650 : from.sheet === 'charm' ? 180 : 0;

  if (elapsed < rise) {
    const index = Math.min(2, Math.floor((elapsed / rise) * 3));

    return { ...from, frame: belly ? [8, 7, 6][index] : [4, 1, 0][index], angle: 0, y: 0 };
  }

  const pose = blend(from, IDLE, (elapsed - rise) / (releaseDuration(from) - rise));
  const walking = Math.abs(pose.x) > 1;

  return {
    ...pose,
    frame: walking ? 5 + (Math.floor(elapsed / 100) % 5) : 0,
    faceLeft: walking && from.x > 0,
  };
}
