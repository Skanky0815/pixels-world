# Browser-Szenarien

Die Specs sind fachlich aufgeteilt: `movement`, `lifecycle`, `rendering`, `couch`, `curtain`, `plant`, `vases`, `content`, `hud`, `footer`, `round` und `build-isolation`. `support.ts` enthält die gemeinsame Browsergesundheits-/Clock-Fixture und Eingabehelfer. Jede Spec bleibt unabhängig; alle verwenden echte Tastatureingaben und ausschließlich lesbare Snapshots.

Gezielt starten: `npm run test:e2e -- tests/e2e/movement.spec.ts` oder `npm run test:e2e -- --grep 'Sofa:'`. Vollständige Suite: `npm run test:e2e`. Playwright verteilt die Szenarien weiterhin automatisch auf zwei CI-Shards; die Dateien erzeugen keine zusätzlichen Jobs. Die Suite umfasst 31 Szenarien einschließlich Rundenende, Fokus- und Visibility-Pause.
Headless-Chromium meldet Hintergrundseiten weiterhin als sichtbar. Der Visibility-Test
simuliert deshalb ausschließlich `document.hidden` und das Browserereignis, ohne
Spielzustand zu setzen; echte Tabwechsel gehören zusätzlich zum manuellen Spieltest.

Der lange Rundentest verwendet vor dem Laden eine reproduzierbare Browser-Zufallsquelle
(Seed 91). Nach der Vorbereitung mit echten Tasten simuliert er `requestAnimationFrame`
über die Playwright-Uhr mit 100-ms-Frames. So durchläuft er weiterhin die komplette
60–105-Sekunden-Runde samt Phaser, Physik, HUD, eingefrorenem Score und Neustart, rendert
aber während der langen Wartephase weniger Bilder. Zeitmeilensteine werden anhand des
unveränderlichen Observers geprüft; die Uhr ersetzt keine Spielzustände. Die gewählte
Rundendauer und Framezahl stehen als `round-simulation` im Testreport.

Dasselbe Szenario prüft anschließend Saras Eintritt, Reaktions-Key, Dialog, Pause
während der Reaktion, einmaligen Übergang zur Versöhnung und vollständigen Neustart.
Pixel, Objektzustände und Punkte bleiben über den Ablauf unverändert. Ansichten von
Dialog und Versöhnungsplatzhalter liegen als Bildanhänge im Browserreport.

Das ist ein Lebenszyklustest bei 10 Hz, kein Ersatz für die übrigen Eingabe-, Physik- und
Renderprüfungen mit normalem Frame-Takt. Die Zufallsgrenzen 60/105 Sekunden und genaue
Zeitgrenzen bleiben zusätzlich durch die Domain-Unit-Tests abgedeckt. Das normale
60-Sekunden-Testlimit und null automatische Retries gelten auch hier. `fastForward`
würde ausstehende Timer nur einmal auslösen und ist deshalb für aktive Spielzeit mit
Delta-Begrenzung ungeeignet; verwendet wird weiterhin
[`clock.runFor`](https://playwright.dev/docs/clock#tick-through-time-manually-firing-all-the-timers-consistently).
