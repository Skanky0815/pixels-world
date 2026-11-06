import {
  currentLanguage,
  onLanguageChange,
  reportMissingTranslations,
  restoreLanguage,
  setLanguage,
  t,
  type TextKey,
} from './locale';

const picker = document.createElement('div');

picker.className = 'language-setting';
picker.setAttribute('role', 'group');
picker.innerHTML =
  '<button type="button" data-language="de" aria-label="Deutsch" lang="de">DE</button><span aria-hidden="true">/</span><button type="button" data-language="en" aria-label="English" lang="en">EN</button>';
document.querySelector('header')?.append(picker);
picker.addEventListener('click', (event) => {
  const button =
    event.target instanceof Element
      ? event.target.closest<HTMLButtonElement>('[data-language]')
      : null;
  const next = button?.dataset.language;

  if ((next === 'de' || next === 'en') && next !== currentLanguage()) setLanguage(next);
});
onLanguageChange(refresh);
restoreLanguage();

function refresh() {
  for (const node of Array.from(document.querySelectorAll<HTMLElement>('[data-i18n]')))
    node.textContent = t(node.dataset.i18n as TextKey);

  for (const node of Array.from(document.querySelectorAll<HTMLElement>('[data-i18n-label]')))
    node.setAttribute('aria-label', t(node.dataset.i18nLabel as TextKey));

  for (const node of Array.from(document.querySelectorAll<HTMLElement>('[data-i18n-title]')))
    node.title = t(node.dataset.i18nTitle as TextKey);
  refreshButtons();
}

function refreshButtons() {
  picker.setAttribute('aria-label', t('language'));

  for (const button of Array.from(picker.querySelectorAll<HTMLButtonElement>('button')))
    button.setAttribute('aria-pressed', String(button.dataset.language === currentLanguage()));
}

if (import.meta.env.DEV) {
  const missing = reportMissingTranslations();

  if (missing.length) console.warn('Missing English translations:', missing);
}
