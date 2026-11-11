import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ImpactWorld,
  sweptContact,
  type ImpactBody,
  type ImpactHit,
  type ImpactActor,
} from '../../src/game/domain/impact-world.ts';

// eslint-disable-next-line max-lines-per-function -- Die Fixture stellt nur lesbare Körperdaten und empfangene Stöße ohne Engine-Zustandssetter bereit.
function actor(id: string, x: number, y = 0) {
  const body: ImpactBody = {
    id,
    bounds: { x, y, width: 10, height: 10 },
    mass: 1,
    enabled: true,
    moving: false,
    surface: 'loose',
  };
  const hits: ImpactHit[] = [];
  const item: ImpactActor = {
    id,
    impactBody: () => body,
    receiveImpact: (hit) => {
      hits.push(hit);

      return [];
    },
  };

  return { body, hits, item };
}

function move(a: ReturnType<typeof actor>, x: number, y = 0, vx = 100, vy = 0) {
  Object.assign(a.body, {
    bounds: { ...a.body.bounds, x, y },
    moving: true,
    velocityX: vx,
    velocityY: vy,
  });
}

// eslint-disable-next-line max-lines-per-function -- Alle vorhandenen Typnamen und gleichartige Instanzen müssen denselben Kontaktvertrag durchlaufen, ohne Paar-Whitelist.
test('Jeder Objekttyp kann jeden anderen einschließlich gleicher Typen treffen', () => {
  const types = ['vase', 'books', 'plant', 'picture', 'shelf', 'couch', 'curtain', 'carpet'];

  for (const source of types)
    for (const target of types) {
      const a = actor(`${source}-1`, 0),
        b = actor(`${target}-2`, 25);
      const world = new ImpactWorld();

      world.advance([a.item, b.item], 16);
      move(a, 20);
      world.advance([a.item, b.item], 16);
      assert.equal(b.hits.length, 1);
      assert.equal(b.hits[0].sourceId, a.body.id);
      assert.equal(b.hits[0].direction, 1);
    }
});

// eslint-disable-next-line max-lines-per-function -- Kontaktflattern, erneute Wellen und tatsächliche Bewegung werden unabhängig von der Bildfrequenz geprüft.
test('Ruhe und gleichförmige gemeinsame Bewegung lösen keinen Stoß aus; wiederholter Kontakt zählt einmal', () => {
  const a = actor('a', 0),
    b = actor('b', 8);
  const world = new ImpactWorld();

  world.advance([a.item, b.item], 16);
  assert.equal(b.hits.length, 0);
  move(a, 1);
  move(b, 9);
  world.advance([a.item, b.item], 16);
  assert.equal(b.hits.length, 0);
  Object.assign(b.body, { moving: false, velocityX: 0 });
  move(a, 2);
  world.advance([a.item, b.item], 16);
  assert.equal(b.hits.length, 1);

  for (let i = 0; i < 100; i++) world.advance([a.item, b.item], 16);
  assert.equal(b.hits.length, 1);
});

// eslint-disable-next-line max-lines-per-function -- Eine gerichtete Dreierkette bleibt möglich, ihre Rückkopplung erreicht den Ursprung aber nicht noch einmal.
test('Mehrstufige Ketten reichen den kausalen Ursprung weiter und enden ohne Rückkopplung', () => {
  const a = actor('a', 0),
    b = actor('b', 25),
    c = actor('c', 60);
  const world = new ImpactWorld();

  b.item.receiveImpact = (hit) => {
    b.hits.push(hit);
    Object.assign(b.body, { moving: true, velocityX: 80 });

    return [];
  };

  world.advance([a.item, b.item, c.item], 16);
  move(a, 20);
  world.advance([a.item, b.item, c.item], 16);
  Object.assign(a.body, { moving: false, velocityX: 0 });
  move(b, 55, 0, 80);
  world.advance([a.item, b.item, c.item], 16);
  assert.equal(c.hits.length, 1);
  move(b, 22, 0, -80);
  world.advance([a.item, b.item, c.item], 16);
  assert.equal(a.hits.length, 0);
  assert.equal(b.hits.length, 1);
});

// eslint-disable-next-line max-lines-per-function -- Drei räumlich unterschiedliche Grenzfälle prüfen denselben swept Kontaktvertrag.
test('Schneller Fall wird swept erkannt, diagonale Hüllbox und parallele Auflage zählen nicht', () => {
  const a = actor('a', 0),
    b = actor('b', 0, 50);
  const before = { ...a.body };

  move(a, 0, 100, 0, 500);
  assert.equal(sweptContact(before, a.body, undefined, b.body), true);
  const diagonal = { ...a.body, bounds: { ...a.body.bounds, x: 100 } };

  assert.equal(sweptContact(before, diagonal, undefined, b.body), false);
  const horizontal = actor('h', 0);
  const support = actor('support', 0, 10);

  move(horizontal, 30);
  assert.equal(sweptContact(before, horizontal.body, undefined, support.body), false);
});

// eslint-disable-next-line max-lines-per-function -- Hin- und Gegenstoß werden gemeinsam mit ihrer massenabhängigen Stärke geprüft.
test('Stärke berücksichtigt Masse; feste Ziele geben einen gedämpften Gegenstoß zurück', () => {
  const a = actor('shelf', 0),
    b = actor('vase', 20);
  const world = new ImpactWorld();

  Object.assign(a.body, { mass: 6 });
  Object.assign(b.body, { surface: 'solid' });
  world.advance([a.item, b.item], 16);
  move(a, 15, 0, 200);
  world.advance([a.item, b.item], 16);
  assert.equal(b.hits[0].power, 1200);
  assert.equal(a.hits[0].counter, true);
  assert.equal(a.hits[0].power, 200);
});

// eslint-disable-next-line max-lines-per-function -- Eine während des Stoßes zerbrochene Quelle darf im selben Frame keine weiteren Ziele durchfliegen.
test('Zerbrochene Quellen erzeugen keine Geisterkontakte im restlichen Frame', () => {
  const a = actor('a', 0),
    b = actor('b', 20),
    c = actor('c', 24);
  const world = new ImpactWorld();

  b.item.receiveImpact = (hit) => {
    b.hits.push(hit);
    Object.assign(a.body, { enabled: false });

    return [];
  };

  world.advance([a.item, b.item, c.item], 16);
  move(a, 18);
  world.advance([a.item, b.item, c.item], 16);
  assert.equal(b.hits.length, 1);
  assert.equal(c.hits.length, 0);
});

// eslint-disable-next-line max-lines-per-function -- Nach vollständiger Ruhe darf ein neuer äußerer Stoß auch bei vorherigem Dauerkontakt wieder wirken.
test('Neue Bewegung nach Ruhe aktiviert einen zuvor berührten Nachbarn erneut', () => {
  const a = actor('a', 0),
    b = actor('b', 20);
  const world = new ImpactWorld();

  world.advance([a.item, b.item], 16);
  move(a, 15);
  world.advance([a.item, b.item], 16);
  Object.assign(a.body, { moving: false, velocityX: 0 });
  world.advance([a.item, b.item], 16);
  move(a, 16);
  world.advance([a.item, b.item], 16);
  assert.equal(b.hits.length, 2);
});
