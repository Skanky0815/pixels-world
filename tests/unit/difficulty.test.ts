import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DIFFICULTIES,
  DIFFICULTY_PRESETS,
  validateDifficultyPresets,
  difficultyTimer,
  difficultyCharm,
  difficultyRoom,
} from '../../src/content/difficulty.ts';
import { CHARM_PROFILES, CHARM_TIMING } from '../../src/content/reconciliation.ts';
import { LIVING_ROOM } from '../../src/content/rooms/living-room.ts';
import { COZY_REMIX } from '../../src/content/rooms/cozy-remix.ts';
import { OBJECTS } from '../../src/content/objects/catalog.ts';
import { resolveRoom } from '../../src/game/content/resolve-room.ts';
import { ROUND_CONFIG, RoundController } from '../../src/game/domain/round-controller.ts';
import { Reconciliation } from '../../src/game/domain/reconciliation.ts';
import { HomecomingSequence } from '../../src/game/domain/homecoming.ts';
import { roundResult } from '../../src/game/domain/round-result.ts';
import { ROUND_ENDINGS } from '../../src/content/round-endings.ts';
import { DifficultyPreferences, DIFFICULTY_STORAGE_KEY } from '../../src/settings/difficulty.ts';

const levels = [
  [0, 'calm'],
  [25, 'annoyed'],
  [60, 'angry'],
] as const;

// eslint-disable-next-line max-lines-per-function -- Bestehende Normalwerte und beide optionalen Raumvarianten werden direkt gegen ihre Ausgangsdaten geprüft.
test('Normal erhält Balancing; alle Dichten erhalten Ziel, Plattformen und Pflichtobjekte', () => {
  assert.deepEqual(difficultyTimer(ROUND_CONFIG, 'normal'), ROUND_CONFIG);

  for (const [, level] of levels)
    assert.deepEqual(difficultyCharm('normal', level), CHARM_PROFILES[level]);

  for (const room of [LIVING_ROOM, COZY_REMIX]) {
    const original = JSON.stringify(room);

    assert.equal(difficultyRoom(room, 'normal'), room);

    for (const difficulty of DIFFICULTIES) {
      const variant = difficultyRoom(room, difficulty);
      const resolved = resolveRoom(variant, OBJECTS);
      const delta = difficulty === 'easy' ? -2 : difficulty === 'hard' ? 4 : 0;

      assert.equal(resolved.objects.length, room.objects.length + delta);
      assert.equal(variant.goal, room.goal);
      assert.deepEqual(variant.platforms.slice(0, room.platforms.length), room.platforms);
      assert.equal(
        variant.platforms.length,
        room.platforms.length + (difficulty === 'hard' ? 4 : 0),
      );

      for (const id of ['couch', 'curtain', 'plant'])
        assert.ok(variant.objects.some((o) => o.id === id));
      assert.equal(new Set(variant.objects.map((o) => o.id)).size, variant.objects.length);
    }

    assert.equal(JSON.stringify(room), original);
  }
});

// eslint-disable-next-line max-lines-per-function -- Gespeicherte Auswahl, Benachrichtigungen und verweigerter Speicher sind ein gemeinsamer Einstellungsvertrag.
test('Auswahl bleibt gespeichert; ungültige Werte und Speicherfehler fallen sicher zurück', () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  const prefs = new DifficultyPreferences(storage);
  let changes = 0;
  const remove = prefs.subscribe(() => changes++);

  assert.equal(prefs.snapshot(), 'normal');
  prefs.set('hard');
  prefs.set('hard');
  assert.equal(changes, 1);
  assert.equal(new DifficultyPreferences(storage).snapshot(), 'hard');
  remove();
  prefs.set('easy');
  assert.equal(changes, 1);
  values.set(DIFFICULTY_STORAGE_KEY, 'broken');
  assert.equal(new DifficultyPreferences(storage).snapshot(), 'normal');
  const denied = new DifficultyPreferences({
    getItem() {
      throw new Error('blocked');
    },
    setItem() {
      throw new Error('blocked');
    },
  });

  denied.set('easy');
  assert.equal(denied.snapshot(), 'easy');
});

function ready(game: Reconciliation) {
  game.confirm();
  game.advance(CHARM_TIMING.cueMs);
}

function winHeart(game: Reconciliation) {
  game.confirm();

  for (let step = 0; step < game.snapshot().length; step++) {
    game.advance(CHARM_TIMING.cueMs);
    game.input(['left']);
  }
}

// eslint-disable-next-line max-lines-per-function -- Beide terminalen Pfade verwenden ausschließlich reguläre Modelleingaben.
function finish(game: Reconciliation, success: boolean) {
  if (success) {
    for (let heart = 0; heart < game.snapshot().required; heart++) winHeart(game);
    game.advance(CHARM_TIMING.finaleMs);
  } else {
    if (game.snapshot().required > 1) winHeart(game);

    for (let attempt = 0; attempt < 2; attempt++) {
      ready(game);
      game.input(['right']);
    }
  }
}

for (const difficulty of DIFFICULTIES) {
  for (const [score, level] of levels) {
    // eslint-disable-next-line max-lines-per-function -- Die vollständige Kombination prüft Fristgrenze, zweiten Versuch je Herz, Abschluss und unveränderliches Profil.
    test(`${difficulty}/${level}: Fristen und zwei Versuche pro Herz bleiben konsistent`, () => {
      const game = new Reconciliation(() => 0);
      const profile = difficultyCharm(difficulty, level);

      game.start(score, difficulty);
      assert.equal(game.start(0, 'normal'), false);
      assert.equal(game.snapshot().difficulty, difficulty);
      assert.equal(game.snapshot().required, profile.sequences);

      for (let heart = 0; heart < profile.sequences; heart++) {
        ready(game);
        game.advance(game.snapshot().inputMs - 1);
        assert.equal(game.snapshot().stage, 'input');
        game.advance(1);
        assert.equal(game.snapshot().feedback, 'timeout');
        assert.equal(game.snapshot().attemptsLeft, 1);
        assert.equal(game.snapshot().inputMs, Math.min(3000, profile.inputMs + 300));
        winHeart(game);
        assert.equal(game.snapshot().successes, heart + 1);
        assert.equal(game.snapshot().attemptsLeft, 2);
      }

      game.advance(CHARM_TIMING.finaleMs);
      const final = game.snapshot();

      assert.equal(final.stage, 'complete');
      game.advance(99999);
      assert.deepEqual(game.snapshot(), final);
      assert.equal(new Reconciliation().snapshot().stage, 'waiting');
    });

    for (const success of [true, false]) {
      // eslint-disable-next-line max-lines-per-function -- Echte terminale Modelle prüfen Ergebnis, unveränderliche Schwierigkeit und unveränderte Abschlusssprüche gemeinsam.
      test(`${difficulty}/${level}: Ergebnis bei ${success ? 'Erfolg' : 'Scheitern'}`, () => {
        const round = new RoundController({ minDurationMs: 2, maxDurationMs: 2 });
        const home = new HomecomingSequence();
        const charm = new Reconciliation(() => 0);

        round.advance(1, score, true, true);
        home.start(score, () => 0);
        home.advance(2100);
        home.confirm();
        charm.start(score, difficulty);
        finish(charm, success);
        const result = roundResult(round.snapshot(), home.snapshot(), charm.snapshot());

        assert.ok(result);
        assert.equal(result.difficulty, difficulty);
        assert.equal(result.required, difficultyCharm(difficulty, level).sequences);
        assert.equal(result.hearts, success ? result.required : Math.min(1, result.required - 1));
        assert.equal(result.closingLine, ROUND_ENDINGS[level][success ? 'success' : 'failed']);
        assert.equal(result.goalReached, true);
        assert.equal(result.score, score);
        assert.equal(Object.isFrozen(result), true);
        charm.start(0, 'normal');
        assert.deepEqual(roundResult(round.snapshot(), home.snapshot(), charm.snapshot()), result);
        round.reset();
        assert.equal(roundResult(round.snapshot(), home.snapshot(), charm.snapshot()), null);
      });
    }
  }
}

test('Timer skalieren beide Grenzen einschließlich schneller Testprofile', () => {
  const config = { minDurationMs: 1000, maxDurationMs: 2000 };

  assert.deepEqual(difficultyTimer(config, 'easy'), { minDurationMs: 1500, maxDurationMs: 3000 });
  assert.deepEqual(difficultyTimer(config, 'hard'), { minDurationMs: 750, maxDurationMs: 1500 });
});

// eslint-disable-next-line max-lines-per-function -- Typkorrekte, aber unspielbare JSON-Werte werden mit einem verständlichen Konfigurationspfad zurückgewiesen.
test('JSON-Presets weisen ungültige Zeit-, Herz- und Sequenzwerte zurück', () => {
  for (const patch of [
    { timeScale: 0 },
    { timeScale: NaN },
    { inputScale: -1 },
    { inputScale: 0.00001 },
    { lengthDelta: -4 },
    { lengthDelta: 0.5 },
    { hearts: { calm: 0, annoyed: 2, angry: 3 } },
    { hearts: { calm: 1, annoyed: 1.5, angry: 3 } },
  ]) {
    const presets = structuredClone(DIFFICULTY_PRESETS);

    Object.assign(presets.easy, patch);
    assert.throws(() => validateDifficultyPresets(presets), /difficulty.json: easy/);
  }

  const custom = structuredClone(DIFFICULTY_PRESETS);

  custom.easy.timeScale = 2;
  custom.easy.hearts.angry = 1;
  assert.doesNotThrow(() => validateDifficultyPresets(custom));
});

// eslint-disable-next-line max-lines-per-function -- Zusätzliche Regale halten je eine Vase und mischen vorhandene Farben, ohne die bisherigen Plattformen zu ersetzen.
test('Schwer verteilt verschiedenfarbige Vasen einzeln auf zusätzliche Regale', () => {
  for (const room of [LIVING_ROOM, COZY_REMIX]) {
    const definition = difficultyRoom(room, 'hard');
    const resolved = resolveRoom(definition, OBJECTS);
    const extras = resolved.objects.filter((o) => o.id.startsWith('difficulty-vase-'));

    assert.equal(extras.length, 4);
    assert.equal(new Set(extras.map((o) => o.kind === 'vase' && o.config.color)).size, 3);

    for (const platform of definition.platforms.slice(room.platforms.length)) {
      const occupants = definition.objects.filter(
        (o) => o.placement.mode === 'surface' && o.placement.surfaceId === platform.id,
      );

      assert.equal(occupants.length, 1);
      assert.ok(platform.bounds.width >= 100);
    }
  }
});
