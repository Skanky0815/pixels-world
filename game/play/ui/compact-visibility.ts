import { desktopFollowsPixel } from '../camera-mode';

/** Keep the desktop canvas labels; touch and narrow windows read the same data in CSS pixels. */
export function compactVisibility(target: { setVisible(visible: boolean): unknown }) {
  const media = matchMedia('(any-pointer: coarse), (max-width: 1024px)');
  const update = () => target.setVisible(!media.matches && !desktopFollowsPixel());

  update();
  media.addEventListener('change', update);

  return () => media.removeEventListener('change', update);
}
