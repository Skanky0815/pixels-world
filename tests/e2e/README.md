# Browser-Szenarien

Die Specs sind fachlich aufgeteilt: `movement`, `lifecycle`, `rendering`, `couch`, `curtain`, `plant`, `vases`, `content`, `hud`, `footer`, `round`, `pixel-return` und `build-isolation`. `support.ts` enthält die gemeinsame Browsergesundheits-/Clock-Fixture und Eingabehelfer. Jede Spec bleibt unabhängig; alle verwenden echte Tastatureingaben und ausschließlich lesbare Snapshots.

Gezielt starten: `npm run test:e2e -- tests/e2e/movement.spec.ts` oder `npm run test:e2e -- --grep 'Sofa:'`. Vollständige Suite: `npm run test:e2e`. Playwright verteilt die Szenarien weiterhin automatisch auf zwei CI-Shards; die Dateien erzeugen keine zusätzlichen Jobs. Die Suite umfasst 34 Szenarien einschließlich Rundenende, Fokus- und Visibility-Pause.
Headless-Chromium meldet Hintergrundseiten weiterhin als sichtbar. Der Visibility-Test
simuliert deshalb ausschließlich `document.hidden` und das Browserereignis, ohne
Spielzustand zu setzen; echte Tabwechsel gehören zusätzlich zum manuellen Spieltest.

Der Rundentest verwendet vor dem Laden eine reproduzierbare Browser-Zufallsquelle
(Seed 91). Im normalen PR-/lokalen Lauf ist er mit `@fast` markiert und wählt eine
8–10-Sekunden-Testkonfiguration. Die vier Heimkehr-Szenarien rufen dafür im kurzen
E2E-Build `?round-profile=fast` auf. Die übrigen Szenarien behalten die normalen
Rundengrenzen. Die Testkonfiguration entsteht beim Build; im Produktionsbuild werden
Einstieg und Query-Auswertung entfernt. Es gibt keine schreibbare Browser-Schnittstelle.

`npm run test:e2e:full` startet alle 34 Szenarien mit echten Produktionszeiten; der
identische Rundentest ist dann `@slow` markiert und dauert im Spiel 60–105 Sekunden.
`npm run test:e2e:slow` wählt diese vier vollständigen Heimkehr-Tests. Beide Befehle setzen vor
Test und Vite-Build `E2E_FULL_ROUND=1`. Die Skripte verwenden die Shell-Schreibweise
von macOS/Linux; auf anderen Systemen die Umgebungsvariable entsprechend setzen.
Es existiert nur ein Satz Ablauf-Assertions für beide Profile. Die Reaktionszeiten und die manuelle
Dialogbestätigung bleiben in beiden Profilen unverändert.

Nach der Vorbereitung mit echten Tasten simuliert der Rundentest `requestAnimationFrame`
über die Playwright-Uhr mit 100-ms-Frames. Er durchläuft Phaser, Physik, HUD,
eingefrorenen Score und Neustart, rendert aber während der Wartephase weniger Bilder.
Zeitmeilensteine werden anhand des unveränderlichen Observers geprüft; die Uhr ersetzt
keine Spielzustände. Profil, gewählte Rundendauer und Framezahl stehen als
`round-simulation` im Testreport. Tags sind auch über Playwrights `--grep` auswählbar;
`@slow` ist hier ein Tag und erhöht keinen Timeout.

Dasselbe Szenario prüft anschließend Saras Eintritt, Reaktions-Key, Dialog, Pause
während der Reaktion, einmaligen Übergang zur Versöhnung und vollständigen Neustart.
Pixel läuft zu Sara und setzt sich hin; Objektzustände und Punkte bleiben unverändert.
Der Kommentar wartet ohne Zeitlimit auf einen frischen Leertastendruck. Die
zusätzlichen Rückkehrtests starten auf Regal und Vorhang und prüfen einen Neustart
während des Laufens im zweiten Raum. Ansichten von
Dialog und Versöhnungsplatzhalter liegen als Bildanhänge im Browserreport.

Das ist ein Lebenszyklustest bei 10 Hz, kein Ersatz für die übrigen Eingabe-, Physik- und
Renderprüfungen mit normalem Frame-Takt. Die Zufallsgrenzen 60/105 Sekunden und genaue
Zeitgrenzen bleiben zusätzlich durch die Domain-Unit-Tests abgedeckt. Das normale
60-Sekunden-Testlimit und null automatische Retries gelten auch hier. `fastForward`
würde ausstehende Timer nur einmal auslösen und ist deshalb für aktive Spielzeit mit
Delta-Begrenzung ungeeignet; verwendet wird weiterhin
[`clock.runFor`](https://playwright.dev/docs/clock#tick-through-time-manually-firing-all-the-timers-consistently).
