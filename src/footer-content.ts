export interface BuildInfo {
  year: number;
  version: string;
  releaseUrl: string | null;
  releaseTitle: string;
  dev: boolean;
}

function escape(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ??
      character,
  );
}

function versionMarkup(info: BuildInfo) {
  const version = `v${escape(info.version)}`;

  return info.releaseUrl
    ? `<a href="${escape(info.releaseUrl)}" target="_blank" rel="noopener noreferrer" title="${escape(info.releaseTitle)}">${version}</a>`
    : `<span>${version}</span>`;
}

function devMarkup() {
  return [
    ['DEV · Animationen', '/animation-compare.html'],
    ['DEV · Playground', '/interactable-playground.html'],
  ]
    .map(([label, href]) => ` · <a href="${href}">${label}</a>`)
    .join('');
}

/** Runtime and static legal pages share one escaped copyright/version fragment. */
export function buildInfoMarkup(info: BuildInfo) {
  return `© ${info.year} Pixel's World · ${versionMarkup(info)}${info.dev ? devMarkup() : ''}`;
}
