# Veröffentlichung auf GitHub Pages

Zieladresse: [Pixel’s World](https://skanky0815.github.io/pixels-world/). Der Workflow ist vorbereitet; die erste erfolgreiche Veröffentlichung und der Live-Spieltest stehen noch aus. Ein Pages-Deployment ist unabhängig vom manuellen Versionsrelease und erzeugt keinen Tag.

## Einmalige Einrichtung

Nach dem Merge unter **Settings → Pages → Build and deployment → Source** die Quelle **GitHub Actions** wählen. Die Umgebung `github-pages` auf `main` beschränken; bei Bedarf eine manuelle Freigabe verlangen. Der Workflow benötigt kein zusätzliches Secret. Der aktuelle Pages-API-Aufruf lieferte 404; eine vorhandene Konfiguration konnte damit nicht bestätigt werden.

## Veröffentlichen

1. Unter **Actions → Spiel auf GitHub Pages → Run workflow** ausdrücklich `main` auswählen. Andere Branches werden übersprungen. Es gibt zunächst keine automatische Veröffentlichung bei Push oder PR.
2. Der Buildjob installiert die Lockdatei, prüft Lint, Unit-Tests, Typen und Build sowie den verpflichtenden Runtime-Audit. Danach laufen alle Browser-Szenarien einmal, ohne Retries. Playwright erstellt zusätzlich den echten Produktionsbuild mit Vites `--base=/pixels-world/` und prüft Start, Sprite-Asset, Footer und die Isolation von Dev-/Testcode unter diesem Pfad. Gameplay wird vollständig am E2E-Build mit echten Tastatureingaben geprüft.
3. Genau das geprüfte `dist/` wird als Pages-Artefakt hochgeladen, ohne anschließenden Neubau. Der Deploymentjob hängt vom erfolgreichen Buildjob ab. Nur er besitzt `pages: write` und `id-token: write`; eine optionale Umgebungsfreigabe erfolgt vor diesem Job. Direkt vor der Veröffentlichung muss der geprüfte Commit weiterhin dem aktuellen `main` entsprechen. Ist `main` weitergelaufen, den Workflow neu starten. Ein Push nach diesem Vergleich kann naturgemäß nicht atomar mit dem Pages-Dienst gesperrt werden.
4. Den Link im Deploymentjob öffnen: Raum und Pixel sichtbar, keine fehlenden Assets; Pfeiltasten, Sprung, Sofa, Pflanze, Vorhang und Neustart ausprobieren. `animation-compare.html` muss unter dem Spielpfad 404 liefern. Erst nach erfolgreichem Live-Spieltest ist #32 vollständig abgeschlossen.

Lokale Entwicklung bleibt unter `/`. Der Pages-Basispfad wird beim Produktionsbuild per CLI gesetzt; Sprite-Importe werden von Vite passend umgeschrieben. Die Quellablage `src/game/` verändert den öffentlichen Pfad nicht.

## Fehlersuche und erneute Veröffentlichung

- **404 / Pages noch nicht aktiv:** Quelle GitHub Actions, Repository-Berechtigungen und Umgebung prüfen. Die Website entsteht erst nach einem erfolgreichen Deployment.
- **Leere Seite oder fehlende Assets:** Spieladresse einschließlich `/pixels-world/` und Network-Tab prüfen. Kein Build mit Root-Basispfad hochladen.
- **QA oder Audit fehlgeschlagen:** Buildjob prüfen; das vorherige Deployment bleibt erhalten. Keine Gates umgehen.
- **main inzwischen geändert:** Den gesamten Workflow erneut auf `main` starten. Alte Artefakte werden nicht separat veröffentlicht.
- **Deployment blockiert:** Umgebungsfreigabe/Branch-Regeln und Pages-Berechtigungen prüfen. Fehlerartefakte aus Browserprüfungen stehen 14 Tage bereit.

Bei fehlerhaftem Spielstand den verursachenden Commit über einen geprüften PR rückgängig machen und den Workflow erneut starten. Veröffentlichung ersetzt den statischen Spielstand; es gibt kein Backend und keine zusätzlichen Zugangsdaten.

Quelle: [GitHub: eigene Pages-Workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
