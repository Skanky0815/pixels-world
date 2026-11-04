import type Phaser from 'phaser';
import { DamageHistory } from '../domain/chaos-event';
import { CurtainSliding, type TearConfig } from '../interactions/curtain-sliding';
import type { Bounds, Climbable, Destructible, InteractionContext } from '../interactions/contracts';

export interface CurtainConfig { readonly id: string; readonly area: Bounds; readonly rules: TearConfig }

export class Curtain implements Climbable, Destructible {
  readonly id: string;
  readonly climbArea: Bounds;
  readonly maximumScore: number;
  private readonly model: CurtainSliding;
  private readonly history = new DamageHistory();
  private readonly graphic: Phaser.GameObjects.Graphics;
  private readonly marks: Phaser.GameObjects.Graphics;
  private previousY: number | null = null;
  private previousSpeed = 0;

  constructor(scene: Phaser.Scene, config: CurtainConfig) {
    this.id = config.id;
    this.model = new CurtainSliding(config.rules, this.id);
    this.climbArea = Object.freeze({ ...config.area });
    this.maximumScore = config.rules.maxDamage * config.rules.damageValue;
    const a = this.climbArea;
    this.graphic = scene.add.graphics();
    this.graphic.fillStyle(0xa5654e).fillRect(a.x, a.y, a.width, a.height);
    for (let x = a.x + 4; x < a.x + a.width; x += 18) {
      this.graphic.fillStyle(0xbd8060).fillRect(x, a.y, Math.min(7, a.x + a.width - x), a.height);
      this.graphic.fillStyle(0x95553f).fillRect(x + 7, a.y, Math.max(0, Math.min(4, a.x + a.width - x - 7)), a.height);
    }
    this.graphic.lineStyle(2, 0xeac791, 0.9).strokeRect(a.x, a.y, a.width, a.height);
    this.marks = scene.add.graphics();
  }

  updateClimb(context: InteractionContext, attached: boolean) {
    const p = context.pixel;
    const state = !attached ? 'detached' : context.input.vertical < 0 ? 'climbing' : 'sliding';
    const distance = this.previousY === null ? 0 : p.top - this.previousY;
    const movementMs = distance > 0 && this.previousSpeed > 0 ? distance / this.previousSpeed * 1000 : 0;
    this.previousY = p.top;
    this.previousSpeed = state === 'sliding' ? p.velocityY : 0;
    const event = this.model.update(movementMs, state, movementMs > 0 && !p.grounded);
    if (event) {
      this.history.record(event);
      const a = this.climbArea, side = p.x > a.x + a.width / 2 ? -1 : 1;
      const x = Math.max(a.x + 8, Math.min(p.x + side * (44 + event.stage % 3 * 4), a.x + a.width - 8));
      const y = Math.max(a.y + 4, Math.min(p.y - 14, a.y + a.height - 38));
      this.marks.lineStyle(3, 0x59443d).beginPath();
      this.marks.moveTo(x, y).lineTo(x - 3, y + 8).lineTo(x + 2, y + 18).lineTo(x - 2, y + 30).strokePath();
      this.marks.lineStyle(1, 0xeac791);
      for (let i = 0; i < 4; i++) this.marks.lineBetween(x - 5, y + i * 7, x + 5, y + i * 7 + 2);
    }
    return event;
  }

  damageSnapshot() { return this.history.snapshot(); }
  snapshot() { return { ...this.model.snapshot(), ...this.damageSnapshot() }; }
  reset() { this.model.reset(); this.history.reset(); this.previousY = null; this.previousSpeed = 0; this.marks.clear(); }
  destroy() { this.graphic.destroy(); this.marks.destroy(); }
}
