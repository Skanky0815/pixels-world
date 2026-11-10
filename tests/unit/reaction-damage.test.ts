import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chaosEvent, type DamageKind } from '../../src/game/domain/chaos-event.ts';
import { ReactionDamage } from '../../src/game/domain/reaction-damage.ts';
import { HomecomingSequence, selectReaction } from '../../src/game/domain/homecoming.ts';
import { DialogueMemory, selectSaraDialogue } from '../../src/game/domain/sara-dialogue.ts';
import {
  SARA_DAMAGE_DIALOGUE,
  type SaraDamageTopic,
  type SaraDialogueCatalogue,
} from '../../src/content/sara-reactions.ts';
import { setLanguage, translateExact } from '../../src/i18n/locale.ts';

const incidents: readonly [string, DamageKind, SaraDamageTopic][] = [
  ['couch', 'scratch', 'sofa'],
  ['curtain', 'tear', 'curtain'],
  ['plant', 'tip', 'plant'],
  ['vase', 'break', 'vase'],
  ['shelf', 'collapse', 'shelf'],
];

test('Fünf echte Objekt-/Ereignispaare liefern konkreten Kontext', () => {
  for (const [kind, eventKind, topic] of incidents) {
    const damage = new ReactionDamage();

    damage.record(chaosEvent('fixture', eventKind, 1, 2), kind);
    assert.equal(damage.snapshot()?.topic, topic);
    assert.equal(Object.isFrozen(damage.snapshot()), true);
  }
});

test('Unbekannte Typen, falsche Paare und nicht unterstützte Ereignisse bleiben generisch', () => {
  const damage = new ReactionDamage();

  for (const kind of [undefined, 'unknown', 'books', 'plant'])
    damage.record(chaosEvent('fixture', 'scratch', 1, 2), kind);
  damage.record(chaosEvent('grass', 'nibble', 1, 2), 'plant');
  assert.equal(damage.snapshot(), null);
  assert.equal(selectReaction(60, () => 0, { damage: damage.snapshot() }).damage, null);
});

// eslint-disable-next-line max-lines-per-function -- Gemischte Vorfälle werden in mehreren Reihenfolgen geprüft, einschließlich späterer kleinerer Ereignisse.
test('Einsturz hat Vorrang vor Vase, Pflanze, Vorhang und Sofa, unabhängig von der Reihenfolge', () => {
  for (const order of [
    incidents,
    [...incidents].reverse(),
    [...incidents.slice(2), ...incidents.slice(0, 2)],
  ]) {
    const damage = new ReactionDamage();

    for (const [kind, eventKind] of order) damage.record(chaosEvent(kind, eventKind, 1, 2), kind);
    assert.equal(damage.snapshot()?.topic, 'shelf');
  }

  for (let max = 0; max < incidents.length; max++) {
    const damage = new ReactionDamage();

    for (const [kind, eventKind] of incidents.slice(0, max + 1))
      damage.record(chaosEvent(kind, eventKind, 1, 2), kind);
    assert.equal(damage.snapshot()?.topic, incidents[max][2]);
  }
});

// eslint-disable-next-line max-lines-per-function -- Stufe, gleichwertige Objekt-ID und Duplikat sind derselbe deterministische Auswahlvertrag.
test('Bei gleicher Priorität entscheiden Stufe und stabile Objekt-ID; Duplikate ändern nichts', () => {
  const damage = new ReactionDamage();

  damage.record(chaosEvent('z', 'scratch', 3, 2), 'couch');
  damage.record(chaosEvent('a', 'scratch', 2, 2), 'couch');
  assert.equal(damage.snapshot()?.objectId, 'z');
  damage.record(chaosEvent('a', 'scratch', 3, 2), 'couch');
  const selected = damage.snapshot();

  damage.record(chaosEvent('a', 'scratch', 3, 2), 'couch');
  assert.equal(damage.snapshot(), selected);
  assert.equal(selected?.objectId, 'a');
});

test('Neustart leert den Kontext, bereits gelieferte Snapshots bleiben erhalten', () => {
  const damage = new ReactionDamage();

  damage.record(chaosEvent('pot', 'tip', 2, 10), 'plant');
  const previous = damage.snapshot();

  damage.reset();
  assert.equal(damage.snapshot(), null);
  assert.equal(previous?.topic, 'plant');
});

// eslint-disable-next-line max-lines-per-function -- Jeder Schadenspool muss für jede Gesamtärgerstufe erreichbar und lokalisiert sein, ohne zusätzliche Zufallsziehungen.
test('Konkrete Dialoge folgen weiterhin dem Gesamtscore und sind in DE/EN vorhanden', () => {
  for (const [kind, eventKind, topic] of incidents) {
    const damage = new ReactionDamage();

    damage.record(chaosEvent('fixture', eventKind, 1, 2), kind);

    for (const [score, anger] of [
      [0, 'calm'],
      [25, 'annoyed'],
      [60, 'angry'],
    ] as const) {
      const pool = SARA_DAMAGE_DIALOGUE[topic][anger];

      assert.ok(pool.length >= 2);

      for (const [index, line] of pool.entries())
        assert.equal(
          selectReaction(score, () => index / pool.length, { damage: damage.snapshot() }).dialogue,
          line,
        );
      assert.equal(selectReaction(score, () => 1, { damage: damage.snapshot() }).anger, anger);
    }
  }
});

// eslint-disable-next-line max-lines-per-function -- Der lückenhafte Katalog prüft gemeinsam unbekannte Namen, Leerzeilen und fehlende Stufen.
test('Fehlende, unbekannte und leere Schadenspools nutzen den bisherigen Raum-Fallback', () => {
  const catalogue: SaraDialogueCatalogue = {
    generic: { calm: ['Fallback'] },
    rooms: {},
    damage: { sofa: { calm: [] } },
  };

  for (const damageTopic of ['sofa', 'future', 'toString', '__proto__'])
    assert.equal(selectSaraDialogue('calm', 0, { damageTopic }, catalogue), 'Fallback');
  assert.equal(
    selectSaraDialogue('calm', 0, { damageTopic: 'sofa' }, { generic: {}, rooms: {} }).trim()
      .length > 0,
    true,
  );
});

// eslint-disable-next-line max-lines-per-function -- Auswahl, Erinnerung und die Lesepause halten den eingefrorenen Vorfall trotz späterer Modelländerungen stabil.
test('Schadensdialog bleibt einmalig und vermeidet Wiederholung in der nächsten Runde', () => {
  const memory = new DialogueMemory();
  const damage = new ReactionDamage();

  damage.record(chaosEvent('sofa', 'scratch', 1, 2), 'couch');
  const first = new HomecomingSequence({ memory });

  first.start(2, () => 0, damage.snapshot());
  const original = first.snapshot().selection;

  damage.record(chaosEvent('shelf', 'collapse', 2, 10), 'shelf');
  assert.equal(
    first.start(200, () => 1, damage.snapshot()),
    false,
  );
  first.advance(99999);
  assert.equal(first.snapshot().selection, original);
  assert.equal(original?.damage?.topic, 'sofa');
  assert.equal(Object.isFrozen(original?.damage), true);
  damage.reset();
  damage.record(chaosEvent('sofa', 'scratch', 1, 2), 'couch');
  const second = new HomecomingSequence({ memory });

  second.start(2, () => 0, damage.snapshot());
  assert.notEqual(second.snapshot().selection?.dialogue, original?.dialogue);
});

test('Alle Schadensvarianten haben eine englische Übersetzung', () => {
  const lines = Object.values(SARA_DAMAGE_DIALOGUE).flatMap((pool) => Object.values(pool).flat());

  setLanguage('en', false);

  try {
    for (const line of lines) assert.notEqual(translateExact(line), line);
  } finally {
    setLanguage('de', false);
  }
});
