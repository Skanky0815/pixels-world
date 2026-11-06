# E2E-Laufzeit: vier Shards (#124)

Vollständige manuelle und Release-QA verteilt die vorhandenen 60 Browser-Szenarien
auf vier unabhängige Runner statt zwei. Ein Worker pro Runner bleibt erhalten: Phaser/Chromium nutzt Software-Rendering,
und zusätzliche Worker auf derselben Maschine können um CPU konkurrieren. Lokal
bleibt es bei zwei Workern. `fullyParallel: true` verteilt weiterhin einzelne Tests.

In vollständigen Läufen werden keine Tests ausgelassen, Spielzeiten oder Assertions
geändert und keine Retries eingeführt. Alle vier Matrixjobs müssen erfolgreich sein. Der Sammelcheck
behält seinen Namen und erwartet Unit-Report plus vier Browserreports. Nur Shard 1
liefert im Vollprofil das Pages-Artefakt; Release-Ablauf und -Gates bleiben erhalten.
Die Release-Vereinfachung #122/#123 ist ein getrennter PR.

## Runner-Kosten senken (#126)

Die folgende Messung betrifft komplette Suites. Mehr Shards reduzieren deren
Wartezeit, nicht deren Runner-Verbrauch. Deshalb gilt vor dem Phase-2-Release:
Lokal alle Szenarien mit `npm run check:pr`, PR-CI vier `@smoke`-Szenarien auf
einem Runner, Main-CI keine Browsertests. Die vier Shards bleiben für vollständige
manuelle und Release-Prüfungen. Qualitäts-/Unit-Tests und Release-Gates bleiben
aktiv. Tatsächliche Kosten hängen auch von GitHub-Tarif und Abrechnung ab; es werden
keine Euro-Ersparnisse behauptet.

## Referenzmessung mit zwei Shards

[PR-QA 42174174365](https://github.com/Skanky0815/pixels-world/actions/runs/42174174365):

| Messgröße                                      |    Shard 1 |    Shard 2 |
| ---------------------------------------------- | ---------: | ---------: |
| Containerstart                                 |       33 s |       33 s |
| npm ci                                         |        3 s |        2 s |
| Browser-Schritt einschließlich Vorschau-Builds | 3 min 32 s | 4 min 53 s |
| Job insgesamt                                  | 4 min 22 s | 5 min 41 s |

Der Gesamtcheck war 5 min 50 s nach dem ersten Jobstart fertig. Damit ist die
Testsuite der größte Anteil; ein Installationscache allein spart hier wenig.

Die [Vollprofil-Reports 42174190987](https://github.com/Skanky0815/pixels-world/actions/runs/42174190987)
enthalten 24 Tests je Shard, aber summierte Testzeiten von 239,1 gegenüber 317,5 s.
Gleiche Testanzahl bedeutet keine gleiche Laufzeit. Die längsten Einzelszenarien
lagen in diesem Lauf zwischen 24 und 33 s. Mehr Shards verteilen diese Arbeit feiner,
beseitigen aber nicht die Dauer eines einzelnen Tests.

## Vergleich und Grenzen

Der [Vier-Shard-Lauf 42179457636](https://github.com/Skanky0815/pixels-world/actions/runs/42179457636)
bestand Quality und alle vier Browser-Shards einschließlich Sammelcheck. Die vier
JUnit-Reports enthalten je zwölf bestandene Szenarien, zusammen exakt dieselben 48
eindeutigen Fälle wie die Referenz, ohne Überschneidungen oder ausgelassene Tests.

Vergleich mit dem unmittelbar vorherigen
[Zwei-Shard-Lauf 42178525301](https://github.com/Skanky0815/pixels-world/actions/runs/42178525301)
bei unverändertem Spiel und unveränderten Testinhalten:

| Messgröße                              | Zwei Shards | Vier Shards |
| -------------------------------------- | ----------: | ----------: |
| Erster Jobstart bis Gesamtcheck fertig |  6 min 15 s |  4 min 28 s |
| Summierte Zeit aller QA-Jobs           | 12 min 34 s | 13 min 51 s |

Das sind rund 29 % weniger Wartezeit bei rund 10 % mehr summierter Jobzeit. Die
Jobzeitsumme ist kein Abrechnungsbetrag. Die frühere Referenz mit 5 min 50 s zeigt
bereits die Streuung zwischen Runs; dies ist eine Beobachtung, kein belastbarer
mehrfach wiederholter Benchmark. Nach Integration mit dem Release-Fix wird der
aktuelle PR-Stand erneut geprüft; Link und Ergebnis stehen im PR.

Zusätzlich lokal: Sofa-Szenario, ein Worker, drei Wiederholungen je Variante. Median
mit Trace-Aufzeichnung 6,727 s, ohne 6,708 s; alle sechs Ausführungen bestanden.
Dieser kleine Unterschied rechtfertigt hier keine Änderung der Fehlerdiagnose und
sagt nichts Verlässliches über alle Szenarien oder CI-Runner aus. Traces bleiben an.

Verglichen werden
sowohl die Zeit bis zum Gesamtcheck als auch summierte Jobzeiten: Vier Runner können
die Wartezeit reduzieren, aber mehr Runner-Minuten durch mehrfachen Containerstart,
Installation und Vorschau-Build verbrauchen. Eine Halbierung oder Kostensenkung wird
nicht vorausgesetzt. Einzelne Läufe schwanken durch Runnerlast und Image-Cache.

Weitere Schritte erst anhand eigener Messung:

- Trace-Recording profilieren: Die aktuelle Fehleraufbewahrung zeichnet auch bei
  erfolgreichen Tests zunächst mit. Weniger Aufzeichnung könnte einzelne Tests
  beschleunigen, darf die Diagnose fehlgeschlagener Tests nicht unbemerkt entfernen.
- Langsame Szenarien und Clock-/Browser-Roundtrips einzeln profilieren. Keine
  Zustandssetter, keine ausgelassenen Interaktionen und keine schwächeren Assertions.
- Gemeinsame Build-Artefakte nur prüfen, wenn deren Anteil relevant wird. Zusätzliche
  Upload-/Download-Schritte können den kleinen Build-Vorteil wieder aufheben.
- Mehr als vier Shards nur bei ausreichend langen Teil-Suites und verfügbarer
  Runner-Kapazität; kurze Jobs werden zunehmend vom Startaufwand bestimmt.

Grundlage: [Playwright-Sharding](https://playwright.dev/docs/test-sharding) und
[Aufzeichnungsoptionen](https://playwright.dev/docs/test-use-options#recording-options).
