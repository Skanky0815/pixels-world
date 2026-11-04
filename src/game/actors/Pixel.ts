import Phaser from 'phaser';
import { PIXEL_ANIMATIONS, pixelAnimation } from './pixel-animations';
import { CURTAIN_SLIDE } from '../interactions/curtain-sliding';
import type { InputState } from '../input/input-state';

import type { Bounds, GroundAction } from '../interactions/contracts';
type Activity = GroundAction | 'climbing' | 'sliding';
const SCALE = 2;

/** Owns Pixel's bodies, movement, facing, action and presentation. */
export class Pixel {
  private readonly sprite: Phaser.Physics.Arcade.Sprite;
  private readonly visual: Phaser.GameObjects.Sprite;
  private climbing = false;
  private grabBlockedUntil = 0;
  private mustLeaveCurtain = false;
  private wasAirborne = false;
  private hasGroundContact = false;
  private landingUntil = 0;
  private overlapsCurtain = false;
  private action: Activity = 'idle';

  constructor(scene: Phaser.Scene, spawn: { readonly x: number; readonly bottom: number }) {
    for (const [key, config] of Object.entries(PIXEL_ANIMATIONS)) {
      if (!scene.anims.exists(key)) scene.anims.create({
        key, frames: config.frames.map(frame => ({ key: 'pixel', frame })),
        frameRate: config.frameRate, repeat: config.repeat,
      });
    }
    this.sprite = scene.physics.add.sprite(spawn.x, spawn.bottom - 16 * SCALE, 'pixel').setScale(SCALE);
    this.sprite.setBodySize(26, 26).setOffset(3, 6).setCollideWorldBounds(true);
    this.sprite.setMaxVelocity(260, 600).setVisible(false);
    this.visual = scene.add.sprite(spawn.x, spawn.bottom - 32, 'pixel', 0).setScale(SCALE).setDepth(1);
  }

  /** Engine boundary: only used by the scene to wire collision pairs. */
  get collider() { return this.sprite; }
  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
  get flipX() { return this.sprite.flipX; }
  get frame() { return Number(this.sprite.frame.name); }
  get isClimbing() { return this.climbing; }
  get nearCurtain() { return this.overlapsCurtain; }
  get activity() { return this.action; }

  /** Detached read-only contact data for interaction models. */
  get contact() {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    return Object.freeze({
      x: body.x, y: body.y, bottom: body.bottom,
      blocked: Object.freeze({ down: body.blocked.down }),
      velocity: Object.freeze({ x: body.velocity.x, y: body.velocity.y }),
    });
  }

  faceToward(x: number) { this.sprite.setFlipX(this.x > x); }

  move(input: InputState, time: number, delta: number, area: Bounds | undefined) {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const { horizontal, vertical, jumpPressed } = input;
    const overlapsCurtain = area !== undefined && Phaser.Geom.Intersects.RectangleToRectangle(new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height), new Phaser.Geom.Rectangle(area.x, area.y, area.width, area.height));
    this.overlapsCurtain = overlapsCurtain;
    if (!overlapsCurtain) this.mustLeaveCurtain = false;
    const canGrab = !this.mustLeaveCurtain && time >= this.grabBlockedUntil && !jumpPressed;
    const jumpingIntoCurtain = !body.blocked.down && horizontal !== 0 && Math.abs(body.velocity.y) > 1;
    if (!this.climbing && canGrab && overlapsCurtain && (vertical < 0 || (vertical > 0 && !body.blocked.down) || jumpingIntoCurtain)) this.climbing = true;
    if (this.climbing && (!overlapsCurtain || (vertical >= 0 && body.blocked.down))) {
      this.climbing = false;
      this.grabBlockedUntil = overlapsCurtain ? time : time + 250;
    }
    body.setAllowGravity(!this.climbing);
    if (this.climbing) {
      const speedY = vertical < 0 ? -CURTAIN_SLIDE.climbSpeed : vertical > 0 ? CURTAIN_SLIDE.descendSpeed : CURTAIN_SLIDE.slideSpeed;
      this.sprite.setVelocity(horizontal * 110, speedY);
      if (jumpPressed) {
        this.climbing = false;
        this.grabBlockedUntil = time + 250;
        this.mustLeaveCurtain = true;
        body.setAllowGravity(true);
        this.sprite.setVelocity((horizontal || -1) * 240, -340);
      }
    } else {
      if (body.blocked.down) this.sprite.setVelocityX(horizontal * 230);
      else if (horizontal !== 0) this.sprite.setVelocityX(Phaser.Math.Clamp(body.velocity.x + horizontal * 700 * Math.min(delta, 50) / 1000, -240, 240));
      if (jumpPressed && body.blocked.down) this.sprite.setVelocityY(-480);
    }
    if (horizontal !== 0) this.sprite.setFlipX(horizontal < 0);
  }

  present(time: number, groundAction: GroundAction, sliding: boolean) {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    this.action = groundAction !== 'idle' ? groundAction : this.climbing ? sliding ? 'sliding' : 'climbing' : 'idle';
    if (this.hasGroundContact && this.wasAirborne && body.blocked.down && body.velocity.y >= 0) this.landingUntil = time + 140;
    // Spawning on the floor is not a landing; only animate a later real flight.
    this.hasGroundContact ||= body.blocked.down;
    this.wasAirborne = this.hasGroundContact && !this.climbing && (!body.blocked.down || body.velocity.y < -1);
    const animation = pixelAnimation({
      climbing: this.climbing, sliding, grounded: body.blocked.down,
      velocityX: body.velocity.x, velocityY: body.velocity.y,
      scratching: groundAction === 'scratching', nibbling: groundAction === 'nibbling' || groundAction === 'wobbling',
      landing: time < this.landingUntil,
    });
    this.sprite.play(animation, true);
    if (this.climbing) this.sprite.setFlipX(false);
    const scale = PIXEL_ANIMATIONS[animation].scale;
    this.visual.setTexture('pixel', this.sprite.frame.name).setFlipX(this.flipX)
      .setScale(scale).setPosition(body.center.x, body.bottom - 16 * scale);
  }

  snapshot() {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    return {
      x: this.x, y: this.y, bottom: body.bottom,
      left: body.left, top: body.top, bodyWidth: body.width, bodyHeight: body.height,
      displayWidth: this.visual.displayWidth, displayHeight: this.visual.displayHeight,
      velocityX: body.velocity.x, velocityY: body.velocity.y,
      grounded: body.blocked.down, climbing: this.climbing, gravity: body.allowGravity,
      animation: this.sprite.anims.currentAnim?.key ?? null, animationFrame: this.frame,
      flipX: this.flipX, texture: this.sprite.texture.key,
    };
  }

  destroy() { this.sprite.destroy(); this.visual.destroy(); }
}
