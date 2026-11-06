/** Keep the desktop canvas labels; compact devices read the same data in CSS pixels. */
export function compactVisibility(target: { setVisible(visible: boolean): unknown }) {
  const media = matchMedia('(any-pointer: coarse) and (max-width: 1100px)');
  const update = () => target.setVisible(!media.matches);

  update();
  media.addEventListener('change', update);

  return () => media.removeEventListener('change', update);
}
