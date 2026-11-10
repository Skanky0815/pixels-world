import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  SARA_DIALOGUE,
  SARA_ROOM_DIALOGUE,
  type SaraDialogueCatalogue,
} from '../../src/content/sara-reactions.ts';
import { DialogueMemory, selectSaraDialogue } from '../../src/game/domain/sara-dialogue.ts';
import { HomecomingSequence, selectReaction } from '../../src/game/domain/homecoming.ts';
import { setLanguage, translateExact } from '../../src/i18n/locale.ts';

// eslint-disable-next-line max-lines-per-function -- Alle Räume und Ärgerstufen sichern dieselbe vollständige, exklusive Auswahl ab.
test('Jeder Raum ergänzt sechs allgemeine Zeilen um drei eigene Varianten je Stufe', () => {
  for (const roomId of ['living-room', 'cozy-remix'] as const) {
    for (const anger of ['calm', 'annoyed', 'angry'] as const) {
      const pool = [...SARA_DIALOGUE[anger], ...SARA_ROOM_DIALOGUE[roomId][anger]];

      assert.equal(new Set(pool).size, 9);

      for (const [index, line] of pool.entries())
        assert.equal(selectSaraDialogue(anger, index / pool.length, { roomId }), line);
      assert.equal(selectSaraDialogue(anger, 1, { roomId }), pool.at(-1));
    }
  }
});

test('Unbekannte Räume einschließlich Prototype-Namen erhalten nur allgemeine Varianten', () => {
  for (const roomId of [undefined, 'new-room', 'toString', '__proto__'])
    for (const anger of ['calm', 'annoyed', 'angry'] as const)
      for (const sample of [0, 0.5, 1])
        assert.ok(
          (SARA_DIALOGUE[anger] as readonly string[]).includes(
            selectSaraDialogue(anger, sample, { roomId }),
          ),
        );
});

// eslint-disable-next-line max-lines-per-function -- Fehlende Daten, Leerzeilen, Duplikate und Einzeiler nutzen denselben definierten Fallbackvertrag.
test('Fehlende Stufen, Leerzeilen und Duplikate führen weiterhin zu gültigem Dialog', () => {
  const empty: SaraDialogueCatalogue = { generic: {}, rooms: { room: { calm: [] } } };
  const sparse: SaraDialogueCatalogue = { generic: { calm: [' ', 'Hallo', 'Hallo'] }, rooms: {} };

  for (const anger of ['calm', 'annoyed', 'angry'] as const)
    assert.equal(
      selectSaraDialogue(anger, 0.8, { roomId: 'room' }, empty),
      SARA_DIALOGUE[anger][0],
    );
  assert.equal(selectSaraDialogue('calm', 1, { previousDialogue: 'Hallo' }, sparse), 'Hallo');
  assert.equal(selectSaraDialogue('angry', 0, {}, sparse), SARA_DIALOGUE.angry[0]);
});

test('Alle erreichbaren vorherigen Zeilen werden ohne erneute Zufallsziehung ausgeschlossen', () => {
  for (const anger of ['calm', 'annoyed', 'angry'] as const)
    for (const line of [...SARA_DIALOGUE[anger], ...SARA_ROOM_DIALOGUE['living-room'][anger]])
      for (const sample of [0, 0.5, 1])
        assert.notEqual(
          selectSaraDialogue(anger, sample, { roomId: 'living-room', previousDialogue: line }),
          line,
        );
});

test('Dialogerinnerung ist auf Raum und Ärgerstufe begrenzt und kann für DEV zurückgesetzt werden', () => {
  const memory = new DialogueMemory();

  memory.remember('living-room', 'calm', 'Hallo');
  assert.equal(memory.previous('living-room', 'calm'), 'Hallo');
  assert.equal(memory.previous('cozy-remix', 'calm'), undefined);
  assert.equal(memory.previous('living-room', 'angry'), undefined);
  memory.clear();
  assert.equal(memory.previous('living-room', 'calm'), undefined);
});

// eslint-disable-next-line max-lines-per-function -- Wiederholte Runden teilen nur die Erinnerung; jede neue Heimkehr bleibt einmalig und zieht exakt einmal.
test('Neue Heimkehr vermeidet die letzte Auswahl auch bei identischem Sample', () => {
  const memory = new DialogueMemory();
  const context = { roomId: 'cozy-remix', memory };
  let draws = 0;
  const random = () => {
    draws++;

    return 1;
  };

  const first = new HomecomingSequence(context);
  const second = new HomecomingSequence(context);

  first.start(25, random);
  assert.equal(first.start(25, random), false);
  const selected = first.snapshot().selection;

  second.start(25, random);
  assert.equal(draws, 2);
  assert.notEqual(second.snapshot().selection?.dialogue, selected?.dialogue);
  assert.equal(selected?.anger, 'annoyed');
  assert.equal(memory.previous('cozy-remix', 'annoyed'), second.snapshot().selection?.dialogue);
});

// eslint-disable-next-line max-lines-per-function -- Sprachwechsel übersetzt alle Raumvarianten, verändert aber weder die kanonische Auswahl noch ihre Erinnerung.
test('DE/EN enthalten alle Raumzeilen; Sprache ändert die Auswahl nicht', () => {
  const memory = new DialogueMemory();
  const context = { roomId: 'cozy-remix', memory };
  const selected = selectReaction(60, () => 1, context);

  memory.remember('cozy-remix', 'angry', selected.dialogue);
  setLanguage('en', false);

  try {
    const lines = Object.values(SARA_ROOM_DIALOGUE).flatMap((room) => Object.values(room).flat());

    for (const line of lines) assert.notEqual(translateExact(line), line);
    assert.equal(memory.previous('cozy-remix', 'angry'), selected.dialogue);
    assert.notEqual(selectReaction(60, () => 1, context).dialogue, selected.dialogue);
  } finally {
    setLanguage('de', false);
  }
});
