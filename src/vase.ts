import Phaser from 'phaser';

export type VaseState = 'resting' | 'moving' | 'falling' | 'broken';
export interface VaseConfig { readonly id: string; readonly x: number; readonly shelfY: number; readonly points: number; readonly color: number }

/** Arcade collisions keep the first chaos object in the same physics world as Pixel. */
export class Vase extends Phaser.Physics.Arcade.Image {
  private phase: VaseState = 'resting';
  readonly config: VaseConfig;

  constructor(scene: Phaser.Scene, config: VaseConfig) {
    super(scene, config.x, config.shelfY - 14, 'vase');
    this.config = config;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setTint(config.color);
    this.restore();
  }

  get damageState() { return this.phase; }

  restore() {
    this.phase = 'resting';
    this.enableBody(true, this.config.x, this.config.shelfY - 14, true, true);
    this.setAngle(0).setAngularVelocity(0).setVelocity(0, 0);
    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.setImmovable(true).setDragX(35).setBounce(0);
    this.setCollideWorldBounds(true);
  }

  push(direction: number) {
    if (this.phase === 'broken') return;
    this.phase = 'moving';
    this.setImmovable(false);
    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(true);
    this.setVelocityX(direction * 170);
  }

  updateFall() {
    if (this.phase === 'resting' || this.phase === 'broken') return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body.velocity.y > 40 && body.bottom > this.config.shelfY + 8) {
      this.phase = 'falling';
      this.setAngularVelocity(Math.sign(body.velocity.x || 1) * 100);
    }
  }

  breakOnFloor(): boolean {
    if (this.phase === 'resting' || this.phase === 'broken') return false;
    this.phase = 'broken';
    this.disableBody(true, true);
    return true;
  }

  snapshot() {
    const body = this.body as Phaser.Physics.Arcade.Body;
    return {
      id: this.config.id, x: this.x, y: this.y, bottom: body.bottom,
      velocityX: body.velocity.x, velocityY: body.velocity.y,
      state: this.phase, points: this.config.points,
    };
  }
}
