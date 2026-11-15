import { t, onLanguageChange } from './i18n/locale';
import { buildInfoMarkup } from './footer-content';
const footer = document.querySelector('#build-info');

if (!footer) throw new Error('Build footer missing');

const refresh = () => {
  footer.innerHTML = buildInfoMarkup({
    year: new Date().getFullYear(),
    version: __APP_VERSION__,
    releaseUrl: __APP_RELEASE_URL__,
    releaseTitle: t('releaseNotesForVNewTab', { v0: __APP_VERSION__ }),
    dev: import.meta.env.DEV,
  });
  refreshDisclosure();
};

function refreshDisclosure() {
  const disclosure = document.querySelector('.ai-disclosure');

  if (disclosure) disclosure.textContent = t('aiDisclosure');
}

refresh();
onLanguageChange(refresh);
