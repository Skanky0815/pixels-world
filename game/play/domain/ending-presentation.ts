import { SARA_ENDINGS, type EndingKind } from '../actors/sara-endings.ts';
import type { CharmPose } from './charm-motion.ts';
import type { RoundResult } from './round-result.ts';

/** Result animation only: outcome, points, album and restart remain outside this model. */
export class EndingPresentation {
  private kind: EndingKind | null = null;
  private elapsed = 0;
  private pixelX = 0;

  update(result: Pick<RoundResult, 'outcome'> | null, pixel: CharmPose, delta: number) {
    if (!result) return;

    if (!this.kind) {
      this.kind = result.outcome === 'failed' ? 'sulk' : belly(pixel) ? 'belly' : 'head';
      this.pixelX = pixel.x;
    } else if (Number.isFinite(delta) && delta > 0)
      this.elapsed = Math.min(3000, this.elapsed + delta);
  }

  // eslint-disable-next-line max-lines-per-function -- Clip, Handabstand und Annäherung bilden eine gemeinsame unveränderliche Zeitprobe.
  pose(reduced = false) {
    if (!this.kind) return null;
    const clip = SARA_ENDINGS[this.kind];
    const index = reduced
      ? clip.frames.length - 1
      : Math.min(clip.frames.length - 1, Math.floor((this.elapsed * clip.frameRate) / 1000));

    return Object.freeze({
      kind: this.kind,
      key: clip.key,
      frame: clip.frames[index],
      gap: clip.gap,
      pixelX: this.pixelX,
      approach: reduced ? 1 : Math.min(1, this.elapsed / 500),
    });
  }

  pixelPose(pose: CharmPose): CharmPose {
    if (!this.kind || this.kind === 'sulk') return pose;

    return { ...pose, x: this.pixelX, behindSara: true };
  }

  snapshot() {
    return Object.freeze({
      kind: this.kind,
      elapsed: this.elapsed,
      complete: this.elapsed >= 3000,
    });
  }
}
export type EndingPose = NonNullable<ReturnType<EndingPresentation['pose']>>;

function belly(pose: CharmPose) {
  return pose.sheet === 'charm' && pose.frame >= 6;
}
