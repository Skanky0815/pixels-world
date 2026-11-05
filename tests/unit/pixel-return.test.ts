import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PixelReturnController, type ReturnContact } from '../../src/game/domain/pixel-return.ts';
import { homecomingPositions } from '../../src/game/content/homecoming-layout.ts';

const config = { width: 960, floorY: 468, targetX: 782 };
const platforms = [
  { left: 0, right: 960, top: 468 },
  { left: 518, right: 664, top: 304 },
  { left: 856, right: 936, top: 154 },
];

// eslint-disable-next-line max-lines-per-function -- Der flache Kontakt entspricht einem losgelösten Physiksnapshot ohne Engine-Mutatoren.
function contact(centerX: number, bottom = 468, grounded = true): ReturnContact {
  return {
    centerX,
    bottom,
    grounded,
    left: centerX - 26,
    right: centerX + 26,
    width: 52,
    height: 52,
    blocked: { left: false, right: false },
  };
}

test('Pixel wartet auf Heimkehr und beginnt die automatische Route nur einmal', () => {
  const returning = new PixelReturnController(config, platforms);

  assert.equal(returning.input(contact(100)).active, false);
  assert.equal(returning.start(), true);
  assert.equal(returning.start(), false);
  assert.equal(returning.snapshot().stage, 'walking');
});

// eslint-disable-next-line max-lines-per-function -- Beide Richtungen, weiches Abbremsen und unveränderliche Eingaben bilden denselben Bewegungsvertrag.
test('Automatische Eingabe läuft zum Ziel, bremst ab und erzeugt keine Bestätigungen', () => {
  const returning = new PixelReturnController(config, platforms);

  returning.start();
  assert.equal(returning.input(contact(100)).horizontal, 0.6);
  assert.equal(returning.input(contact(900)).horizontal, -0.6);
  const near = returning.input(contact(776));

  assert.ok(near.horizontal > 0 && near.horizontal < 0.6);
  assert.equal(near.confirmPressed, false);
  assert.equal(near.resetPressed, false);
  assert.equal(Object.isFrozen(near), true);
});

// eslint-disable-next-line max-lines-per-function -- Sitzposition ist erst am Boden gültig und wird nach Ankunft nicht erneut geöffnet.
test('Pixel sitzt nur neben Sara auf dem Boden; keine Ankunft in der Luft oder auf Regalen', () => {
  const returning = new PixelReturnController(config, platforms);

  returning.start();
  returning.input(contact(782, 300, false));
  assert.equal(returning.snapshot().stage, 'walking');
  returning.input(contact(782, 154, true));
  assert.equal(returning.snapshot().stage, 'walking');
  assert.equal(returning.input(contact(780)).active, false);
  assert.equal(returning.snapshot().stage, 'seated');
  assert.equal(returning.input(contact(200)).horizontal, 0);
  assert.equal(returning.start(), false);
});

test('Eine erhöhte Plattform wird zum erreichbaren Rand verlassen', () => {
  const returning = new PixelReturnController(config, platforms);

  returning.start();
  assert.ok(returning.input(contact(550, 304)).horizontal > 0);
  assert.equal(returning.snapshot().waypointX, 694);
});

test('Am rechten Raumrand bleibt nur der linke Austritt; er wird nicht zu früh aufgegeben', () => {
  const returning = new PixelReturnController(config, platforms);

  returning.start();
  assert.ok(returning.input(contact(900, 154)).horizontal < 0);
  assert.equal(returning.snapshot().waypointX, 826);
  returning.input(contact(820, 206, false));
  assert.equal(returning.snapshot().waypointX, 826);
  returning.input(contact(820, 210, false));
  assert.equal(returning.snapshot().waypointX, null);
});

// eslint-disable-next-line max-lines-per-function -- Hindernisreaktion und frischer Routenstatus werden ohne schreibbare Spielschnittstelle geprüft.
test('Bodenkontakt erlaubt Hindernissprung; neue Runde verwirft Route und Sitzstatus', () => {
  const returning = new PixelReturnController(config, platforms);

  returning.start();
  assert.equal(
    returning.input({ ...contact(100), blocked: { left: false, right: true } }).jumpPressed,
    true,
  );
  assert.equal(
    returning.input({ ...contact(100, 400, false), blocked: { left: false, right: true } })
      .jumpPressed,
    false,
  );
  const fresh = new PixelReturnController(config, platforms);

  assert.equal(fresh.snapshot().stage, 'waiting');
  assert.equal(fresh.snapshot().waypointX, null);
  assert.equal(Object.isFrozen(fresh.snapshot()), true);
  assert.equal(homecomingPositions(960).pixelSeatX, config.targetX);
  assert.equal(homecomingPositions(1100).saraEndX - homecomingPositions(1100).pixelSeatX, 64);
});
