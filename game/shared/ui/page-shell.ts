import { de } from '../i18n/de.ts';
import type { TextKey } from '../i18n/locale.ts';

export type ShellKind = 'landing' | 'game' | 'legal';
export const SITE_NAME = 'Pixel’s World';
export const AGE_RATING = 6;

const LINKS = {
  about: { href: './#spielidee', key: 'landingAbout' },
  team: { href: './#team', key: 'teamNav' },
  emojis: { href: './#emojis', text: 'Emojis' },
  help: { href: './help.html', key: 'helpNav' },
  github: { href: 'https://github.com/Skanky0815/pixels-world', text: 'GitHub ↗', external: true },
  feedback: {
    href: 'https://github.com/Skanky0815/pixels-world/issues/new/choose',
    key: 'feedbackIdeas',
    external: true,
  },
  legal: { href: './impressum.html', key: 'legalNoticeGerman' },
  privacy: { href: './datenschutz.html', key: 'privacyGerman' },
} satisfies Record<string, Link>;

interface Link {
  href: string;
  key?: TextKey;
  text?: string;
  external?: boolean;
}

function escape(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ??
      character,
  );
}

// eslint-disable-next-line max-lines-per-function -- Linkattribute und lokalisierter Text bilden einen gemeinsamen HTML-Vertrag.
function linkMarkup(id: keyof typeof LINKS) {
  const link: Link = LINKS[id];
  const label = link.key ? ` data-i18n="${link.key}"` : '';
  const external = link.external ? ' target="_blank" rel="noopener noreferrer"' : '';
  const title =
    id === 'feedback'
      ? ` title="${escape(de.opensGithubInANewTab)}" data-i18n-title="opensGithubInANewTab"`
      : '';
  const style = id === 'help' ? ' class="help-link"' : '';

  return `<a href="${link.href}"${style}${external}${title}${label}>${escape(link.key ? de[link.key] : (link.text ?? ''))}</a>`;
}

/** Page variants supply their own game content; shared chrome owns no scene or input logic. */
export function pageHeader(kind: ShellKind, extension = '') {
  if (kind === 'game')
    return `<header class="game-header">${extension.replace('<!-- SITE_NAME -->', SITE_NAME)}</header>`;
  const brand = `<a class="wordmark" href="./" aria-label="${SITE_NAME}">${SITE_NAME}<span aria-hidden="true">✦</span></a>`;
  const links = (['about', 'team', 'emojis', 'help', 'github'] as const).map(linkMarkup).join('\n');
  const language = kind === 'landing' ? '<div id="landing-language"></div>' : '';

  return `<header class="landing-header">${brand}<nav aria-label="Navigation">${links}${language}</nav></header>`;
}

export function ageRatingMarkup() {
  return `<p class="age-rating"><span data-i18n="ageRatingPrefix">${escape(de.ageRatingPrefix)}</span><strong class="age-number">${AGE_RATING}</strong><span data-i18n="ageRatingSuffix">${escape(de.ageRatingSuffix)}</span><span data-i18n="ageRatingReasons">${escape(de.ageRatingReasons)}</span></p>`;
}

function footerLinks(kind: ShellKind) {
  const common = ['feedback', 'legal', 'privacy'] as const;
  const ids = kind === 'game' ? common : (['help', ...common] as const);
  const links = ids.map(linkMarkup).join('\n');

  return kind === 'game'
    ? `<p class="feedback-link">${links}</p>`
    : `<div class="landing-links">${links}</div>`;
}

export function pageFooter(kind: ShellKind, extension = '') {
  const build = `<p id="build-info" class="build-info" aria-label="${escape(de.buildVersion)}" data-i18n-label="buildVersion"><!-- BUILD_INFO --></p>`;
  const links = footerLinks(kind);
  const meta = kind === 'game' ? `<div class="footer-meta">${links}${build}</div>` : links + build;
  const disclosure = `<p class="ai-disclosure" data-i18n="aiDisclosure">${escape(de.aiDisclosure)}</p>`;

  return `<footer class="${kind === 'game' ? 'game' : 'landing'}-footer">${extension}${meta}${disclosure}${ageRatingMarkup()}</footer>`;
}
