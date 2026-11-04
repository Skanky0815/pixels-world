import type Phaser from 'phaser';
import { DamageHistory } from '../domain/chaos-event';
import { PlantNibbling, type PlantConfig } from '../interactions/plant-nibbling';
import { standingStill, type Destructible, type Interactable, type InteractionContext, type InteractionResult } from '../interactions/contracts';

export interface PlantObjectConfig {
  readonly id: string; readonly x: number; readonly floorY: number;
  readonly reach: { readonly left: number; readonly right: number };
  readonly rules: PlantConfig;
}

export class Plant implements Interactable, Destructible {
  readonly id: string;
  readonly maximumScore: number;
  private readonly model: PlantNibbling;
  private readonly history = new DamageHistory();
  private readonly graphic: Phaser.GameObjects.Graphics;
  private readonly soil: Phaser.GameObjects.Graphics;

  private readonly config: PlantObjectConfig;

  constructor(scene: Phaser.Scene, config: PlantObjectConfig) {
    this.config = { ...config, reach: { ...config.reach }, rules: { ...config.rules } };
    this.id = config.id;
    this.model = new PlantNibbling(config.rules, this.id);
    this.maximumScore = config.rules.nibbleValue + config.rules.tipValue;
    this.graphic = scene.add.graphics({ x: config.x, y: config.floorY });
    this.soil = scene.add.graphics();
    this.draw();
  }

  eligible(context: InteractionContext) {
    const p = context.pixel, c = this.config;
    return standingStill(context) && p.x >= c.x + c.reach.left && p.x <= c.x + c.reach.right && Math.abs(p.bottom - c.floorY) < 2;
  }

  update(context: InteractionContext, active: boolean): InteractionResult {
    const c = this.config;
    const event = this.model.update(context.delta, active && this.eligible(context));
    if (event) {
      this.history.record(event);
      this.draw();
      if (event.kind === 'tip') {
        this.graphic.setAngle(-80).setPosition(c.x + 10, c.floorY - 17);
        this.soil.fillStyle(0x59443d);
        for (let i = 0; i < 12; i++) this.soil.fillRect(c.x - 46 + i * 13 % 74, c.floorY - 2 - i % 3, 4 + i % 3, 3);
      }
    }
    const { state, progress } = this.model.snapshot();
    const nibbling = state === 'nibbling' || state === 'wobbling';
    if (state !== 'tipped') this.graphic.setAngle(state === 'wobbling' ? Math.sin(progress * Math.PI * 8) * (5 + progress * 12) : nibbling ? Math.sin(context.time / 80) * 2 : 0);
    return { action: nibbling ? state : 'idle', faceX: nibbling ? c.x : undefined, event };
  }

  private draw() {
    const g = this.graphic.clear();
    const bitten = this.model.snapshot().damage > 0;
    g.lineStyle(3, 0x596d57);
    for (let i = 0; i < 7; i++) {
      const x = (i - 3) * 4;
      const height = 22 + i % 3 * 5 - (bitten && i > 3 ? 9 : 0);
      g.lineBetween(x, -19, x + (i - 3) * 2, -19 - height);
    }
    g.fillStyle(0x718463);
    for (let i = 0; i < 5; i++) g.fillRect((i - 2) * 6, -30 - i % 2 * 9, 3, 12);
    g.fillStyle(0xb47655).fillRect(-17, -20, 34, 20);
    g.fillStyle(0xc98a64).fillRect(-20, -23, 40, 5);
    g.fillStyle(0x59443d).fillRect(-15, -23, 30, 3);
    if (bitten) g.fillStyle(0x91a07a).fillRect(8, -29, 5, 3);
  }

  damageSnapshot() { return this.history.snapshot(); }
  snapshot() { return { ...this.model.snapshot(), ...this.damageSnapshot(), angle: this.graphic.angle }; }
  reset() {
    this.model.reset(); this.history.reset();
    this.graphic.setAngle(0).setPosition(this.config.x, this.config.floorY);
    this.soil.clear(); this.draw();
  }
  destroy() { this.graphic.destroy(); this.soil.destroy(); }
}
