# Browser-Szenarien

Die Specs sind fachlich aufgeteilt: `movement`, `lifecycle`, `rendering`, `couch`, `curtain`, `plant`, `vases`, `content`, `hud`, `footer`, `round` und `build-isolation`. `support.ts` enthält die gemeinsame Browsergesundheits-/Clock-Fixture und Eingabehelfer. Jede Spec bleibt unabhängig; alle verwenden echte Tastatureingaben und ausschließlich lesbare Snapshots.

Gezielt starten: `npm run test:e2e -- tests/e2e/movement.spec.ts` oder `npm run test:e2e -- --grep 'Sofa:'`. Vollständige Suite: `npm run test:e2e`. Playwright verteilt die Szenarien weiterhin automatisch auf zwei CI-Shards; die Dateien erzeugen keine zusätzlichen Jobs. Die Suite umfasst 31 Szenarien einschließlich Rundenende, Fokus- und Visibility-Pause.
Headless-Chromium meldet Hintergrundseiten weiterhin als sichtbar. Der Visibility-Test
simuliert deshalb ausschließlich `document.hidden` und das Browserereignis, ohne
Spielzustand zu setzen; echte Tabwechsel gehören zusätzlich zum manuellen Spieltest.
