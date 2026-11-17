import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buttonMarkup, closeButtonMarkup } from '../../game/shared/ui/button.ts';

test('Buttonnamen und sichtbarer Text bleiben auch mit Sonderzeichen reiner Text', () => {
  const markup = buttonMarkup({ label: '<Weiter & "zurück">', text: "<Klick 'hier'>" });

  assert.match(markup, /type="button"/);
  assert.match(markup, /aria-label="&lt;Weiter &amp; &quot;zurück&quot;&gt;"/);
  assert.match(markup, />&lt;Klick &#39;hier&#39;&gt;<\/button>/);
});

test('Kurze Sprachlabels behalten volle zugängliche Namen und native Sprachattribute', () => {
  const markup = buttonMarkup(
    { label: 'Deutsch', text: 'DE', variant: 'language' },
    'data-language="de" lang="de"',
  );

  assert.match(markup, /class="ui-button ui-button--language"/);
  assert.match(markup, /lang="de"/);
  assert.match(markup, /aria-label="Deutsch" title="Deutsch">DE<\/button>/);
});

test('Schließen bleibt eine beschriftete Aktion mit rein dekorativem Icon', () => {
  const markup = closeButtonMarkup('Album schließen', 'data-focus="close"');

  assert.match(markup, /ui-button--icon/);
  assert.match(markup, /data-popup-close data-focus="close"/);
  assert.match(markup, /aria-label="Album schließen"/);
  assert.match(markup, /<span aria-hidden="true">×<\/span>/);
});
