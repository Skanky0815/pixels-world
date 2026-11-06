import {
  currentLanguage,
  onLanguageChange,
  reportMissingTranslations,
  restoreLanguage,
  setLanguage,
  t,
  type TextKey,
} from './locale';

const label = document.createElement('label');

label.className = 'language-setting';
label.innerHTML =
  '<span data-i18n="language"></span><select id="language" aria-label="Sprache"><option value="de">Deutsch</option><option value="en">English</option></select>';
document.querySelector('header')?.append(label);
const select = requiredSelect();

function requiredSelect() {
  const node = label.querySelector('select');

  if (!node) throw new Error('Language select missing');

  return node;
}

select.addEventListener('change', () => setLanguage(select.value === 'en' ? 'en' : 'de'));
onLanguageChange(refresh);
restoreLanguage();

function refresh() {
  for (const node of Array.from(document.querySelectorAll<HTMLElement>('[data-i18n]')))
    node.textContent = t(node.dataset.i18n as TextKey);

  for (const node of Array.from(document.querySelectorAll<HTMLElement>('[data-i18n-label]')))
    node.setAttribute('aria-label', t(node.dataset.i18nLabel as TextKey));

  for (const node of Array.from(document.querySelectorAll<HTMLElement>('[data-i18n-title]')))
    node.title = t(node.dataset.i18nTitle as TextKey);
  select.value = currentLanguage();
  select.setAttribute('aria-label', t('language'));
}

if (import.meta.env.DEV) {
  const missing = reportMissingTranslations();

  if (missing.length) console.warn('Missing English translations:', missing);
}
