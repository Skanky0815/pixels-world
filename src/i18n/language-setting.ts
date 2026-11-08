import { currentLanguage, setLanguage, onLanguageChange, t } from './locale';

// eslint-disable-next-line max-lines-per-function -- Ein wiederverwendbarer Sprachwähler besitzt ausschließlich seine DOM-Ereignisse und die gemeinsame Lokalisierung.
export function createLanguageSetting(host: Element) {
  const picker = document.createElement('div');
  const abort = new AbortController();

  picker.className = 'language-setting';
  picker.setAttribute('role', 'group');
  picker.innerHTML =
    '<button type="button" class="ui-button ui-button--icon" data-language="de" aria-label="Deutsch" lang="de">DE</button><span aria-hidden="true">/</span><button type="button" class="ui-button ui-button--icon" data-language="en" aria-label="English" lang="en">EN</button>';
  const refresh = () => {
    picker.setAttribute('aria-label', t('language'));

    for (const button of Array.from(picker.querySelectorAll('button')))
      button.setAttribute('aria-pressed', String(button.dataset.language === currentLanguage()));
  };

  const unsubscribe = onLanguageChange(refresh);

  picker.addEventListener(
    'click',
    (event) => {
      const button =
        event.target instanceof Element
          ? event.target.closest<HTMLButtonElement>('[data-language]')
          : null;
      const next = button?.dataset.language;

      if ((next === 'de' || next === 'en') && next !== currentLanguage()) setLanguage(next);
    },
    { signal: abort.signal },
  );
  host.append(picker);
  refresh();

  return () => {
    abort.abort();
    unsubscribe();
    picker.remove();
  };
}
