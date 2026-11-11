import type { Bounds } from '../interactions/contracts.ts';
import type { ChaosEvent } from './chaos-event.ts';

export interface ImpactBody {
  readonly id: string;
  readonly bounds: Bounds;
  readonly mass: number;
  readonly moving: boolean;
  readonly enabled: boolean;
  readonly velocityX?: number;
  readonly velocityY?: number;
  readonly surface?: 'solid' | 'soft' | 'loose';
}
export interface ImpactHit {
  readonly sourceId: string;
  readonly power: number;
  readonly speed: number;
  readonly direction: number;
  readonly downward: boolean;
  readonly time: number;
  readonly counter: boolean;
}
export interface ImpactActor {
  readonly id: string;
  impactBody(): ImpactBody;
  receiveImpact(hit: ImpactHit): readonly ChaosEvent[];
}
type Sample = { body: ImpactBody; actor: ImpactActor };
type Motion = { vx: number; vy: number; speed: number };

/** One scene owns contacts and causal roots; every actor uses the same spatial rules. */
export class ImpactWorld {
  private damage: (event: ChaosEvent) => void;
  private previous = new Map<string, ImpactBody>();
  private contacts = new Set<string>();
  private roots = new Map<string, Set<string>>();
  private touched = new Set<string>();
  private clock = 0;
  private delta = 16;
  private actors: readonly ImpactActor[] = [];
  private last: { source: string; target: string; power: number } | null = null;

  // eslint-disable-next-line max-lines-per-function -- Ein gemeinsamer Frame erfasst aktuelle Posen, wertet Kontakte stabil geordnet aus und ersetzt die alten Bewegungsproben.
  advance(actors: readonly ImpactActor[], delta: number) {
    this.actors = actors;
    this.delta = Math.max(1, Math.min(100, delta));
    this.clock += this.delta;
    const samples = actors.map((actor) => ({ actor, body: actor.impactBody() }));

    this.touched.clear();

    for (let a = 0; a < samples.length; a++)
      for (let b = a + 1; b < samples.length; b++) this.pair(samples[a], samples[b], false);
    this.contacts = new Set(this.touched);

    for (const { body } of samples) this.previous.set(body.id, body);
    this.prune(samples);
  }

  /** Called at a real Arcade contact before floor break or velocity separation loses the impact. */
  collide(source: ImpactActor, other?: ImpactActor) {
    const a = { actor: source, body: source.impactBody() };
    const targets = other ? [other] : this.actors.filter((actor) => actor.id !== source.id);

    for (const actor of targets) this.pair(a, { actor, body: actor.impactBody() }, Boolean(other));
  }

  inheritSupport(source: ImpactActor, target: ImpactActor) {
    const a = source.impactBody().bounds,
      b = target.impactBody().bounds;

    if (Math.abs(b.y + b.height - a.y) > 2 || b.x + b.width <= a.x || b.x >= a.x + a.width) return;
    const path = this.roots.get(source.id) ?? new Set([source.id]);

    this.roots.set(target.id, new Set([...path, target.id]));
  }

  private motion(body: ImpactBody): Motion {
    const old = this.previous.get(body.id) ?? body;

    if (stationary(body, old)) return { vx: 0, vy: 0, speed: 0 };
    const vx =
      body.velocityX || old.velocityX || ((body.bounds.x - old.bounds.x) * 1000) / this.delta;
    const vy =
      body.velocityY || old.velocityY || ((body.bounds.y - old.bounds.y) * 1000) / this.delta;

    return { vx, vy, speed: Math.hypot(vx, vy) };
  }

  private kinetic(a: Sample, b: Sample): readonly [Sample, Sample, Motion] {
    const av = this.motion(a.body),
      bv = this.motion(b.body);
    const [source, target, v, other] =
      av.speed * a.body.mass >= bv.speed * b.body.mass ? [a, b, av, bv] : [b, a, bv, av];
    const vx = v.vx - other.vx,
      vy = v.vy - other.vy;

    return [source, target, { vx, vy, speed: Math.hypot(vx, vy) }];
  }

  private approaching(a: ImpactBody, b: ImpactBody, v: Motion) {
    const oldA = this.previous.get(a.id) ?? a,
      oldB = this.previous.get(b.id) ?? b;
    const dx = oldB.bounds.x + oldB.bounds.width / 2 - oldA.bounds.x - oldA.bounds.width / 2;
    const dy = oldB.bounds.y + oldB.bounds.height / 2 - oldA.bounds.y - oldA.bounds.height / 2;

    return dx * v.vx + dy * v.vy > 0;
  }

  // eslint-disable-next-line max-lines-per-function -- Tatsächlicher oder swept Kontakt wird einmal pro Berührung ausgelöst; die bewegte Seite bestimmt die Stoßrichtung.
  private pair(a: Sample, b: Sample, physical: boolean) {
    if (!a.actor.impactBody().enabled || !b.actor.impactBody().enabled) return;
    const key = JSON.stringify([a.body.id, b.body.id].sort());
    const touching =
      physical ||
      sweptContact(this.previous.get(a.body.id), a.body, this.previous.get(b.body.id), b.body);

    if (!touching) return;

    const [source, target, velocity] = this.kinetic(a, b);

    if (velocity.speed < 30) return;

    if (this.contacts.has(key)) {
      this.touched.add(key);

      return;
    }

    if (!this.approaching(source.body, target.body, velocity)) return;
    this.touched.add(key);
    this.contacts.add(key);
    this.deliver(source, target, velocity);
  }

  // eslint-disable-next-line max-lines-per-function -- Ein Stoßpfad besucht keinen Teilnehmer zweimal; Gegenstoß und Weitergabe erhalten die begrenzte kausale Herkunft.
  private deliver(source: Sample, target: Sample, motion: Motion) {
    const root = this.roots.get(source.body.id) ?? new Set([source.body.id]);

    if (root.has(target.body.id)) return;
    this.roots.set(source.body.id, root);
    this.roots.set(target.body.id, new Set([...root, target.body.id]));
    const hit = makeHit(source.body, target.body, motion, this.clock);

    this.emit(target.actor.receiveImpact(hit));

    if (target.body.surface !== 'loose') {
      const resistance =
        target.body.surface === 'soft' ? 0.1 : Math.min(1, target.body.mass / source.body.mass);

      this.emit(
        source.actor.receiveImpact({
          ...hit,
          sourceId: target.body.id,
          power: hit.power * resistance,
          direction: -hit.direction,
          counter: true,
        }),
      );
    }

    this.last = { source: source.body.id, target: target.body.id, power: Math.round(hit.power) };
  }

  constructor(damage: (event: ChaosEvent) => void = () => {}) {
    this.damage = damage;
  }

  setDamage(damage: (event: ChaosEvent) => void) {
    this.damage = damage;
  }

  private emit(events: readonly ChaosEvent[]) {
    for (const event of events) this.damage(event);
  }

  private prune(samples: readonly Sample[]) {
    for (const { actor } of samples) if (!actor.impactBody().moving) this.roots.delete(actor.id);
  }

  snapshot() {
    return { contacts: this.contacts.size, last: this.last && { ...this.last } };
  }
}

function stationary(body: ImpactBody, old: ImpactBody) {
  const moved =
    body.bounds.x !== old.bounds.x ||
    body.bounds.y !== old.bounds.y ||
    body.bounds.width !== old.bounds.width ||
    body.bounds.height !== old.bounds.height;

  return !body.moving && (!old.moving || !moved);
}

// eslint-disable-next-line max-lines-per-function -- Die losgelösten Stoßdaten werden als vollständiger gemeinsamer Vertrag erzeugt.
function makeHit(source: ImpactBody, target: ImpactBody, motion: Motion, time: number): ImpactHit {
  return {
    sourceId: source.id,
    speed: motion.speed,
    power: motion.speed * source.mass,
    direction: Math.sign(motion.vx || target.bounds.x - source.bounds.x) || 1,
    downward: motion.vy > Math.abs(motion.vx),
    time,
    counter: false,
  };
}

// eslint-disable-next-line max-lines-per-function -- Relative swept AABBs prüfen den gemeinsamen Bewegungszeitpunkt statt der großen Hüllbox einer diagonalen Flugbahn.
export function sweptContact(
  oldA: ImpactBody | undefined,
  a: ImpactBody,
  oldB: ImpactBody | undefined,
  b: ImpactBody,
) {
  const pa = oldA?.bounds ?? a.bounds,
    pb = oldB?.bounds ?? b.bounds;
  const dx = a.bounds.x - pa.x - (b.bounds.x - pb.x);
  const dy = a.bounds.y - pa.y - (b.bounds.y - pb.y);
  const x = interval(
    pa.x,
    Math.max(pa.width, a.bounds.width),
    pb.x,
    Math.max(pb.width, b.bounds.width),
    dx,
  );
  const y = interval(
    pa.y,
    Math.max(pa.height, a.bounds.height),
    pb.y,
    Math.max(pb.height, b.bounds.height),
    dy,
  );

  return Math.max(x[0], y[0], 0) <= Math.min(x[1], y[1], 1);
}

// eslint-disable-next-line max-lines-per-function -- Die beiden Zeitgrenzen einer Achse behandeln ruhende und bewegte Kontakte gemeinsam.
function interval(
  a: number,
  sizeA: number,
  b: number,
  sizeB: number,
  velocity: number,
): readonly [number, number] {
  if (velocity === 0)
    return a + sizeA > b && a < b + sizeB ? [-Infinity, Infinity] : [Infinity, -Infinity];
  const first = (b - a - sizeA) / velocity,
    last = (b + sizeB - a) / velocity;

  return [Math.min(first, last), Math.max(first, last)];
}
