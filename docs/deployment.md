# Veröffentlichung auf GitHub Pages

Zieladresse: [Pixel’s World](https://skanky0815.github.io/pixels-world/). Der Prototyp ist seit dem erfolgreichen [Deployment vom 2026-11-04](https://github.com/Skanky0815/pixels-world/actions/runs/41918859915) öffentlich spielbar. Der Live-Spieltest bestätigte Assets, Bewegung, Sprung und Sofa-Schaden mit sichtbaren Chaospunkten, ohne Browserfehler oder Testobserver. Dieser manuelle main-Stand ist noch kein veröffentlichter Versionsrelease.

## Einmalige Einrichtung

Nach dem Merge unter **Settings → Pages → Build and deployment → Source** die Quelle **GitHub Actions** wählen. Die Umgebung `github-pages` auf `main` beschränken; bei Bedarf eine manuelle Freigabe verlangen. Der Workflow benötigt kein zusätzliches Secret. Pages ist bereits aktiviert und verwendet `workflow` als Quelle.

## Veröffentlichen

1. Unter **Actions → Spiel auf GitHub Pages → Run workflow** ausdrücklich `main` auswählen. Andere Branches werden übersprungen. Es gibt zunächst keine automatische Veröffentlichung bei Push oder PR.
2. Der Buildjob installiert die Lockdatei, prüft Lint, Unit-Tests, Typen und Build sowie den verpflichtenden Runtime-Audit. Danach laufen alle Browser-Szenarien einmal, ohne Retries. Playwright erstellt zusätzlich den echten Produktionsbuild mit Vites `--base=/pixels-world/` und prüft Start, Sprite-Asset, Footer und die Isolation von Dev-/Testcode unter diesem Pfad. Gameplay wird vollständig am E2E-Build mit echten Tastatureingaben geprüft.
3. Genau das geprüfte `dist/` wird als Pages-Artefakt hochgeladen, ohne anschließenden Neubau. Der Deploymentjob hängt vom erfolgreichen Buildjob ab. Nur er besitzt `pages: write` und `id-token: write`; eine optionale Umgebungsfreigabe erfolgt vor diesem Job. Direkt vor der Veröffentlichung muss der geprüfte Commit weiterhin dem aktuellen `main` entsprechen. Ist `main` weitergelaufen, den Workflow neu starten. Ein Push nach diesem Vergleich kann naturgemäß nicht atomar mit dem Pages-Dienst gesperrt werden.
4. Den Link im Deploymentjob öffnen: Raum und Pixel sichtbar, keine fehlenden Assets; Pfeiltasten, Sprung, Sofa, Pflanze, Vorhang und Neustart ausprobieren. `animation-compare.html` muss unter dem Spielpfad 404 liefern. Dieser Live-Spieltest wurde für den ersten main-Stand erfolgreich durchgeführt.

Lokale Entwicklung bleibt unter `/`. Der Pages-Basispfad wird beim Produktionsbuild per CLI gesetzt; Sprite-Importe werden von Vite passend umgeschrieben. Die Quellablage `src/game/` verändert den öffentlichen Pfad nicht.

## Fehlersuche und erneute Veröffentlichung

- **404 / Pages noch nicht aktiv:** Quelle GitHub Actions, Repository-Berechtigungen und Umgebung prüfen. Die Website entsteht erst nach einem erfolgreichen Deployment.
- **Leere Seite oder fehlende Assets:** Spieladresse einschließlich `/pixels-world/` und Network-Tab prüfen. Kein Build mit Root-Basispfad hochladen.
- **QA oder Audit fehlgeschlagen:** Buildjob prüfen; das vorherige Deployment bleibt erhalten. Keine Gates umgehen.
- **main inzwischen geändert:** Den gesamten Workflow erneut auf `main` starten. Alte Artefakte werden nicht separat veröffentlicht.
- **Deployment blockiert:** Umgebungsfreigabe/Branch-Regeln und Pages-Berechtigungen prüfen. Fehlerartefakte aus Browserprüfungen stehen 14 Tage bereit.

Bei fehlerhaftem Spielstand den verursachenden Commit über einen geprüften PR rückgängig machen und den Workflow erneut starten. Veröffentlichung ersetzt den statischen Spielstand; es gibt kein Backend und keine zusätzlichen Zugangsdaten.

Quelle: [GitHub: eigene Pages-Workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Automatischer Rollout nach Versionsrelease (#69)

`Spielrelease` bleibt manuell mit `prepare`/`publish` gestartet. Nur nach erfolgreichem `publish` **und** `release_created == 'true'` ruft er `pages.yml` als wiederverwendbaren Workflow auf. Es gibt keinen zweiten Deployment-Workflow und keinen neuen PAT. Ein `release: published`-Trigger wäre mit dem bestehenden `GITHUB_TOKEN` nicht zuverlässig, da dessen Ereignisse keine weiteren Workflows starten.

Release Please liefert den Root-Tag und Commit. Vor dem Rollout prüft `.github/scripts/verify-release.sh`: vollständiger SHA entspricht dem geprüften Workflow-Commit, veröffentlichtes Nicht-Draft-Release existiert, Tag zeigt auf denselben Commit (auch bei annotierten Tags). Die Prüfung wird vor Build und unmittelbar vor Deployment wiederholt. Checkout erfolgt ausdrücklich mit diesem SHA; ein inzwischen neuerer main-Stand wird beim Release-Rollout weder gebaut noch ausgeliefert. Der manuelle main-Rollout behält seinen bisherigen Aktualitätsvergleich.

Die gemeinsame Pages-Concurrency serialisiert manuelle und Release-Rollouts ohne laufende Veröffentlichungen abzubrechen. Release-Rechte bleiben im Releasejob; nur der Pages-Deploymentjob nutzt Pages-/OIDC-Schreibrechte, der Buildjob ausdrücklich nur Leserechte. Das aufrufende Pages-Jobdelegat erlaubt diese Rechte für den Unterworkflow. Die Summary nennt Tag, Commit und Spieladresse. Schlägt das Deployment nach erfolgreicher Release-Erstellung fehl, bleibt das Release bestehen: Ein erneutes `publish` erzeugt kein zweites Release und startet deshalb keinen automatischen Rollout. Fehler untersuchen und die fehlgeschlagenen Jobs desselben Laufs erneut starten; kein neues main-Artefakt unterschieben.

### Validierung vor dem ersten Versionsrelease

- Actionlint und Bash-Syntaxprüfung erfolgreich.
- Release-Prüfskript mit simulierten GitHub-Antworten ausgeführt: Lightweight- und annotierter Tag akzeptiert; Draft, fehlende Veröffentlichung, falscher Tag-Commit, API-Fehler, abweichender Workflow-SHA und ungültiger Tag abgewiesen (8 Fälle).
- Workflow-Gates geprüft: erfolgreicher Publish mit `release_created=true` startet Pages; `prepare`, No-op/false/leere Outputs oder fehlgeschlagener Releasejob starten nicht. Jobabhängigkeiten bleiben ohne `always()` fehlersicher.
- Projekt-QA erneut ausgeführt. Gameplay-/Buildkonfiguration unverändert; der vollständige Pages-Lauf samt Browser-Suite ist bereits auf main erfolgreich.
- **Noch offen:** echter Versionsrelease mit automatischem Rollout nach Merge und aktivierter PR-Erstellung. Keine künstlichen öffentlichen Releases für den Test angelegt. #69 bleibt bis zum Integrationstest offen.

Quellen: [Release-Please-Outputs und GITHUB_TOKEN](https://github.com/googleapis/release-please-action#outputs), [wiederverwendbare Workflows](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows).
