import type Phaser from 'phaser';
import { motionPreferences } from '../../settings/motion';
import { ASSETS } from '../assets/definitions';
import { assertObjectId, chaosEvent, DamageHistory } from '../domain/chaos-event';
import type { Bounds, Destructible, ObjectLifecycle } from '../interactions/contracts';
import { overlaps, type InteractionContext } from '../interactions/contracts';
import type { ImpactBody, ImpactHit } from '../domain/impact-world';

export interface BreakableProfile {
  readonly width: number;
  readonly height: number;
  readonly mass: number;
  readonly breakPower: number;
  readonly breakSpeed: number;
  readonly texture?: string;
  readonly shardTexture?: string;
  readonly end?: {
    readonly state: 'broken' | 'opened';
    readonly event: 'break' | 'spill';
    readonly texture: string;
    readonly width: number;
    readonly height: number;
    readonly shards: number;
  };
}

export type BreakableState = 'resting' | 'moving' | 'falling' | 'broken' | 'opened';
export interface BreakableConfig {
  readonly id: string;
  readonly x: number;
  readonly shelfY: number;
  readonly support?: Bounds;
  readonly points: number;
  readonly color: number;
  readonly appearance?: string;
  readonly floorY: number;
  readonly roomWidth: number;
}

/** A concrete object composed from an Arcade body, presentation and damage history. */
export class Breakable implements Destructible, ObjectLifecycle {
  readonly id: string;
  readonly maximumScore: number;
  readonly collider: Phaser.Physics.Arcade.Image;
  private phase: BreakableState = 'resting';
  private fallSpeed = 0;
  private awaitingDrop = false;
  private pixelPassing = false;
  private readonly history = new DamageHistory();
  private readonly shards: Phaser.GameObjects.Container;
  private readonly config: BreakableConfig;
  private finished: Phaser.GameObjects.Image | null = null;
  private supportReleased = false;
  private readonly profile: BreakableProfile;

  // eslint-disable-next-line max-lines-per-function -- Texturerzeugung, Body und Splittercontainer werden gemeinsam aus einer Bruchobjekt-Konfiguration initialisiert.
  constructor(
    private readonly scene: Phaser.Scene,
    config: BreakableConfig,
    profile: BreakableProfile,
  ) {
    this.profile = profile;
    assertObjectId(config.id);

    if (!Number.isSafeInteger(config.points) || config.points < 0)
      throw new Error('Invalid breakable points');
    this.config = Object.freeze({ ...config });
    this.id = config.id;
    this.maximumScore = config.points;

    this.prepareFallback();

    this.collider = scene.physics.add
      .image(config.x, config.shelfY - profile.height / 2, profile.texture ?? 'vase')
      .setTint(profile.texture ? 0xffffff : config.color)
      .setDepth(2);
    this.shards = scene.add.container(0, 0).setDepth(2);
    this.reset();
  }

  push(direction: number) {
    if (this.ended()) return;
    this.phase = 'moving';
    this.collider.setImmovable(false);
    (this.collider.body as Phaser.Physics.Arcade.Body).setAllowGravity(true);
    this.collider.setVelocityX(direction * 170);
    this.spin(direction * 80);
  }

  topple(direction: number) {
    this.push(direction);
    this.pixelPassing = true;

    if (!this.ended())
      this.collider.setAngle(motionPreferences.snapshot().reduced ? 0 : direction * 65);
  }

  allowsPixelCollision(pixel: InteractionContext['pixel']) {
    if (this.pixelPassing && !overlaps(pixel, this.impactBody().bounds)) this.pixelPassing = false;

    return !this.pixelPassing;
  }

  // eslint-disable-next-line max-lines-per-function -- Nur tatsächlicher Kontakt mit der Stoffauflage überträgt Bewegung und gibt anschließend die bestehende Fallphysik frei.
  dragOnSurface(surface: Bounds, cloth: Bounds, dx: number) {
    const body = this.collider.body as Phaser.Physics.Arcade.Body;

    if (
      this.ended() ||
      !onShelf(body, surface) ||
      body.right <= cloth.x ||
      body.left >= cloth.x + cloth.width ||
      dx <= 0
    )
      return false;
    this.phase = 'moving';
    this.collider.setImmovable(false).setPosition(this.collider.x + dx, this.collider.y);
    body.updateFromGameObject();
    body.setAllowGravity(true);
    this.spin(0);

    return true;
  }

  releaseSupport(shelf: Bounds) {
    const body = this.collider.body as Phaser.Physics.Arcade.Body;

    if (!onShelf(body, shelf)) return;
    this.supportReleased = true;

    if (this.ended()) return this.dropContents();
    this.phase = 'moving';
    this.awaitingDrop = true;
    this.collider.setImmovable(false);
    body.setAllowGravity(true);
  }

  // eslint-disable-next-line max-lines-per-function -- Fallen, Ausrollen und reduzierte Drehbewegung teilen denselben aktiven Körperschritt.
  updateFall(pixel: InteractionContext['pixel']) {
    this.allowsPixelCollision(pixel);

    if (this.ended()) return;
    const body = this.collider.body as Phaser.Physics.Arcade.Body;

    if (this.phase === 'resting' && !body.allowGravity) return;

    this.fallSpeed = Math.max(this.fallSpeed, body.velocity.y);

    this.settle(body);
    this.spin(body.velocity.x * 0.8);

    if (body.velocity.y > 40 && body.bottom > this.config.shelfY + 8) {
      this.phase = 'falling';
      this.spin(Math.sign(body.velocity.x || 1) * 100);
    }
  }

  private spin(speed: number) {
    this.collider.setAngularVelocity(motionPreferences.snapshot().reduced ? 0 : speed);
  }

  private settle(body: Phaser.Physics.Arcade.Body) {
    if (body.velocity.y > 0) this.awaitingDrop = false;

    if (this.awaitingDrop) return;

    if (body.blocked.down && Math.abs(body.velocity.x) < 1 && body.velocity.y === 0) {
      this.phase = 'resting';
      this.collider.setVelocityX(0);
      this.fallSpeed = 0;
    }
  }

  landOnFloor() {
    if (this.fallSpeed < this.profile.breakSpeed) {
      this.fallSpeed = 0;

      return;
    }

    this.fallSpeed = 0;

    return this.breakOnFloor();
  }

  landOnSurface() {
    this.fallSpeed = 0;

    if (this.phase === 'falling') this.phase = 'moving';
  }

  // eslint-disable-next-line max-lines-per-function -- Der vollständige Kontaktvertrag hält aktuelle Geometrie, Masse und Bewegungszustand zusammen.
  impactBody(): ImpactBody {
    const body = this.collider.body as Phaser.Physics.Arcade.Body;

    return {
      id: this.id,
      bounds: { x: body.left, y: body.top, width: body.width, height: body.height },
      mass: this.profile.mass,
      enabled: !this.ended(),
      moving: this.phase !== 'resting' && !this.ended(),
      surface: 'solid',
      velocityX: body.velocity.x,
      velocityY: body.velocity.y || this.fallSpeed,
    };
  }

  // eslint-disable-next-line max-lines-per-function -- Leichter Gegenstoß dämpft, ein normaler Stoß bewegt das Objekt weiter, erst ein starker Treffer zerbricht sie.
  receiveImpact(hit: ImpactHit) {
    if (!this.acceptsImpact(hit)) return [];
    this.phase = 'moving';

    if (hit.power >= this.profile.breakPower) {
      const event = this.breakOnFloor();

      return event ? [event] : [];
    }

    this.collider.setImmovable(false);
    (this.collider.body as Phaser.Physics.Arcade.Body).setAllowGravity(true);
    const velocity =
      (hit.counter ? -hit.direction : hit.direction) *
      Math.min(220, hit.speed) *
      (hit.counter ? 0.55 : 0.65);

    this.collider.setVelocityX(velocity);
    this.spin(velocity * 0.8);

    return [];
  }

  private acceptsImpact(hit: ImpactHit) {
    return !this.ended() && hit.power >= 30 && (!hit.counter || hit.power >= 140);
  }

  breakOnFloor() {
    if (this.phase === 'resting' || this.ended()) return;
    this.phase = this.profile.end?.state ?? 'broken';
    this.collider.disableBody(true, true);
    const event = chaosEvent(this.id, this.profile.end?.event ?? 'break', 1, this.config.points);

    this.history.record(event);

    this.scatterShards();
    this.showContents();

    return event;
  }

  // eslint-disable-next-line max-lines-per-function -- Jeder Splitter wird in einer Schleife mit seinem ausgeschriebenen Tween-Vertrag erzeugt.
  private scatterShards() {
    for (let i = 0; i < (this.profile.end?.shards ?? 7); i++) {
      const shard = this.createShard(i);

      this.shards.add(shard);
      this.scene.tweens.add({
        targets: shard,
        x: Math.max(4, Math.min(this.collider.x + (i - 3) * 9, this.config.roomWidth - 4)),
        y: this.debrisBaseline() - 2 - (i % 2),
        angle: i * 31,
        duration: 240,
      });
    }
  }

  private ended() {
    return this.phase === 'broken' || this.phase === 'opened';
  }

  private debrisBaseline() {
    if (!this.profile.end || this.supportReleased) return this.config.floorY;
    const body = this.collider.body as Phaser.Physics.Arcade.Body;

    return body.blocked.down || (this.config.support && onShelf(body, this.config.support))
      ? Math.min(this.config.floorY, body.bottom)
      : this.config.floorY;
  }

  // eslint-disable-next-line max-lines-per-function -- Ein begrenzter Endzustand erhält tatsächlichen Aufprallanker, Raumgrenzen und einen kurzen pausierbaren Streu-Tween.
  private showContents() {
    const end = this.profile.end;

    if (!end) return;
    const x = Math.max(
      end.width / 2,
      Math.min(this.collider.x, this.config.roomWidth - end.width / 2),
    );
    const y = this.debrisBaseline();

    this.finished = this.scene.add.image(x, y, end.texture).setOrigin(0.5, 1).setDepth(2);

    if (motionPreferences.snapshot().reduced) return;
    this.finished.setY(Math.min(this.collider.y, y - 8)).setScale(0.85, 1);
    this.scene.tweens.add({ targets: this.finished, y, scaleX: 1, duration: 240 });
  }

  // eslint-disable-next-line max-lines-per-function -- Endbild und vorhandene Splitter verlieren gemeinsam ihre Auflage, ohne einen weiteren Schaden auszulösen.
  private dropContents() {
    if (!this.finished || !this.profile.end) return;
    this.scene.tweens.killTweensOf(this.finished);
    this.scene.tweens.killTweensOf(this.shards.list);
    this.scene.tweens.add({
      targets: this.finished,
      y: this.config.floorY,
      scaleX: 1,
      duration: 450,
    });

    if (this.shards.length === 0) return;
    this.scene.tweens.add({ targets: this.shards.list, y: this.config.floorY - 2, duration: 450 });
  }

  // eslint-disable-next-line max-lines-per-function -- Der flache nur lesbare Endbildvertrag bleibt vollständig sichtbar.
  protected contentsSnapshot() {
    return this.finished
      ? {
          visible: this.finished.visible,
          texture: this.finished.texture.key,
          x: this.finished.x,
          y: this.finished.y,
          width: this.finished.displayWidth,
          height: this.finished.displayHeight,
        }
      : null;
  }

  private clearContents() {
    if (!this.finished) return;
    this.scene.tweens.killTweensOf(this.finished);
    this.finished.destroy();
    this.finished = null;
  }

  private prepareFallback() {
    if (!this.profile.texture && !this.scene.textures.exists('vase')) drawFallback(this.scene);
  }

  private createShard(index: number) {
    const shardTexture = this.profile.shardTexture;
    const x = this.collider.x,
      y = Math.min(this.config.floorY - 3, this.collider.y);

    return shardTexture
      ? this.scene.add.image(x, y, shardTexture).setScale(0.8 + (index % 3) * 0.1)
      : this.scene.add.rectangle(x, y, 4 + (index % 3), 3, this.config.color);
  }

  damageSnapshot() {
    return this.history.snapshot();
  }

  // eslint-disable-next-line max-lines-per-function -- Der flache Bruchobjekt-Beobachtungsvertrag bleibt vollständig an einer Stelle sichtbar.
  snapshot() {
    const body = this.collider.body as Phaser.Physics.Arcade.Body;

    return {
      id: this.id,
      texture: this.collider.texture.key,
      bodyWidth: body.width,
      appearance: this.config.appearance,
      bodyHeight: body.height,
      shards: this.shards.length,
      x: this.collider.x,
      y: this.collider.y,
      bottom: body.bottom,
      velocityX: body.velocity.x,
      velocityY: body.velocity.y,
      state: this.phase,
      angle: this.collider.angle,
      points: this.config.points,
    };
  }

  // eslint-disable-next-line max-lines-per-function -- Darstellung, Kollisionskörper und Fallenergie werden gemeinsam auf den Spawnzustand zurückgesetzt.
  reset() {
    this.phase = 'resting';
    this.supportReleased = false;
    this.clearContents();
    this.fallSpeed = 0;
    this.awaitingDrop = false;
    this.pixelPassing = false;
    this.history.reset();
    this.scene.tweens.killTweensOf(this.shards.list);
    this.shards.removeAll(true);
    this.collider.enableBody(
      true,
      this.config.x,
      this.config.shelfY - this.profile.height / 2,
      true,
      true,
    );
    this.collider.setAngle(0).setAngularVelocity(0).setVelocity(0, 0);
    (this.collider.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.collider.setImmovable(true).setDragX(35).setBounce(0).setCollideWorldBounds(true);
  }

  setSimulationActive(active: boolean) {
    (this.collider.body as Phaser.Physics.Arcade.Body).moves = active;
  }

  destroy() {
    this.clearContents();
    this.scene.tweens.killTweensOf(this.shards.list);
    this.collider.destroy();
    this.shards.destroy(true);
  }
}

/** Existing color-only content retains the original procedural appearance. */
function drawFallback(scene: Phaser.Scene) {
  const g = scene.make.graphics({ x: 0, y: 0 });

  g.fillStyle(0xffffff).fillRect(5, 0, 8, 8).fillRect(2, 8, 14, 16).fillRect(4, 24, 10, 4);
  g.fillStyle(0xd3d3d3).fillRect(5, 0, 8, 3).fillRect(12, 9, 3, 14);
  g.generateTexture('vase', ASSETS['vase-default'].width, ASSETS['vase-default'].height);
  g.destroy();
}

function onShelf(body: Phaser.Physics.Arcade.Body, shelf: Bounds) {
  return (
    Math.abs(body.bottom - shelf.y) <= 2 &&
    body.right > shelf.x &&
    body.left < shelf.x + shelf.width
  );
}
