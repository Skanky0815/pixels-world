import assert from 'node:assert/strict';
import { test } from 'node:test';
import { de } from '../../src/i18n/de.ts';
import { en } from '../../src/i18n/en.ts';
import {
  copy,
  currentLanguage,
  onLanguageChange,
  reportMissingTranslations,
  resolveText,
  restoreLanguage,
  setLanguage,
  t,
  type TextKey,
} from '../../src/i18n/locale.ts';

test('Beide Kataloge enthalten dieselben Schlüssel und Platzhalter', () => {
  assert.deepEqual(Object.keys(en).sort(), Object.keys(de).sort());

  for (const key of Object.keys(de) as TextKey[])
    assert.deepEqual(en[key].match(/\{\w+\}/g)?.sort(), de[key].match(/\{\w+\}/g)?.sort(), key);
  assert.deepEqual(reportMissingTranslations(), []);
});

test('Fehlende englische Übersetzungen fallen auf Deutsch zurück und werden gemeldet', () => {
  assert.equal(resolveText('someTimeLeft', 'en', {}), de.someTimeLeft);
  assert.ok(reportMissingTranslations({}).includes('someTimeLeft'));
});

test('Sprache übersetzt kanonische Inhalte ohne das Datenmodell zu verändern', () => {
  const canonical = copy('relaxed');

  setLanguage('en', false);
  assert.equal(t('chaos', { v0: 7, v1: 'Mood', v2: canonical }).includes('Relaxed'), true);
  assert.equal(canonical, 'Entspannt');
  setLanguage('de', false);
});

// eslint-disable-next-line max-lines-per-function -- Wiederherstellung, ungültige Werte und blockierter Speicher gehören zum gemeinsamen Persistenzvertrag.
test('Sprachwahl überlebt Wiederherstellung; gesperrter Speicher bleibt bedienbar', () => {
  let saved: string | null = null;
  let notices = 0;
  const unsubscribe = onLanguageChange(() => notices++);

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: () => saved,
      setItem: (_key: string, value: string) => {
        saved = value;
      },
    },
  });
  setLanguage('en');
  restoreLanguage();
  assert.equal(currentLanguage(), 'en');
  saved = 'invalid';
  restoreLanguage();
  assert.equal(currentLanguage(), 'de');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: () => {
        throw Error('blocked');
      },
      setItem: () => {
        throw Error('blocked');
      },
    },
  });
  setLanguage('en');
  assert.equal(currentLanguage(), 'en');
  restoreLanguage();
  assert.equal(currentLanguage(), 'de');
  unsubscribe();
  assert.equal(notices, 5);
});
