import {
  onLanguageChange,
  reportMissingTranslations,
  restoreLanguage,
  t,
  type TextKey,
} from './locale';

onLanguageChange(refresh);
restoreLanguage();

function refresh() {
  for (const node of Array.from(document.querySelectorAll<HTMLElement>('[data-i18n]')))
    node.textContent = t(node.dataset.i18n as TextKey);

  for (const node of Array.from(document.querySelectorAll<HTMLElement>('[data-i18n-label]')))
    node.setAttribute('aria-label', t(node.dataset.i18nLabel as TextKey));

  for (const node of Array.from(document.querySelectorAll<HTMLElement>('[data-i18n-title]')))
    node.title = t(node.dataset.i18nTitle as TextKey);
}

if (import.meta.env.DEV) {
  const missing = reportMissingTranslations();

  if (missing.length) console.warn('Missing English translations:', missing);
}
