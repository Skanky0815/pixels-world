import { de } from './de.ts';
import { en } from './en.ts';

export type Language = 'de' | 'en';
export type TextKey = keyof typeof de;
type Values = Readonly<Record<string, string | number>>;
export const LANGUAGE_STORAGE_KEY = 'pixels-world.language';
const listeners = new Set<() => void>();
const keys = Object.keys(de) as TextKey[];
let language: Language = 'de';

export function currentLanguage() {
  return language;
}

export function resolveText(
  key: TextKey,
  lang: Language,
  english: Partial<Record<TextKey, string>> = en,
) {
  return (lang === 'en' ? english[key] : undefined) ?? de[key];
}

export function translateExact(value: string): string {
  const key = keys.find((key) => de[key] === value || en[key] === value);

  return key ? resolveText(key, language) : value;
}

export function t(key: TextKey, values: Values = {}) {
  return interpolate(resolveText(key, language), values, translateExact);
}

/** Canonical content stays independent of UI language and cannot affect domain decisions. */
export function copy(key: TextKey, values: Values = {}) {
  return interpolate(de[key], values, String);
}

function interpolate(template: string, values: Values, translate: (value: string) => string) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    translate(String(values[key] ?? `{${key}}`)),
  );
}

export function onLanguageChange(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function setLanguage(next: Language, persist = true) {
  language = next;

  if (persist) saveLanguage(next);

  if (typeof document !== 'undefined') document.documentElement.lang = next;

  for (const listener of listeners) listener();
}

function saveLanguage(next: Language) {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
  } catch {
    /* Storage may be unavailable. */
  }
}

export function restoreLanguage() {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);

    setLanguage(saved === 'en' ? 'en' : 'de', false);
  } catch {
    setLanguage('de', false);
  }
}

export function reportMissingTranslations(english: Partial<Record<TextKey, string>> = en) {
  return keys.filter((key) => english[key] === undefined);
}
