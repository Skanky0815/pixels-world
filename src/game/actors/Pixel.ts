import { motionPreferences } from '../../settings/motion';
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

  // eslint-disable-next-line max-lines-per-function -- Physikkörper und sichtbares Sprite werden gemeinsam am identischen Spawnanker aufgebaut.
  constructor(
    private readonly scene: Phaser.Scene,
    spawn: { readonly x: number; readonly bottom: number },
  ) {
    registerAnimations(scene);
    this.sprite = scene.physics.add
      .sprite(spawn.x, spawn.bottom - 16 * SCALE, 'pixel')
      .setScale(SCALE);
    this.sprite.setBodySize(26, 26).setOffset(3, 6).setCollideWorldBounds(true);
    this.sprite.setMaxVelocity(260, 600).setVisible(false);
    this.visual = scene.add
      .sprite(spawn.x, spawn.bottom - 32, 'pixel', 0)
      .setScale(SCALE)
      .setDepth(1);
  }

  /** Engine boundary: only used by the scene to wire collision pairs. */
  get collider() {
    return this.sprite;
  }

  get x() {
    return this.sprite.x;
  }

  get y() {
    return this.sprite.y;
  }

  get flipX() {
    return this.sprite.flipX;
  }

  get frame() {
    return Number(this.sprite.frame.name);
  }

  get isClimbing() {
    return this.climbing;
  }

  get nearCurtain() {
    return this.overlapsCurtain;
  }

  get activity() {
    return this.action;
  }

  /** Detached read-only contact data for interaction models. */
  // eslint-disable-next-line max-lines-per-function -- Der vollständige losgelöste Kontaktvertrag bleibt zusammen; er enthält keine Engine-Referenzen.
  get contact() {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    return Object.freeze({
      x: body.x,
      y: body.y,
      bottom: body.bottom,
      centerX: body.center.x,
      left: body.left,
      right: body.right,
      width: body.width,
      height: body.height,
      grounded: body.blocked.down,
      blocked: Object.freeze({
        down: body.blocked.down,
        left: body.blocked.left,
        right: body.blocked.right,
      }),
      velocity: Object.freeze({ x: body.velocity.x, y: body.velocity.y }),
    });
  }

  faceToward(x: number) {
    this.sprite.setFlipX(this.x > x);
  }

  move(input: InputState, time: number, delta: number, area: Bounds | undefined) {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    this.updateClimbing(input, time, area, body);
    body.setAllowGravity(!this.climbing);

    if (this.climbing) this.moveOnCurtain(input, time, body);
    else this.moveFreely(input, delta, body);

    if (input.horizontal !== 0) this.sprite.setFlipX(input.horizontal < 0);
  }

  // eslint-disable-next-line max-lines-per-function -- Die typisierte Signatur und die kurze Folge aus Kontakt, Greifsperre und Ablösen bleiben zusammen.
  private updateClimbing(
    input: InputState,
    time: number,
    area: Bounds | undefined,
    body: Phaser.Physics.Arcade.Body,
  ) {
    this.overlapsCurtain = touchesCurtain(body, area);

    if (!this.overlapsCurtain) this.mustLeaveCurtain = false;

    if (!this.climbing && this.canGrab(input, time, body)) this.climbing = true;

    this.detachFromCurtain(input, time, body);
  }

  private detachFromCurtain(input: InputState, time: number, body: Phaser.Physics.Arcade.Body) {
    if (this.climbing && (!this.overlapsCurtain || (input.vertical >= 0 && body.blocked.down))) {
      this.climbing = false;
      this.grabBlockedUntil = this.overlapsCurtain ? time : time + 250;
    }
  }

  private canGrab(input: InputState, time: number, body: Phaser.Physics.Arcade.Body) {
    const available = !this.mustLeaveCurtain && time >= this.grabBlockedUntil && !input.jumpPressed;
    const approaching =
      input.vertical < 0 ||
      (input.vertical > 0 && !body.blocked.down) ||
      jumpingIntoCurtain(input, body);

    return available && this.overlapsCurtain && approaching;
  }

  private moveOnCurtain(input: InputState, time: number, body: Phaser.Physics.Arcade.Body) {
    const speedY =
      input.vertical < 0
        ? -CURTAIN_SLIDE.climbSpeed
        : input.vertical > 0
          ? CURTAIN_SLIDE.descendSpeed
          : CURTAIN_SLIDE.slideSpeed;

    this.sprite.setVelocity(input.horizontal * 110, speedY);

    if (input.jumpPressed) this.jumpFromCurtain(input, time, body);
  }

  private jumpFromCurtain(input: InputState, time: number, body: Phaser.Physics.Arcade.Body) {
    this.climbing = false;
    this.grabBlockedUntil = time + 250;
    this.mustLeaveCurtain = true;
    body.setAllowGravity(true);
    this.sprite.setVelocity((input.horizontal || -1) * 240, -340);
    this.scene.events.emit('object-impact', 'jump');
  }

  private moveFreely(input: InputState, delta: number, body: Phaser.Physics.Arcade.Body) {
    if (body.blocked.down) this.sprite.setVelocityX(input.horizontal * 230);
    else if (input.horizontal !== 0) this.steerInAir(input.horizontal, delta, body);

    if (input.jumpPressed && body.blocked.down) {
      this.sprite.setVelocityY(-480);
      this.scene.events.emit('object-impact', 'jump');
    }
  }

  private steerInAir(horizontal: number, delta: number, body: Phaser.Physics.Arcade.Body) {
    const speed = body.velocity.x + (horizontal * 700 * Math.min(delta, 50)) / 1000;

    this.sprite.setVelocityX(Phaser.Math.Clamp(speed, -240, 240));
  }

  // eslint-disable-next-line max-lines-per-function -- Die Auswahl der sichtbaren Aktion und die geordnete Synchronisierung der Darstellung bilden einen Frame-Schritt.
  present(time: number, groundAction: GroundAction, sliding: boolean) {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    this.action =
      groundAction !== 'idle'
        ? groundAction
        : this.climbing
          ? sliding
            ? 'sliding'
            : 'climbing'
          : 'idle';
    this.trackLanding(time, body);
    const animation = this.playAnimation(time, groundAction, sliding, body);

    this.positionVisual(body, animation, time);
  }

  private trackLanding(time: number, body: Phaser.Physics.Arcade.Body) {
    if (this.isLanding(body)) this.landingUntil = time + 140;
    // Spawning on the floor is not a landing; only animate a later real flight.
    this.hasGroundContact ||= body.blocked.down;
    this.wasAirborne =
      this.hasGroundContact && !this.climbing && (!body.blocked.down || body.velocity.y < -1);
  }

  private isLanding(body: Phaser.Physics.Arcade.Body) {
    return this.hasGroundContact && this.wasAirborne && body.blocked.down && body.velocity.y >= 0;
  }

  // eslint-disable-next-line max-lines-per-function -- Der vollständige deklarative Animationszustand bleibt unmittelbar neben dem play-Aufruf.
  private playAnimation(
    time: number,
    groundAction: GroundAction,
    sliding: boolean,
    body: Phaser.Physics.Arcade.Body,
  ) {
    const animation = pixelAnimation({
      climbing: this.climbing,
      sliding,
      grounded: body.blocked.down,
      velocityX: body.velocity.x,
      velocityY: body.velocity.y,
      scratching: groundAction === 'scratching',
      retching: groundAction === 'retching',
      nibbling: groundAction === 'nibbling' || groundAction === 'wobbling',
      landing: time < this.landingUntil,
    });

    this.sprite.play(animation, true);

    if (this.climbing) this.sprite.setFlipX(false);

    return animation;
  }

  // eslint-disable-next-line max-lines-per-function -- Eine zusammenhängende Transformationskette richtet das sichtbare Sprite am Physikkörper aus.
  private positionVisual(
    body: Phaser.Physics.Arcade.Body,
    animation: keyof typeof PIXEL_ANIMATIONS,
    time: number,
  ) {
    const scale = PIXEL_ANIMATIONS[animation].scale;
    const pulse =
      animation === 'retch' && !motionPreferences.snapshot().reduced
        ? Math.sin(time / 75) * 0.025
        : 0;
    const scaleY = scale * (1 + pulse);

    this.visual
      .setTexture('pixel', this.sprite.frame.name)
      .setFlipX(this.flipX)
      .setScale(scale * (1 - pulse), scaleY)
      .setPosition(body.center.x, body.bottom - 16 * scaleY);
  }

  // eslint-disable-next-line max-lines-per-function -- Der flache Beobachtungsvertrag bleibt vollständig an einer Stelle sichtbar.
  snapshot() {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    return {
      x: this.x,
      y: this.y,
      bottom: body.bottom,
      left: body.left,
      top: body.top,
      bodyWidth: body.width,
      bodyHeight: body.height,
      displayWidth: this.visual.displayWidth,
      displayHeight: this.visual.displayHeight,
      velocityX: body.velocity.x,
      velocityY: body.velocity.y,
      grounded: body.blocked.down,
      climbing: this.climbing,
      gravity: body.allowGravity,
      animation: this.sprite.anims.currentAnim?.key ?? null,
      animationFrame: this.frame,
      flipX: this.flipX,
      texture: this.sprite.texture.key,
    };
  }

  setPaused(paused: boolean) {
    if (paused) this.sprite.anims.pause();
    else this.sprite.anims.resume();
  }

  destroy() {
    this.sprite.destroy();
    this.visual.destroy();
  }
}

// eslint-disable-next-line max-lines-per-function -- Eine Schleife registriert die deklarativen Frame-, Geschwindigkeits- und Wiederholungswerte gemeinsam.
function registerAnimations(scene: Phaser.Scene) {
  for (const [key, config] of Object.entries(PIXEL_ANIMATIONS)) {
    if (!scene.anims.exists(key))
      scene.anims.create({
        key,
        frames: config.frames.map((frame) => ({ key: 'pixel', frame })),
        frameRate: config.frameRate,
        repeat: config.repeat,
      });
  }
}

function touchesCurtain(body: Phaser.Physics.Arcade.Body, area: Bounds | undefined) {
  return (
    area !== undefined &&
    Phaser.Geom.Intersects.RectangleToRectangle(
      new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height),
      new Phaser.Geom.Rectangle(area.x, area.y, area.width, area.height),
    )
  );
}

function jumpingIntoCurtain(input: InputState, body: Phaser.Physics.Arcade.Body) {
  return !body.blocked.down && input.horizontal !== 0 && Math.abs(body.velocity.y) > 1;
}
