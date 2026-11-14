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
}

export type BreakableState = 'resting' | 'moving' | 'falling' | 'broken';
export interface BreakableConfig {
  readonly id: string;
  readonly x: number;
  readonly shelfY: number;
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
    if (this.phase === 'broken') return;
    this.phase = 'moving';
    this.collider.setImmovable(false);
    (this.collider.body as Phaser.Physics.Arcade.Body).setAllowGravity(true);
    this.collider.setVelocityX(direction * 170);
    this.spin(direction * 80);
  }

  topple(direction: number) {
    this.push(direction);
    this.pixelPassing = true;

    if (this.phase !== 'broken')
      this.collider.setAngle(motionPreferences.snapshot().reduced ? 0 : direction * 65);
  }

  allowsPixelCollision(pixel: InteractionContext['pixel']) {
    if (this.pixelPassing && !overlaps(pixel, this.impactBody().bounds)) this.pixelPassing = false;

    return !this.pixelPassing;
  }

  releaseSupport(shelf: Bounds) {
    const body = this.collider.body as Phaser.Physics.Arcade.Body;

    if (this.phase === 'broken' || !onShelf(body, shelf)) return;
    this.phase = 'moving';
    this.awaitingDrop = true;
    this.collider.setImmovable(false);
    body.setAllowGravity(true);
  }

  // eslint-disable-next-line max-lines-per-function -- Fallen, Ausrollen und reduzierte Drehbewegung teilen denselben aktiven Körperschritt.
  updateFall(pixel: InteractionContext['pixel']) {
    this.allowsPixelCollision(pixel);

    if (this.phase === 'resting' || this.phase === 'broken') return;
    const body = this.collider.body as Phaser.Physics.Arcade.Body;

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
      enabled: this.phase !== 'broken',
      moving: this.phase !== 'resting' && this.phase !== 'broken',
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
    return this.phase !== 'broken' && hit.power >= 30 && (!hit.counter || hit.power >= 140);
  }

  breakOnFloor() {
    if (this.phase === 'resting' || this.phase === 'broken') return;
    this.phase = 'broken';
    this.collider.disableBody(true, true);
    const event = chaosEvent(this.id, 'break', 1, this.config.points);

    this.history.record(event);

    this.scatterShards();

    return event;
  }

  // eslint-disable-next-line max-lines-per-function -- Jeder Splitter wird in einer Schleife mit seinem ausgeschriebenen Tween-Vertrag erzeugt.
  private scatterShards() {
    for (let i = 0; i < 7; i++) {
      const shard = this.createShard(i);

      this.shards.add(shard);
      this.scene.tweens.add({
        targets: shard,
        x: Math.max(4, Math.min(this.collider.x + (i - 3) * 9, this.config.roomWidth - 4)),
        y: this.config.floorY - 2 - (i % 2),
        angle: i * 31,
        duration: 240,
      });
    }
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
