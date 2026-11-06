# Browser-Szenarien

Die Specs sind fachlich aufgeteilt: `movement`, `lifecycle`, `rendering`, `couch`, `curtain`, `plant`, `vases`, `content`, `hud`, `footer`, `round`, `pixel-return`, `reconciliation`, `start-screen`, `feedback`, `main-goal`, `legal` und `build-isolation`. `support.ts` enthält die gemeinsame Browsergesundheits-/Clock-Fixture und Eingabehelfer. Jede Spec bleibt unabhängig; alle verwenden echte Tastatureingaben und ausschließlich lesbare Snapshots.

Gezielt starten: `npm run test:e2e -- tests/e2e/movement.spec.ts` oder `npm run test:e2e -- --grep 'Sofa:'`. Vollständige Suite: `npm run test:e2e`. PR-CI wählt mit `npm run test:e2e:smoke` vier `@smoke`-Szenarien: Produktionsisolation, Bewegung/Raumgrenzen, Sprung/Reset und Touch-Start/Mehrfinger-Sprung. Manuelle QA und Release-Rollout verteilen alle Szenarien auf vier Shards; Main-CI wiederholt keine Browsertests. Lokal prüft `npm run check:pr` vor dem PR die Projekt-QA und alle Szenarien. Die Suite umfasst 56 Szenarien einschließlich Rundenende, Fokus- und Visibility-Pause.
Headless-Chromium meldet Hintergrundseiten weiterhin als sichtbar. Der Visibility-Test
simuliert deshalb ausschließlich `document.hidden` und das Browserereignis, ohne
Spielzustand zu setzen; echte Tabwechsel gehören zusätzlich zum manuellen Spieltest.

Der Rundentest verwendet vor dem Laden eine reproduzierbare Browser-Zufallsquelle
(Seed 91). Im normalen PR-/lokalen Lauf ist er mit `@fast` markiert und wählt eine
8–10-Sekunden-Testkonfiguration. Die acht Heimkehr-/Versöhnungsszenarien rufen dafür im kurzen
E2E-Build `?round-profile=fast` auf. Die übrigen Szenarien behalten die normalen
Rundengrenzen. Die Testkonfiguration entsteht beim Build; im Produktionsbuild werden
Einstieg und Query-Auswertung entfernt. Es gibt keine schreibbare Browser-Schnittstelle.

`npm run test:e2e:full` startet alle 56 Szenarien mit echten Produktionszeiten; der
identische Rundentest ist dann `@slow` markiert und dauert im Spiel 60–105 Sekunden.
`npm run test:e2e:slow` wählt diese acht vollständigen Heimkehr-/Versöhnungstests. Beide Befehle setzen vor
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
Dialog und Versöhnungsspiel liegen als Bildanhänge im Browserreport.

Das ist ein Lebenszyklustest bei 10 Hz, kein Ersatz für die übrigen Eingabe-, Physik- und
Renderprüfungen mit normalem Frame-Takt. Die Zufallsgrenzen 60/105 Sekunden und genaue
Zeitgrenzen bleiben zusätzlich durch die Domain-Unit-Tests abgedeckt. Das normale
60-Sekunden-Testlimit und null automatische Retries gelten auch hier. `fastForward`
würde ausstehende Timer nur einmal auslösen und ist deshalb für aktive Spielzeit mit
Delta-Begrenzung ungeeignet; verwendet wird weiterhin
[`clock.runFor`](https://playwright.dev/docs/clock#tick-through-time-manually-firing-all-the-timers-consistently).

`reconciliation.spec.ts` spielt mit echten Pfeiltasten bis zum Abschluss und prüft
Fehleingabe, Timeout, adaptive Hilfe, Herzen, gehaltene Tasten, Fokus-/Visibility-Pause
und R während einer Folge. Anleitung und Rückmeldungen bleiben ohne Timer stehen,
bis eine frische Leertaste den nächsten Versuch startet. Die nächsten Pfeile werden ausschließlich aus dem
unveränderlichen Observer gelesen; keine Zustandssetzer oder Phaser-Zugriffe.

Ein weiterer Ablauf prüft zwei Timeouts am selben Herz, den terminalen Misserfolg
und den vollständigen Reset. Die Domain prüft zusätzlich das Zurücksetzen des
Versuchslimits nach jedem gewonnenen Herz.

Die Erfolg-/Misserfolgsszenarien prüfen zusätzlich die tatsächlichen Texte der
Ergebnisansicht, den finalen Score, erhaltenen Originalkommentar und sichtbaren Abschlussspruch, zeitlich stabilen Abschluss
und vollständigen R-Neustart. Der erfolgreiche Durchlauf erzeugt vorher echten
Sofaschaden, damit Punkte und Objektreset nicht nur mit leerem Zustand geprüft werden.

`loadIntro` lädt die echte Einführung ohne Startsignal. Der gemeinsame Helfer
`start` bestätigt anschließend mit echter Leertaste und wartet auf Bodenkontakt;
die übrigen Gameplay-Tests umgehen den Startbildschirm nicht.
`start-screen.spec.ts` prüft Stillstand vor dem Start, Logo, gehaltene Taste,
Fokus, anschließenden Sprung, direkten R-Neustart, Reload und schmale Darstellung.

Die Herzanforderung 1/2/3 und Grenzen 24/25/59/60 sind in Domain-Tests
explizit geprüft. Der Browserlauf mit niedrigem Chaos prüft zusätzlich die
tatsächlich angezeigten Herzen (`♡ · 0/1` → `♥ · 1/1`) und den anschließenden Abschluss.

`feedback.spec.ts` prüft echtes Öffnen eines neuen Tabs per Maus und Enter,
Fokus-/Pause-Lifecycle, unterdrückte Spieltasten bei Linkfokus
und schmale Darstellung außerhalb der Spielfläche. Externe GitHub-Navigation
wird im Browser abgefangen; die Suite benötigt weder GitHub-Anmeldung noch
Netzwerkzugriff zu GitHub und erstellt keine Issues. Die vorhandenen Formulare
bleiben die Quelle für Bugs und Feature-Wünsche.

`main-goal.spec.ts` weist die Erreichbarkeit des oberen Spielzeugs in beiden
Raumvarianten ohne Schaden durch echte Tastatureingaben nach. Geprüft sind
früher Heimkehrtrigger, Pause, Abbruch des Kontaktfortschritts, Rückweg zu Sara
und Neustart. Der vorhandene Rundentest prüft weiterhin den Timer-Fallback
mit nicht erreichtem Ziel. Die Deadline-/Ziel-Rennen sind exakt in Domain-Tests
abgedeckt; kein schreibbarer Browserzustand wird ergänzt.

`legal.spec.ts` prüft echte lokale Rechtsseiten im selben Tab mit Rückkehr zur Einführung, direkte Aufrufe
im Root- und Pages-Unterpfad, schmale Darstellung und die Rücklinks. Zusätzlich
beobachtet ein Produktionslauf externe HTTP-Anfragen, Cookies, Local Storage,
Session Storage und IndexedDB. Rechtsseiten laden keinen Spielcode. Externe
Rechts-/Hostingquellen werden in der Dokumentation verlinkt, nicht durch Tests
abgerufen; die Suite veröffentlicht keine Kontaktanfragen oder Issues.

## Touch-Prüfungen (#54)

`touch.spec.ts` verwendet Chromium mit 390×844 CSS-Pixeln, `hasTouch` und `isMobile`.
Acht Szenarien prüfen echten Start, Mehrfinger-Bewegung/Sprung, getrenntes
Loslassen, Verlassen/Abbruch, gemischte Tastatur-/Touch-Eingaben, bestätigten und
abgebrochenen Neustart, vollständiges Vorhang-Klettern und den Rundenablauf bis
zum erfolgreichen Ergebnis. Ein Resize auf 844×390 und zurück prüft Cleanup und
Rundenerhalt. Alle Button-Ziele sind mindestens 48×48 CSS-Pixel groß.

`touch-support.ts` verwendet Chromiums `Input.dispatchTouchEvent` für Browserinput;
keine Phaser-Referenzen oder schreibbaren Spielzustände. Einzelne Kontaktpunkte
werden auf dem gepinnten Chromium mit einem gezielten touchEnd freigegeben;
Browser-/Playwright-Updates müssen diesen Mehrfingerfall weiterhin bestehen.
Fokuswechsel werden ausschließlich an der Browsergrenze simuliert.

Die vollständige Touch-Heimkehr nutzt dieselben Produktions-/Kurzprofile wie die
übrigen Heimkehrtests. Keine zusätzlichen CI-Shards: ein weiterer kurzer Touch-Smoke
läuft auf dem bestehenden PR-Runner. Die übrigen mobilen Szenarien laufen lokal
vor dem PR und in vollständiger manueller/Release-QA.

Dies ist Browser-Emulation, keine Abnahme auf iPhone/iPad oder Android-Hardware.
Die echte Geräteprüfung bleibt in #54 offen. Canvas-Lesbarkeit und umfassendes
Hoch-/Querformat-Layout folgen in #108; Sprachen in #105.
