import type Phaser from 'phaser';
import { ASSETS } from '../assets/definitions';
import { assertObjectId, chaosEvent, DamageHistory } from '../domain/chaos-event';
import type { Destructible, ObjectLifecycle } from '../interactions/contracts';

export type VaseState = 'resting' | 'moving' | 'falling' | 'broken';
export interface VaseConfig {
  readonly id: string;
  readonly x: number;
  readonly shelfY: number;
  readonly points: number;
  readonly color: number;
  readonly floorY: number;
  readonly roomWidth: number;
}

/** A concrete object composed from an Arcade body, presentation and damage history. */
export class Vase implements Destructible, ObjectLifecycle {
  readonly id: string;
  readonly maximumScore: number;
  readonly collider: Phaser.Physics.Arcade.Image;
  private phase: VaseState = 'resting';
  private readonly history = new DamageHistory();
  private readonly shards: Phaser.GameObjects.Container;
  private readonly config: VaseConfig;

  constructor(
    private readonly scene: Phaser.Scene,
    config: VaseConfig,
  ) {
    assertObjectId(config.id);

    if (!Number.isSafeInteger(config.points) || config.points < 0)
      throw new Error('Invalid vase points');
    this.config = Object.freeze({ ...config });
    this.id = config.id;
    this.maximumScore = config.points;

    if (!scene.textures.exists('vase')) {
      const g = scene.make.graphics({ x: 0, y: 0 });

      g.fillStyle(0xffffff).fillRect(5, 0, 8, 8).fillRect(2, 8, 14, 16).fillRect(4, 24, 10, 4);
      g.fillStyle(0xd3d3d3).fillRect(5, 0, 8, 3).fillRect(12, 9, 3, 14);
      g.generateTexture('vase', ASSETS['vase-default'].width, ASSETS['vase-default'].height);
      g.destroy();
    }

    this.collider = scene.physics.add
      .image(config.x, config.shelfY - 14, 'vase')
      .setTint(config.color)
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
  }

  updateFall() {
    if (this.phase === 'resting' || this.phase === 'broken') return;
    const body = this.collider.body as Phaser.Physics.Arcade.Body;

    if (body.velocity.y > 40 && body.bottom > this.config.shelfY + 8) {
      this.phase = 'falling';
      this.collider.setAngularVelocity(Math.sign(body.velocity.x || 1) * 100);
    }
  }

  breakOnFloor() {
    if (this.phase === 'resting' || this.phase === 'broken') return;
    this.phase = 'broken';
    this.collider.disableBody(true, true);
    const event = chaosEvent(this.id, 'break', 1, this.config.points);

    this.history.record(event);

    for (let i = 0; i < 7; i++) {
      const shard = this.scene.add.rectangle(
        this.collider.x,
        this.config.floorY - 3,
        4 + (i % 3),
        3,
        this.config.color,
      );

      this.shards.add(shard);
      this.scene.tweens.add({
        targets: shard,
        x: Math.max(4, Math.min(this.collider.x + (i - 3) * 9, this.config.roomWidth - 4)),
        y: this.config.floorY - 2 - (i % 2),
        angle: i * 31,
        duration: 240,
      });
    }

    return event;
  }

  damageSnapshot() {
    return this.history.snapshot();
  }

  snapshot() {
    const body = this.collider.body as Phaser.Physics.Arcade.Body;

    return {
      id: this.id,
      x: this.collider.x,
      y: this.collider.y,
      bottom: body.bottom,
      velocityX: body.velocity.x,
      velocityY: body.velocity.y,
      state: this.phase,
      points: this.config.points,
    };
  }

  reset() {
    this.phase = 'resting';
    this.history.reset();
    this.scene.tweens.killTweensOf(this.shards.list);
    this.shards.removeAll(true);
    this.collider.enableBody(true, this.config.x, this.config.shelfY - 14, true, true);
    this.collider.setAngle(0).setAngularVelocity(0).setVelocity(0, 0);
    (this.collider.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.collider.setImmovable(true).setDragX(35).setBounce(0).setCollideWorldBounds(true);
  }

  destroy() {
    this.collider.destroy();
    this.shards.destroy(true);
  }
}
