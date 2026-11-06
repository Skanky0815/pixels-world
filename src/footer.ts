import { t, onLanguageChange } from './i18n/locale';
const footer = document.querySelector('#build-info');

if (!footer) throw new Error('Build footer missing');
footer.append(`© ${new Date().getFullYear()} Pixel's World · `);
const version = document.createElement(__APP_RELEASE_URL__ ? 'a' : 'span');

version.textContent = `v${__APP_VERSION__}`;

if (version instanceof HTMLAnchorElement && __APP_RELEASE_URL__) {
  version.href = __APP_RELEASE_URL__;
  version.target = '_blank';
  version.rel = 'noopener noreferrer';
  const refresh = () => {
    version.title = t('releaseNotesForVNewTab', { v0: __APP_VERSION__ });
  };

  refresh();
  onLanguageChange(refresh);
}

footer.append(version);

export {};
