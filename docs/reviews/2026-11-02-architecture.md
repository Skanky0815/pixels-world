# Architekturreview #22 – First Chaos

Stand: **2026-11-02**, geprüft gegen Commit [`892b7d1`](https://github.com/Skanky0815/pixels-world/tree/892b7d1ffea7a6dfb72789cea37cba262d9e5bf6), nach Merge der Pixel-Animationen aus #36. Auftrag: [#22](https://github.com/Skanky0815/pixels-world/issues/22). Geprüft wurden Quellcode, Modelle, Asset-Aufbereitung, Tests, Build-Konfiguration und beide Workflows. Dieses Review ändert Dokumentation und Planung; die nachstehenden Extraktionen sind noch nicht implementiert.

## Ergebnis

Der einzelne Prototypraum ist mit seinen Standardwerten gut abgesichert. In diesem Review wurde **kein Blocker für den vorhandenen lokalen First-Chaos-Spielablauf** gefunden. Die Erweiterungsgrenzen liegen bei Zuständigkeiten, Objektinstanzen und Lebenszyklus. Ricos gewünschte Trennung in Szenen, Pixel, Spielobjekte, Controls und UI ist durch den Code begründet.

Die bestehenden reinen Zustandsmodelle und der feste Physikkörper mit getrenntem sichtbarem Sprite sollten erhalten bleiben. Das [Zielbild](../architecture/gameplay.md) konkretisiert die Grenzen; [ADR 0001](../adr/0001-interaction-composition.md) begründet die vorgeschlagene Komposition kleiner Fähigkeiten.

## Befunde und Priorität

**Blocker** verhindert den gegenwärtigen Standardablauf. **Sollte verbessert werden** ist ein bestätigtes Problem oder eine Grenze vor der konkret geplanten Erweiterung. **Später** hängt an einer noch nicht eingeführten Funktion. Eine Erweiterungsgrenze ist kein bereits beobachteter Fehler im aktuellen Einzelraum.

| ID  | Einstufung                                                      | Befund und tatsächliche Wirkung                                                                                                                                                                                                                                                                                                                                      | Belege                                                                                                                                                                                                                                                                                                                                             | Folge                                                                                                                                                                         |
| --- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Sollte verbessert werden                                        | `LivingRoom` in der 460-zeiligen `main.ts` besitzt Controls, Bewegung, Darstellung, Objektaktionen, HUD und Reset. Änderungen an UI/Belegung und Katzensteuerung treffen dieselbe Klasse. Geometrie steht zusätzlich getrennt in Zeichnung, Kollisionsaufbau und Näheprüfung.                                                                                        | [Szenenaufbau](https://github.com/Skanky0815/pixels-world/blob/892b7d1/src/main.ts#L18), [HUD](https://github.com/Skanky0815/pixels-world/blob/892b7d1/src/main.ts#L209), [Eingabe und Bewegung](https://github.com/Skanky0815/pixels-world/blob/892b7d1/src/main.ts#L403)                                                                         | [#37 – Pixel/Controls/Szene](https://github.com/Skanky0815/pixels-world/issues/37), [#39 – HUD](https://github.com/Skanky0815/pixels-world/issues/39); Objektgeometrie in #38 |
| R2  | Sollte verbessert werden, vor mehreren Instanzen                | Sofa-, Pflanzen- und Vorhangmodelle emittieren feste Objekt-IDs. Die Szene bildet ebenfalls feste Ereignis-IDs. Zwei Sofamodelle erzeugen denselben ersten Kratzer; das Ledger zählt den zweiten nicht. Der heutige Raum besitzt nur ein Sofa.                                                                                                                       | [Sofa-Ereignis](https://github.com/Skanky0815/pixels-world/blob/892b7d1/src/couch-scratching.ts#L17), [Vergabe](https://github.com/Skanky0815/pixels-world/blob/892b7d1/src/main.ts#L301), [Ledger](https://github.com/Skanky0815/pixels-world/blob/892b7d1/src/chaos.ts#L26)                                                                      | [#38 – instanzfähige Interaktionsobjekte](https://github.com/Skanky0815/pixels-world/issues/38)                                                                               |
| R3  | Sollte verbessert werden, vor neuen Ereignisverbrauchern        | Drei ähnliche Damage-Interfaces, drei direkte Score-Aufrufe und danach ein untypisierter Phaser-Eventname; Vasenbruch vergibt Punkte auf einem vierten Pfad ohne dieses Ereignis. Noch gibt es keinen gemeinsamen Domain-Event-Vertrag und keinen zentralen Ereignisverbraucher. Die aktuelle Vergabe funktioniert; neue Verbraucher müssten alle Sonderwege kennen. | [Vasenbruch](https://github.com/Skanky0815/pixels-world/blob/892b7d1/src/main.ts#L216), [Sofa](https://github.com/Skanky0815/pixels-world/blob/892b7d1/src/main.ts#L307), [Pflanze](https://github.com/Skanky0815/pixels-world/blob/892b7d1/src/main.ts#L356), [Vorhang](https://github.com/Skanky0815/pixels-world/blob/892b7d1/src/main.ts#L388) | Ebenfalls #38: ein typisierter `ChaosEvent`-Vertrag und genau ein Score-Pfad                                                                                                  |
| R4  | Sollte verbessert werden                                        | `ScratchConfig.damageValue` akzeptiert endliche Bruchteile/unsichere Ganzzahlen; `ChaosScore` akzeptiert nur sichere Ganzzahlen. Eine akzeptierte Konfiguration kann damit beim ersten Kratzer eine Ausnahme auslösen. Standardwert 3 ist gültig.                                                                                                                    | [Konstruktor](https://github.com/Skanky0815/pixels-world/blob/892b7d1/src/couch-scratching.ts#L32), [Score-Validierung](https://github.com/Skanky0815/pixels-world/blob/892b7d1/src/chaos.ts#L26)                                                                                                                                                  | [#40 – Schadenswert validieren](https://github.com/Skanky0815/pixels-world/issues/40)                                                                                         |
| R5  | Später; vor Scene-Neustart/mehreren Räumen absichern            | R hat einen ausführlichen Reset. Ein erneutes `create()` setzt dagegen die als Szenenfelder angelegten Score-/Interaktionsmodelle und Zähler nicht ausdrücklich zurück. Phaser startet bei `scene.restart()` dieselbe Scene-Instanz. Das ist eine statisch bestätigte Lebenszykluslücke für einen künftigen Restart, kein beobachteter R-Reset-Fehler.               | [Felder/create](https://github.com/Skanky0815/pixels-world/blob/892b7d1/src/main.ts#L30), [R-Reset](https://github.com/Skanky0815/pixels-world/blob/892b7d1/src/main.ts#L227); installierter Phaser-3.90-Code: `ScenePlugin.js:234` und `SceneManager.js:1192`                                                                                     | In #37 beim Extrahieren absichern; vor #6/#10/#29 mit Lifecycle-Integrationstest prüfen                                                                                       |
| R6  | Vor öffentlicher Veröffentlichung erforderlich; bereits geplant | Der aktuelle Build erzeugt `/assets/...`-URLs. Für die Repository-Pages-Adresse unter `/pixels-world/` fehlt die passende Basis. Ein funktionierender lokaler Preview belegt deshalb noch kein funktionierendes Pages-Deployment.                                                                                                                                    | [Vite-Konfiguration](https://github.com/Skanky0815/pixels-world/blob/892b7d1/vite.config.ts), erzeugte `dist/index.html`, Zeilen 8–9                                                                                                                                                                                                               | Bereits [#32 – GitHub Pages](https://github.com/Skanky0815/pixels-world/issues/32), kein Duplikat angelegt                                                                    |

## Reproduzierbare Nachweise

Beide kleinen Reproduktionen liefen im Review mit Node 22.21.1 (`--experimental-strip-types --input-type=module`) und den vorhandenen Modulen; sie verändern das Repository nicht. Die Importpfade im Ausschnitt gelten beim Ausführen vom Repository-Root:

```js
import { CouchScratching, COUCH_SCRATCH } from './src/couch-scratching.ts';
import { ChaosScore } from './src/chaos.ts';

const score = new ChaosScore();
for (let i = 0; i < 2; i++) {
  const e = new CouchScratching().update(2000, true);
  score.award(`couch-scratch-${e.stage}`, e.value, e.objectId);
}
// Beobachtet: score.score === 3, score.count === 1.
// Zwei unabhängige Modelle, aber dieselben IDs; für zwei echte Sofas wären 6 / 2 nötig.

const e = new CouchScratching({ ...COUCH_SCRATCH, damageValue: 0.5 }).update(2000, true);
// Beobachtet: e.value === 0.5; Konstruktion erfolgreich.
new ChaosScore().award('repro', e.value, e.objectId);
// Beobachtet: Error('Invalid damage value').
```

Für R5 wurde der installierte Phaser-Code gelesen: `restart` stellt Stop/Start in die Queue; der Manager ruft `getScene(key)` auf und startet diese Instanz. `LivingRoom.create()` erneuert die visuellen Objekte, aber nicht die bereits existierenden eigenen Modelle. Ein Scene-Restart wurde im laufenden Spiel nicht über einen Test-Mutator ausgelöst; der Produktionscode besitzt dafür derzeit keine Benutzeraktion. Die vorhandene R-Funktion ist separat automatisiert geprüft.

## Stärken, die bei der Umstrukturierung erhalten bleiben sollen

- `CouchScratching`, `PlantNibbling`, `CurtainSliding`, `ChaosScore` und die Animationsauswahl sind kleine, ohne Phaser prüfbare Modelle/Funktionen. Die Interaktionsmodelle akzeptieren Daten, enthalten Begrenzungen und liefern eingefrorene Schadensereignisse.
- `Vase` ist bereits ein konkretes Spielobjekt mit `push`, `restore`, Zustand und Snapshot. Die Phaser-Vererbung ist hier fachlich passend; daraus folgt keine Pflicht, Sofa und Vorhang von derselben Engine-Klasse abzuleiten.
- Sichtbarer Pixel und Physikkörper sind getrennt. Posen ändern weder Kollisionen noch Schadensregeln. Asset-Konfiguration, Master und Aufbereitung sind nachvollziehbar; der bestätigte Master wird bytegenau geprüft.
- `ChaosScore` trennt eindeutige Ereignisse von der Zahl beschädigter Objekte und schützt heute vor doppelter Vergabe. Dieses Ledger weiterverwenden.
- Blur-Listener und E2E-Beobachter werden beim Shutdown abgemeldet. Der Beobachter liefert eingefrorene Kopien und keine Phaser-Objekte oder Setter.
- Browserprüfungen verwenden echte Tasten, pausierte Uhr und Zustandsabfragen. R, Abbruch, Schadensgrenzen, Punkte, Weltgrenzen, Animationen und Produktionsisolation werden geprüft.
- Vergleichsansicht ist durch Dev-Prüfung, exklusiven Build-Einstieg und negative URL-Tests vom Build getrennt. Der dokumentierte MPA-Modus verhindert den SPA-Fallback für fehlende Debug-Seiten.

## Validierung des geprüften Stands

| Prüfung                                          | Ergebnis                                                                                                                                            |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run qa`                                     | Grün: Lint, 26 Unit-Tests, TypeScript, Produktionsbuild                                                                                             |
| `npm run test:e2e -- --repeat-each=2`            | **46/46 bestanden**, keine Retries, lokal 54,1 Sekunden                                                                                             |
| R2-/R4-Reproduktionen mit Assertions             | Beide beschriebenen Ergebnisse bestätigt                                                                                                            |
| Letzter geprüfter Feature-Head `1e49957` aus #36 | [CI vollständig grün](https://github.com/Skanky0815/pixels-world/actions/runs/41518570243): statische QA, beide Browser-Teil-Suites und Gesamtcheck |
| Konfiguration/Workflows                          | Lockfile, strenges TypeScript, Node-22-CI, Sharding, Artefakte und Release-Workflow gelesen                                                         |

Die lokale Prüfung nutzte die vorhandene Lockfile-Installation. Das Review fügt keine Gameplay-Änderungen oder neuen Test-Hooks hinzu. Es fand keine erneute freie manuelle Spielgefühl-Abnahme und kein Performance-/Speicherprofiling statt. Der Build meldet die bekannte Größe des Phaser-dominierten JS-Chunks; daraus wird ohne Profiling kein Performance-Bug abgeleitet.

Der Release-Workflow führt `npm run qa` aus, aber keinen eigenen Playwright-Lauf. Für #32 muss das Deployment die Browser-QA desselben Commits berücksichtigen. Ein Release-Tag oder eine öffentliche Seite wurde durch dieses Review nicht erzeugt.

## Testlücken und Umsetzung

Mehrere gleichartige Instanzen, überlappende automatische Ziele, Hardwareadapter-Flanken/Blur und vollständiger Scene-Restart sind die gezielten neuen Testfälle für die Folgearbeiten. Die jetzigen 23 Browserfälle belegen den aktuellen Einzelraum, nicht schon diese Erweiterungen. Die Dev-Vergleichsoberfläche wurde im Artwork-Arbeitslauf per Browser geprüft; ihre positive Bedienprüfung ist derzeit kein eigener persistierter CI-Test. Ihre Produktionsabwesenheit ist Teil der Suite.

Die vier bestätigten Folgeissues liegen zunächst **ohne Meilenstein** vor. Damit bleibt #22 ein Review mit dokumentiertem Zielbild; die Umsetzung wird gesondert priorisiert:

1. **#40** als kleine unabhängige Konfigurationskorrektur.
2. **#37** für `InputController`, `Pixel`, Szenenaufbau und expliziten Lebenszyklus.
3. **#38** für konkrete Objektadapter, Instanz-IDs, Fähigkeiten und den gemeinsamen Ereignispfad.
4. **#39** für die reine HUD-Ansicht; nach dem Input-Vertrag auch unabhängig von #38 umsetzbar.

#32 bleibt die gesonderte Veröffentlichungsaufgabe. Die Refactoring-Tickets sind keine pauschale Voraussetzung für die Veröffentlichung des bereits funktionierenden Einzelraums; seine Asset-Basis und Deployment-Checks müssen dagegen stimmen.

## Ergänzung zur Content-Planung

Nach Ricos Ergänzung sind #37–#39 auf `src/game/`, getrennte Controls/UI und `src/dev/` abgestimmt. Hinzu kommen zwei Planungsissues: [#42 – typisierte Raum-/Objektinhalte](https://github.com/Skanky0815/pixels-world/issues/42) nach der Klassenextraktion und [#43 – später validierter JSON-Import](https://github.com/Skanky0815/pixels-world/issues/43) auf demselben stabilen Vertrag. Das sind geplante Erweiterungsschritte, keine zusätzlichen als reproduziert behaupteten Fehler. #29 verwendet die Definitionen; #32 bleibt unabhängig. Die neuen Issues sind zunächst ohne Meilenstein.
