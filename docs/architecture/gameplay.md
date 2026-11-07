# Gameplay-Architektur

## Zuständigkeiten

| Bereich                          | Verantwortung                                                                      |
| -------------------------------- | ---------------------------------------------------------------------------------- |
| `src/main.ts`                    | Bootstrap, Raumwahl und Phaser-Konfiguration                                       |
| `game/scenes/LivingRoomScene.ts` | Aufbau, Kollisionspaare, Frame-Reihenfolge und Lebenszyklus                        |
| `game/input/`                    | Tastatur/Pointer, eingefrorener Input-Snapshot und Browseraktivität                |
| `game/actors/`                   | Bewegung, Körper, sichtbare Figuren und Animationsauswahl                          |
| `game/objects/`                  | Konkrete Möbel/Objekte mit Geometrie und eigenen Modellen                          |
| `game/interactions/`             | Reine Handlungsmodelle und kleine Fähigkeitsverträge                               |
| `game/domain/`                   | Runde, Hauptziel, Heimkehr, Versöhnung, Ergebnis und Score                         |
| `game/ui/`                       | Darstellung aus lesbaren Daten, keine Punkte-/Timerentscheidungen                  |
| `game/content/`                  | Datenvertrag, Resolver, Validierung, Objektfabrik und gemeinsame Szenenverdrahtung |
| `src/content/`                   | Typisierte Raum-, Objekt- und Dialoginhalte                                        |
| `src/i18n/`                      | Sprachkataloge, Formatierung und Spracheinstellung                                 |
| `src/dev/`                       | Ausschließlich lokale Arbeitswerkzeuge                                             |

Es bleibt ein frontend-only npm-/Vite-Projekt. Die Figurenanimation steuert weder
Kollisionen noch Schadensregeln. Sichtbares Sprite und fester Physikkörper sind
getrennt und über den Pfoten-/Sohlenanker ausgerichtet.

## Eingabe, Zeit und Lifecycle

`InputController` liefert pro Game-Frame genau einen unveränderlichen `InputState`.
Alle Verbraucher sehen dieselben Flanken. Tastatur und Touch vereinigen gehaltene
Aktionen; Gegenrichtungen neutralisieren sich, ein Fingerwechsel löst keine andere
gehaltene Quelle. Native Wiederholung erzeugt keine neue Aktion. Pointer-Capture,
Verlassen/Cancel, Fokus, Sichtbarkeit und Resize räumen Eingaben auf. Spielobjekte
lesen keine DOM-/Hardwareereignisse.

`PlayActivity` liefert bereinigte aktive Zeit. Start/Resume holen keine
Hintergrundzeit nach. Die Szene aktualisiert die vom automatischen Update
entkoppelte Arcade-Welt mit demselben Delta wie die Domain; Phasers `postUpdate`
bleibt erhalten. Es entsteht keine zweite Loop.

Frame-Vertrag: Input/Reset → Aktivitätsprüfung → Physik/Kollisionen → Bewegung,
Interaktionen und Score → Ziel/Rundenuhr → gegebenenfalls finaler Freeze → Ansichten.
Aktionen des letzten zulässigen Frames zählen noch. Gewinnt die Deadline gegen
einen gleichzeitigen Zielkontakt, entscheidet `RoundController` den Gleichstand.

`create()` initialisiert jeden Durchlauf ausdrücklich. Neustart verwendet dieselbe
Szene, aber neue Modelle/Objekte und ein geleertes Ledger. `shutdown/destroy`
entsorgt Adapter, Eingaben, Listener, Ansichten und Ressourcen. Asynchrone
E2E-Observer-Installation prüft die Szenengeneration; alte Fortsetzungen dürfen
keinen neuen Durchlauf verändern. Der Observer liefert ausschließlich eingefrorene
Kopien, niemals Engine-Objekte oder Mutatoren, und fehlt im Produktionsbuild.

Die DEV-Objektszene verwendet dieselben Adapter, Eingaben und Animationsdaten.
`game/content/object-playfield.ts` teilt Raumkörper, Collider und die geordnete
Objektinteraktion mit `LivingRoomScene`; Rundenuhr, Ziel und Heimkehr bleiben
außerhalb dieses gemeinsamen Schritts. Der Playground besitzt seinen eigenen
Score und entsorgt seine Ressourcen beim Szenenwechsel.

## Objekte und Schadensvertrag

Fähigkeiten werden kombiniert, nicht durch eine universelle Phaser-Basisklasse
erzwungen: `Interactable` für automatische Bodenaktionen, `Climbable` für
Kletterflächen, `Destructible` für Schaden und Score-Potenzial, `ObjectLifecycle`
für Reset/Destroy. Nur tatsächlich benötigte Verträge anlegen; ein friedliches
Ziel ist kein Schadensobjekt. Begründung: [ADR 0001](../adr/0001-interaction-composition.md).

Bei überlappenden Bodenaktionen gewinnt das erste geeignete Objekt der stabilen
Szenenreihenfolge; andere erhalten ein inaktives Update. Bewegung, Absprung und
Zielwechsel unterbrechen Wartephasen. Objekte erhalten losgelöste Körper-/Input-
Daten und melden Aktion/Blickziel, statt Pixel oder Tastatur zu besitzen.
Vorhangschaden folgt tatsächlicher Bewegung, nicht bloßer Renderzeit.

Jeder `ChaosEvent` enthält eine instanzbezogene ID aus Objekt, Schadensart und
Stufe sowie einen sicheren ganzzahligen Wert. Alle Schäden einschließlich
Vasenbruch laufen über denselben `ChaosScore.awardEvent`-Pfad. Erst eine neue
Wertung emittiert `object-damaged`; die Domain vergibt selbst keine Punkte.
`DamageHistory` dient Objekt-Snapshots und ist kein zweiter Score-Verbraucher.

## Runde und Ansichten

- `MainGoal`: Kontaktfortschritt ohne eigene Uhr/Punkte. Bewegung oder falsche
  Auflage bricht Fortschritt ab. Zielerreichung und Deadline verwenden denselben
  einmaligen Rundenabschluss; `endReason` bleibt danach fest.
- `RoundController`: aktive Laufzeit, grobe Hinweise, Phasen und finaler Score.
  `chaos → returning → reaction → reconciliation` ist geordnet; wiederholte oder
  verfrühte Übergänge werden zurückgewiesen.
- `HomecomingSequence`: einmalige Reaktions-/Dialogauswahl aus finalem Score,
  semantische Animationskeys und explizite Bestätigung ohne Lesefrist.
- `PixelReturnController`: reine Bewegungseingaben über Möbelkanten zum Sitzanker;
  keine direkten Körpermutationen. Nur Pixel bewegt sich weiter, übrige Schäden
  und Weltkörper bleiben gesperrt. Bestätigung erst nach dem Hinsetzen.
- `Reconciliation`: Lesepause, Vorbereitung, frische Pfeile, Feedback und terminaler
  Erfolg/Misserfolg. Nur der nächste Pfeil wird beobachtbar; mehrere gleichzeitig
  sind mehrdeutig. Versuchsbudget und Hilfe gelten pro zu verdienendem Herz.
- `roundResult`: unveränderliche Ableitung aus den terminalen Snapshots. Finaler
  Score, ursprüngliche Reaktion, Ziel und Versöhnung bleiben getrennte Aussagen.

Alle Modelle bleiben Phaser-/DOM-unabhängig. Zufallsquellen sind injizierbar;
Auswahl und Snapshots sind eingefroren. Ansichten besitzen weder eigene Spieluhren
noch verzögerte Übergänge, die nach einem Neustart weiterlaufen könnten.
Die Startfreigabe ist getrennt vom Rundenmodell; „Neue Runde“ erhält sie, Reload
zeigt wieder die Einführung. R ist eine versteckte Debug-Eingabe.

## Content, Assets und mobile Darstellung

[Content pflegen](../../src/content/README.md) beschreibt Vorlagen, Instanz-IDs,
Auflagen und Grenzen. Resolver validieren vor Engine-Start und beim Vite-Build,
verändern keine Quelldaten und erzeugen keine Engine-Objekte. Neue Mechaniken
bleiben Code; neue Platzierungen/Werte sind Content. Ein künftiger Import oder
Generator muss denselben validierten Vertrag verwenden, keine zweite Regelsprache.

Canvas und Raum behalten ihr Seitenverhältnis. `#play-area` ordnet mobile
Steuerungsgruppen außerhalb des Zimmers an. `MobileReadout` rendert vorhandene
Text-/Fortschrittsdaten in CSS-Pixeln; kompakt sind entsprechende Canvas-Textpanels
verborgen, nicht die Figuren. Rotation erhält die Szene und löst Eingaben.
Szeneneigene DOM- und MediaQuery-Ressourcen werden beim Shutdown entsorgt.
Touch-Geräte starten mit Canvas 2D, Desktop mit AUTO:
[ADR 0002](../adr/0002-mobile-text-rendering.md).

Sprite-Quellen, Palette, Raster und Exporte liegen bei
[Pixel](../../assets/pixel/README.md) und [Sara](../../assets/sara/README.md).
Nur gepackte Runtime-Assets werden geladen. Dev-Vergleich und E2E-Instrumentierung
bleiben durch Build-Einstieg, Modusprüfung und negative Produktions-URL-Tests isoliert.

## Lokalisierung und Speicherung

Die typisierten DE-/EN-Kataloge besitzen dieselben Platzhalter. `t` formatiert die
Ansicht; `copy` liefert kanonische deutsche Inhalte für bestehende Domain-Verträge.
`translateExact` übersetzt ausgewählte skalare Inhaltswerte erst an der UI-Grenze;
Spielentscheidungen hängen nicht von übersetzten Formulierungen ab. Fehlendes
Englisch fällt auf Deutsch zurück und wird in Entwicklung gemeldet.

Sprachwechsel benachrichtigen Ansichten und rendern bestehende Snapshots erneut,
ohne Timer, Physik oder Runde neu zu starten. Nur `pixels-world.language` wird
lokal gespeichert; kein Spielstand. Speicherfehler verhindern die Sitzung nicht.
Die Rechtsseiten sind statische deutsche HTML-Seiten ohne Spielcode. Eigennamen,
Markenslogans, Tastensymbole und technische Meldungen brauchen keine zweite Fassung.
Datenflüsse und Quellen: [rechtliche Dokumentation](../legal/phase2-review.md).
