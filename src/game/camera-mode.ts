const PHONE = '(any-pointer: coarse) and (orientation: landscape) and (max-height: 550px)';
const DESKTOP = '(pointer: fine) and (min-width: 1025px)';

export function desktopFollowsPixel() {
  return (
    document.documentElement.classList.contains('follow-camera') && matchMedia(DESKTOP).matches
  );
}

export function followsPixel() {
  return (
    document.documentElement.classList.contains('follow-camera') &&
    (matchMedia(PHONE).matches || desktopFollowsPixel())
  );
}
