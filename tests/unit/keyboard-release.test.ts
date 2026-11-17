/* eslint-disable max-lines-per-function -- Zustandsfolgen prüfen gehaltene Tasten, Loslassen und frische Eingaben gemeinsam. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { KeyboardRelease } from '../../game/play/input/keyboard-release.ts';

test('Menü-/Fokuswechsel sperrt gehaltene Quellen bis zu deren eigenem Loslassen', () => {
  const keys = new KeyboardRelease();

  keys.down('ArrowRight', false);
  keys.down('Space', false);
  keys.release();
  keys.down('ArrowRight', true);
  assert.equal(keys.allows('ArrowRight'), false);
  keys.up('Space');
  assert.equal(keys.allows('Space'), true);
  assert.equal(keys.allows('ArrowRight'), false);
  keys.up('ArrowRight');
  keys.down('ArrowRight', false);
  assert.equal(keys.allows('ArrowRight'), true);
});

test('Nach Blur oder neuem Adapter wird eine unbekannte Wiederholung keine frische Taste', () => {
  const keys = new KeyboardRelease();

  keys.down('Space', false);
  keys.blur();
  keys.down('Space', true);
  assert.equal(keys.allows('Space'), false);
  keys.up('Space');
  keys.down('Space', false);
  assert.equal(keys.allows('Space'), true);
  const restarted = new KeyboardRelease();

  restarted.down('KeyR', true);
  assert.equal(restarted.allows('KeyR'), false);
  assert.equal(restarted.allows('ArrowLeft'), true);
});
