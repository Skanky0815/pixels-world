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

`PlayActivity` kombiniert manuelle Menüpause, Fokus und Sichtbarkeit und liefert
bereinigte aktive Zeit. Die manuelle Pause bleibt bei Tab-/Fokuswechsel erhalten. Start/Resume holen keine
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

Der DEV-Debugdialog erhält nur innerhalb der Dev-Build-Grenze einen
szenengebundenen Port. Szenarien initialisieren frische Domain-Modelle mit
validierten Werten und einer lokalen Zufallsquelle; Vorwärtsschritte benutzen
`RoundController`, `HomecomingSequence` und `Reconciliation`. Der normale
Startschritt ist für Einführung und Debug-Szenario derselbe. Die öffentlichen
E2E-Snapshots bleiben lesend; es gibt keine globalen Debugsetter.

`PauseMenu` besitzt seinen Dialog, den Menüknopf und alle Ereignisse pro Szene.
Es verwendet den bestehenden Sprachwähler und `AudioPreferences`; ein Neustart
entsorgt die alte Ansicht und startet mit frischem Aktivitätszustand. Sprache
und Audiopegel bleiben erhalten. `GameAudio` überträgt Gesamt- × Effektpegel auf
die Soundverwaltung. Die Aktivitätsgrenze pausiert/reaktiviert Audio selbst und
ersetzt dafür Phasers unabhängige automatische Blur-Wiederaufnahme. Der Bücherstapel
spielt über denselben Kanal einen kurzen, deterministisch synthetisierten Aufprall.
Ohne WebAudio bleibt dieser Effekt stumm; Spielablauf und Wertung funktionieren weiter.
Der E2E-Vertrag liest nur skalare Audiozustände.

`FeedbackModel` ist ein passiver Darstellungsbeobachter. Bereits vergebene
Schadensereignisse und Phasen-/Versöhnungssnapshots steuern begrenzte Hinweise.
Die Darstellung hat eigene aktive Anzeigezeit und keine Rückwirkung auf
Spielmodelle, Eingabefristen oder Kamera. System-/Menüvorgaben für reduzierte
Bewegung kombinieren sich per Oder; die mobile Statuszeile verwendet dieselben
Hinweise ohne zusätzliche Dialogüberlagerung.

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
verborgen, nicht die Figuren. `any-pointer: coarse` aktiviert dieselbe Oberfläche
auch auf breiten Tablets und Hybrid-Geräten; die Bildschirmbreite allein bestimmt
den Eingabemodus nicht. Maus und Tastatur bleiben parallel nutzbar. Große
Touch-Flächen erhalten über CSS-Variablen größere Tasten mit mehr Abstand.
Rotation erhält die Szene und löst Eingaben. Ein spielweiter `ResizeObserver`
aktualisiert Phasers FIT-Skalierung nach Größenänderungen des CSS-Spielfensters,
auch wenn das Grid erst nach dem Browser-Resize-Ereignis seine Größe erreicht.
Beim Zerstören des Spiels wird der Observer entfernt.
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
ohne Timer, Physik oder Runde neu zu starten. `pixels-world.language` und die
Audiopegel unter `pixels-world.audio` sowie der Bewegungswunsch unter
`pixels-world.reduced-motion` und die Schwierigkeit unter
`pixels-world.difficulty` werden lokal gespeichert; kein Spielstand. Speicherfehler verhindern die Sitzung nicht.
Die Rechtsseiten sind statische deutsche HTML-Seiten ohne Spielcode. Eigennamen,
Markenslogans, Tastensymbole und technische Meldungen brauchen keine zweite Fassung.
Datenflüsse und Quellen: [rechtliche Dokumentation](../legal/phase2-review.md).

## Schwierigkeitsgrade

[`src/content/difficulty.json`](../../src/content/difficulty.json) bündelt die
vorläufigen Playtest-Presets. `difficulty.ts` liest und prüft sie. Normal
verwendet unverändert die bisherigen Timer- und Charmeprofile. Leicht skaliert
die Zeit auf 150 %, Schwer auf 75 %. Die Raumdefinition bietet optionale
`difficultyObjects` mit auslassbaren IDs und zusätzlichen Platzierungen; Räume
ohne diese Angaben behalten ihre Belegung. Ziel und bestehende Plattformen bleiben gleich; Schwer ergänzt separate Regale.

Beim Rundenstart wird die Auswahl aus `DifficultyPreferences` übernommen und
der Raum neu aufgelöst. Die aktive Schwierigkeit bleibt bis zum Neustart fest,
auch wenn im Menü bereits die nächste gewählt wird. Versöhnung kombiniert sie
mit der weiterhin ausschließlich scoreabhängigen Ärgerstufe. Länge, Herzen und
Eingabefrist stammen aus demselben Profil; zwei Versuche pro Herz und die
bestehende Hilfe bleiben erhalten. Das unveränderliche Ergebnis übernimmt den
gespielten Grad und die tatsächlich benötigten/verdienten Herzen aus dem
Versöhnungsmodell. Die Werte sind bewusst zentral für weiteres Playtesting
änderbar; sie sind kein abgeschlossenes Balancing.

### Balancing per JSON

Im Dev-Modus die JSON-Datei speichern und die Spielseite neu laden; danach den
gewünschten Grad wählen und eine neue Runde starten. Veröffentlichte Versionen
übernehmen Änderungen beim nächsten Build/Release. Timer- und Versöhnungswerte bleiben zunächst
identisch zu den bisherigen Presets.

| Feld unter `presets.easy`, `.normal` oder `.hard` | Wirkung                                                                                                                                                        |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `timeScale`                                       | Faktor für beide Heimkehr-Timergrenzen. `1` = bisherige Zeit, `1.5` = 50 % mehr, `0.75` = 25 % weniger.                                                        |
| `hearts.calm`, `.annoyed`, `.angry`               | Benötigte Herzen bei 0–24, 25–59 und mindestens 60 Chaospunkten. Positive ganze Zahlen.                                                                        |
| `lengthDelta`                                     | Zusätzliche Pfeile je Folge gegenüber dem bisherigen Ärgerprofil; `-1` verkürzt um einen Pfeil. Die resultierende Länge muss eine positive ganze Zahl bleiben. |
| `inputScale`                                      | Faktor für die Eingabefrist je Pfeil. `1.3` = 30 % mehr Zeit, `0.8` = 20 % weniger. Die bestehende Wiederholungshilfe bleibt erhalten.                         |

Unter `livingRoom.easyOmit` stehen die Objekt-IDs, die auf Leicht fehlen.
Nur optionale Vasen auslassen; Sofa, Vorhang und Pflanze erhalten.
`livingRoom.hardPlatforms` ergänzt Regale für Schwer (`id`, `x`, `y`,
`width`, `slots`). Die gemeinsame Slotwahl erzeugt pro Zusatzregal genau eine
Vase aus dem konfigurierten Pool. Drei lokale Plätze erlauben Variation, halten
aber die Anflugseite der Regaltreppe frei. Counts, IDs, Filter, Pools und exakte
Geometrie werden wie bei den Hauptregalen validiert. Gleicher Seed und Grad
reproduzieren die Belegung beim Neustart; die Regalgeometrie bleibt fest.
`difficultyObjects.hardAdd` bleibt für bewusst feste Zusatzobjekte verfügbar,
ist in den Wohnzimmern aber leer. Das Hauptziel bleibt ausdrücklich fixiert.
`livingRoom.hardStability` überschreibt die Stabilitätsklasse einzelner Regal-IDs
auf Schwer (`fragile`, `normal`, `stable`). Aktuell wird das mittlere Regal fragil;
die zusätzliche Treppe wechselt fragil/normal/fragil/normal. Fragile Regale stürzen
nach drei, normale nach fünf Landungen ein. Leicht und Normal behalten ihre
Raumkonfiguration. Unbekannte Regal-IDs und ein instabiles Zielregal werden vor
dem Szenenaufbau abgewiesen.
Die vorhandene Content-Prüfung verlangt, dass die ganze Vase auf ihre Unterlage passt. Diese Belegung gilt auch für Cozy Remix;
Ballroute und Erreichbarkeit nach Änderungen in beiden Räumen testen.
Zusätzlich materialisiert `populateSpawnSlots` die optionalen lokalen Plätze eines
Regals einmal vor dem Szenenaufbau. Dichte, Filter, Pool und Seed-Vertrag stehen
in der [Content-Anleitung](../../src/content/README.md#zufällige-belegung-fester-regalplätze).
Die erzeugten Instanzen verwenden dieselben Objektklassen und verlieren beim
Herunterfallen jede Bindung an den ursprünglichen Platz.

Zeitfaktoren müssen positiv und endlich sein. Fehlerhafte Profile werden beim
Laden mit `difficulty.json` und dem betroffenen Feld gemeldet, statt ein
unlösbares Minispiel zu starten. `npm run check:pr` prüft die eingecheckten
Standardwerte und alle Spielabläufe. Nach eigenen Balancing-Änderungen erwartete
Werte in Tests bewusst abgleichen; Normal bleibt die Referenz des bisherigen
Balancings.

## Album und lokale Sammlung

`AlbumCollection` speichert ausschließlich stabile, bekannte Album-IDs unter
`pixels-world.album`, nicht Instanzen, Punkte oder laufende Runden. Version 1 enthält
`discovered`; Version 0 mit `unlocked` wird migriert. Fremde IDs und Duplikate zählen
nicht. Korrupte Daten führen zu einem leeren Album mit Hinweis, blockierter Speicher
zu sitzungsweitem Fortschritt. Neuere Speicherversionen werden bis zu einem bewusst
bestätigten Album-Reset nicht überschrieben. Ein Runden-Reset löscht die Sammlung nicht.

Die Szene übernimmt Entdeckungen erst nach erfolgreichem `ChaosScore.awardEvent`.
Der szenengebundene `AlbumView` zeigt das freigegebene Buchlayout als nativen Dialog.
Einführung und Pause-Menü öffnen dasselbe Album, pausieren dabei das Spiel und lösen
gehaltene Eingaben. Beim Schließen wird der vorherige Menü-/Pausenzustand respektiert.
Tabs wechseln nur das Kapitel; Tastatur und Touch bedienen dieselbe Ansicht, DE/EN
wechseln die Darstellung ohne Änderung der Entdeckungen. Listener und Dialog werden
beim Szenen-Shutdown entfernt. Die Sammlung selbst bleibt über Szenen hinweg erhalten.

## Objektgeräusche

Wohnzimmer-Geräusche werden nach akzeptierten Schadensereignissen ausgelöst;
Regalwarnung und der zusätzliche Bodenaufprall bereits umgestürzter Bücher
melden ihre tatsächlichen Übergänge separat. Spawn, Reset und unveränderte
Updates bleiben still. Die alten gemeinsamen Buch-/Bildtöne entfallen.
`GameAudio` nutzt weiterhin Gesamtlautstärke × Effektlautstärke und deren
lokale Speicherung. Es gibt höchstens drei gleichzeitige Effekte, keine
Warteschlange und keine Musik. Gesperrtes oder suspendiertes Browseraudio
verwirft Ereignisse; Phasers Nutzerinteraktions-Freigabe bleibt zuständig.
Pause, Tabwechsel und Szenenabbau stoppen Effekte, ohne sie später fortzusetzen.
Die kurzen WAV-Varianten werden mit der Szene geladen und offline vorgehalten;
Herkunft, Rechte und reproduzierbare Synthese stehen bei den
[Audio-Assets](../../assets/audio/README.md).

Pixel-Aktionen verwenden denselben Effektkanal: Sprunggeräusche entstehen nur
beim tatsächlich gestarteten Boden- oder Vorhangsprung, der Haarballen-Plopp
beim akzeptierten Abschlussereignis. Für Kratzen, Knabbern/Wackelwarnung, Würgen,
Klettern und Rutschen existiert höchstens ein aktueller Aktionsloop. Die Auswahl
folgt Pixels bestehendem Präsentationszustand; Vorhangreibung benötigt zusätzlich
eine tatsächliche vertikale Positionsänderung. Der Anschlag bleibt dadurch still.
Aktionswechsel, Abbruch, Stummschaltung und Heimkehr entfernen den Loop. Pause,
Tabwechsel und Szenenabbau entfernen auch von Phaser vorausgeplante Loopquellen.
Beim Fortsetzen wird nur die weiterhin laufende aktuelle Aktion neu ausgewählt;
Einzelereignisse werden nicht nachgeholt. Das gemeinsame Limit bleibt bestehen.
