import {
  CHARM_PREVIEW_ACTIONS,
  CharmPreviewMotion,
  type CharmPreviewAction,
} from './charm-preview-motion';

/** Show the same looping poses as the room preview, without replaying the approach. */
// eslint-disable-next-line max-lines-per-function -- Eine gemeinsame Abtastung erhält die originalen Posen und Schleifenzeiten statt einer zweiten Animationsdefinition.
export function charmComparisonClip(action: CharmPreviewAction) {
  const motion = new CharmPreviewMotion();
  const config = CHARM_PREVIEW_ACTIONS[action];

  motion.trigger(action);
  motion.advance(config.approach);
  const poses = Array.from({ length: config.cycle / 100 }, () => {
    const pose = motion.pose();

    motion.advance(100);

    return pose;
  });

  return { poses, frames: poses.map((_, index) => index), frameRate: 10, scale: 2 };
}

export const CHARM_COMPARISON_CLIPS = {
  rub: charmComparisonClip('rub'),
  headbutt: charmComparisonClip('headbutt'),
  purr: charmComparisonClip('purr'),
  paw: charmComparisonClip('paw'),
  roll: charmComparisonClip('roll'),
};
