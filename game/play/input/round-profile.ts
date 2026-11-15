/** Compiled away outside the short E2E build; no runtime setter or window hook. */
export function roundConfigForPage() {
  if (__E2E_ROUND_CONFIG__ === undefined) return undefined;

  return new URLSearchParams(location.search).get('round-profile') === 'fast'
    ? __E2E_ROUND_CONFIG__
    : undefined;
}
