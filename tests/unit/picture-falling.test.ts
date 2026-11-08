import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PictureFalling, PICTURE_RULES } from '../../src/game/interactions/picture-falling.ts';
import { ChaosScore } from '../../src/game/domain/chaos.ts';
import { chaosEvent } from '../../src/game/domain/chaos-event.ts';
import { PICTURE_ALBUM, pictureDiscovery } from '../../src/content/album/pictures.ts';

const ground = { grounded: true, climbing: false, velocityY: 0, touching: true };
const jump = { grounded: false, climbing: false, velocityY: -200, touching: true };
const model = () => new PictureFalling('frame:1');

// eslint-disable-next-line max-lines-per-function -- Zwei getrennte Flüge, Animationsende und Punktevergabe bilden den vollständigen Zustandsvertrag.
test('Ein Sprung hängt das Bild schief, erst ein zweiter Flug löst den einmaligen Fall aus', () => {
  const picture = model();
  const score = new ChaosScore();

  assert.equal(picture.update(16, jump), undefined);
  assert.equal(picture.snapshot().state, 'crooked');
  picture.update(600, { ...jump, touching: false });
  assert.equal(picture.snapshot().wobble, 0);
  picture.update(100, { ...jump, velocityY: 100 });
  assert.equal(picture.snapshot().state, 'crooked');
  picture.update(16, ground);
  assert.equal(picture.update(16, jump), undefined);
  assert.equal(picture.snapshot().state, 'falling');
  assert.equal(picture.update(PICTURE_RULES.fallMs - 1, jump), undefined);
  const event = picture.update(1, jump);

  assert.ok(event);
  assert.equal(event.kind, 'picture-fall');
  assert.equal(event.value, PICTURE_RULES.points);
  assert.equal(picture.snapshot().state, 'fallen');
  assert.equal(score.awardEvent(event), true);
  assert.equal(score.awardEvent(event), false);

  for (let i = 0; i < 10; i++) assert.equal(picture.update(1000, jump), undefined);
  assert.equal(score.score, PICTURE_RULES.points);
});

test('Laufen, Stehen, vom Regal fallen und Klettern zählen keine Bildtreffer', () => {
  const picture = model();

  for (const contact of [ground, { ...jump, velocityY: 100 }, { ...jump, climbing: true }]) {
    picture.update(1000, contact);
    assert.equal(picture.snapshot().state, 'straight');
  }

  picture.update(16, { ...jump, touching: false });
  picture.update(16, { ...jump, velocityY: 100 });
  assert.equal(picture.snapshot().state, 'crooked');
});

// eslint-disable-next-line max-lines-per-function -- Auch eine Rückkehr an dieselbe Kontaktstelle innerhalb eines Flugs bleibt derselbe Treffer.
test('Anhaltender Kontakt und Kontaktflattern können nicht beide Stufen auslösen', () => {
  const picture = model();

  for (let i = 0; i < 50; i++) picture.update(32, { ...jump, touching: i % 2 === 0 });
  assert.equal(picture.snapshot().state, 'crooked');
  assert.equal(picture.snapshot().wobble, 0);
  picture.update(16, ground);
  picture.update(16, jump);
  picture.update(1000, jump);
  picture.reset();
  assert.deepEqual(picture.snapshot(), { state: 'straight', progress: 0, wobble: 0 });
  assert.equal(picture.update(16, jump), undefined);
  assert.equal(picture.snapshot().state, 'crooked');
});

test('Ungültige Bildregeln werden vor dem Spielstart abgewiesen', () => {
  for (const rules of [
    { ...PICTURE_RULES, points: -1 },
    { ...PICTURE_RULES, fallMs: 0 },
    { ...PICTURE_RULES, wobbleMs: NaN },
  ])
    assert.throws(() => new PictureFalling('picture', rules));
  assert.throws(() => new PictureFalling(''));
});

// eslint-disable-next-line max-lines-per-function -- Der Albumvertrag liefert stabile Varianten-IDs erst bei echtem Aufprallschaden; Persistenz bleibt bei #210.
test('Albumvorbereitung erkennt nur tatsächlichen Bildschaden und bleibt über Slots und Neustarts stabil', () => {
  for (const variant of Object.keys(PICTURE_ALBUM)) {
    const first = pictureDiscovery(chaosEvent('wall:one', 'picture-fall', 1, 18), variant);
    const second = pictureDiscovery(chaosEvent('wall:two', 'picture-fall', 1, 18), variant);

    assert.ok(first && second);
    assert.equal(first.entryId, second.entryId);
    assert.ok(Object.isFrozen(first));
    const entry = PICTURE_ALBUM[variant as keyof typeof PICTURE_ALBUM];

    for (const language of ['de', 'en'] as const)
      assert.ok(entry.fluff[language] && entry.sara[language]);
    assert.equal(pictureDiscovery(chaosEvent('wall:one', 'scratch', 1, 2), variant), null);
    assert.equal(pictureDiscovery(chaosEvent('wall:one', 'picture-fall', 2, 18), variant), null);
  }

  assert.equal(pictureDiscovery(chaosEvent('wall:one', 'picture-fall', 1, 18), 'unknown'), null);
});
