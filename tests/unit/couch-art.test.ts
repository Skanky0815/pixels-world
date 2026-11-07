import {
  couchScratchPosition,
  couchScratchScale,
  type ScratchMark,
} from '../../src/game/objects/couch-scratch-position.ts';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { OBJECTS } from '../../src/content/objects/catalog.ts';
import { LIVING_ROOM } from '../../src/content/rooms/living-room.ts';
import { COZY_REMIX } from '../../src/content/rooms/cozy-remix.ts';
import { resolveRoom } from '../../src/game/content/resolve-room.ts';

function art(name: string) {
  return PNG.sync.read(
    readFileSync(new URL(`../../assets/objects/couch/couch-${name}.png`, import.meta.url)),
  );
}

// eslint-disable-next-line max-lines-per-function -- Tatsächliche PNGs sichern Zellgrößen, freie Bodenfläche und unterschiedliche Stofffarben ohne identische Varianten.
test('Sofa-Exporte haben gemeinsame Maße und echte Transparenz', () => {
  for (const name of ['cozy', 'worn']) {
    const image = art(name);

    assert.deepEqual([image.width, image.height], [136, 80]);
    assert.equal(image.data[(79 * 136 + 68) * 4 + 3], 0);
    assert.ok(image.data.some((value, index) => index % 4 === 3 && value > 0));
  }

  assert.notDeepEqual(art('cozy').data, art('worn').data);
  const patch = art('scratch');

  assert.deepEqual([patch.width, patch.height], [14, 16]);
  const alpha = [...patch.data].filter((_, index) => index % 4 === 3);

  assert.ok(alpha.includes(0) && alpha.some((value) => value > 0));
});

// eslint-disable-next-line max-lines-per-function -- Resolver-Vertrag prüft unbekannte Grafik, optionale Auswahl und zwei voneinander getrennte Sofa-Konfigurationen.
test('Sofa-Grafik verändert Sitzfläche und Regeln nicht', () => {
  assert.throws(
    () =>
      resolveRoom(LIVING_ROOM, {
        ...OBJECTS,
        'cozy-couch': { ...OBJECTS['cozy-couch'], appearance: 'missing' },
      } as unknown as typeof OBJECTS),
    /appearance/,
  );
  const catalog = { ...OBJECTS, 'cozy-couch': { ...OBJECTS['cozy-couch'], appearance: undefined } };
  const legacy = resolveRoom(LIVING_ROOM, catalog).objects.find((o) => o.kind === 'couch');

  assert.ok(legacy?.kind === 'couch');
  assert.equal(legacy.config.appearance, undefined);
  assert.deepEqual(legacy.config.seat, { x: 180, y: 370, width: 254, height: 28 });
  const couches = resolveRoom(COZY_REMIX, OBJECTS).objects.filter((o) => o.kind === 'couch');

  assert.equal(couches.length, 2);
  assert.notEqual(couches[0].config.id, couches[1].config.id);

  for (const couch of couches) {
    assert.equal(couch.config.appearance, 'worn');
    assert.equal(couch.config.rules.damageValue, 1);
    assert.equal(couch.config.floorY - couch.config.seat.y, 98);
  }
});

// eslint-disable-next-line max-lines-per-function -- Die deklarative Matrix prüft Rand- und Sitzkontakte mit sechs getrennten Patches auch auf kleinster Sitzfläche.
test('Kratzspuren finden den nächsten freien Platz statt zu stapeln', () => {
  for (const width of [100, 254]) {
    const seat = { x: 20, y: 100, width, height: 28 };
    const scale = couchScratchScale(width);
    const contacts = [100, 198].flatMap((bottom) =>
      [0, 20 + width / 2, 40 + width].map((x) => ({ bottom, x })),
    );

    for (const { bottom, x } of contacts) {
      const marks: ScratchMark[] = [];

      for (let stage = 0; stage < 6; stage++) {
        const mark = couchScratchPosition(seat, x, bottom, marks);

        assert.ok(mark);
        assert.ok(mark.x - 7 * scale >= seat.x && mark.x + 7 * scale <= seat.x + width);
        assert.ok(marks.every((previous) => Math.abs(previous.x - mark.x) >= 16 * scale));
        assert.equal(mark.y, bottom === 100 ? 61 : 138);
        marks.push(mark);
      }
    }
  }
});
