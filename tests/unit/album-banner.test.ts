/* eslint-disable max-lines-per-function -- Zeitgrenzen und einmalige Speicherentscheidung bilden zusammenhängende Verhaltensfälle. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AlbumBannerQueue } from '../../src/game/album/banner-queue.ts';

test('Einzelfund erscheint genau drei Sekunden; erneutes Rendern startet ihn nicht neu', () => {
  const queue = new AlbumBannerQueue();

  queue.start(['vase.blue']);
  assert.equal(queue.current(), 'vase.blue');
  queue.advance(2999);
  queue.start(['vase.blue']);
  assert.equal(queue.current(), 'vase.blue');
  queue.advance(1);
  assert.equal(queue.current(), null);
  queue.start(['vase.blue']);
  assert.equal(queue.current(), null);
});

test('Mehrfachfunde bleiben stabil, getrennt und unabhängig von später veränderten Eingaben', () => {
  const queue = new AlbumBannerQueue();
  const entries = ['couch.cozy', 'plant.catgrass', 'vase.blue'];

  queue.start(entries);
  entries.reverse();
  assert.equal(queue.current(), 'couch.cozy');
  queue.advance(3000);
  assert.equal(queue.current(), 'plant.catgrass');
  queue.advance(0);
  queue.advance(-100);
  queue.advance(NaN);
  assert.equal(queue.current(), 'plant.catgrass');
  queue.advance(3000);
  assert.equal(queue.current(), 'vase.blue');
  queue.advance(3000);
  assert.equal(queue.current(), null);
});

test('Null-Freischaltung bleibt leer; späteres Aktivieren des Speicherns startet keine alte Runde', () => {
  const queue = new AlbumBannerQueue();

  assert.equal(queue.current(), null);
  queue.start([]);
  queue.start(['couch.cozy']);
  queue.advance(6000);
  assert.equal(queue.current(), null);
  assert.equal(new AlbumBannerQueue().current(), null);
});
