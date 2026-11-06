# Beiträge zu Pixel’s World

## Projektsprache und Commits

Deutsch ist die Standardsprache für Projektdokumentation, neue Issue-Titel und -Beschreibungen, Akzeptanzkriterien, PR-Titel und -Beschreibungen sowie die Zusammenarbeit auf GitHub. Historische Kommentare und Diskussionen bleiben unverändert.

`AGENTS.md` bleibt Englisch. Code, Bezeichner, Dateipfade, CLI-Befehle und Konfigurationsschlüssel behalten ihre technische Schreibweise. Commit-Nachrichten dürfen Englisch sein. Wir verwenden das bestehende Conventional-Commits-Muster: `feat:`, `fix:`, `docs:`, `ci:`, `test:` oder `chore:`, bei Bedarf mit Scope, etwa `fix(physics): restore gravity after climbing`.

Git-Identitäten müssen wahrheitsgemäß bleiben; standardmäßig keine Attribution-Trailer wie `AI-assisted-by` ergänzen. Keine Secrets oder echten Gesprächsprotokolle committen.

## Änderungen vorbereiten

[README](README.md) und [Arbeitsregeln](AGENTS.md) lesen. Änderungen auf einem eigenen Branch entwickeln und überschaubar halten. Bewährte Werkzeuge bevorzugen; wesentliche Entscheidungen mit Alternativen und Grenzen nachvollziehbar dokumentieren. Bedeutende langfristige Architekturentscheidungen erhalten bei Bedarf einen Eintrag unter `docs/adr/`.

Jeder Implementierungs-PR verweist auf sein Issue: `Refs #N` für Teilschritte, `Closes #N` nur bei vollständiger Umsetzung mit Merge nach `main`. Zusätzlich den direkten Issue-Link angeben. PR-Beschreibungen erklären das konkrete Problem, das resultierende Verhalten und die tatsächlich ausgeführte Validierung.

## Prüfen und Review

Für Code- oder Tooling-Änderungen `npm ci` und vor Erstellen/Aktualisieren des PRs `npm run check:pr` ausführen: vollständige Projekt-QA und alle E2E-Szenarien lokal. Tatsächliche Ergebnisse im PR dokumentieren. Bei Bewegungs- oder Physikänderungen zusätzlich den [manuellen Spieltest](docs/qa.md#manueller-spieltest) durchführen. Bei Gameplay-, Rendering- oder Teständerungen zusätzlich `npm run test:e2e` ausführen; Installation und Debugging stehen in der [QA-Dokumentation](docs/qa.md#end-to-end-tests). Bei reinen Dokumentationsänderungen Sprache, Aussagen und Links prüfen.

Sara übernimmt ihre Issues und PRs als `Sara-Pixel42`; fertige PRs gehen zur Review an `Skanky0815`, sofern Rico niemand anderen bestimmt. Issue, Branch und PR nachvollziehbar verknüpfen. Bestehende Branches nicht für eine Verknüpfung löschen oder neu erstellen; bei fehlender API-Unterstützung die Grenze und den direkten Branch-Link im Issue dokumentieren. Review- und Branch-Schutzregeln bleiben verbindlich.

Die Konventionen sind aus [The Sara Protocol](https://github.com/Skanky0815/the-sara-protocol/blob/main/CONTRIBUTING.md) übernommen und an Phaser/TypeScript angepasst.

## Lokale Prüfung vor Push

Einmalig Node 22/Abhängigkeiten und Chromium vorbereiten (`npm ci`, `npx playwright install chromium`), dann `npm run hooks:install` ausführen. Der versionierte native `pre-push`-Hook startet `npm run check:pr` und blockiert bei Fehlern. Kleine Commits bleiben ohne vollständigen Testlauf möglich. Der Installer überschreibt weder einen anderen `core.hooksPath` noch einen bestehenden nativen `pre-push`-Hook. Kein automatisches Verändern der Git-Konfiguration bei `npm ci`.

Der Hook prüft den aktuellen HEAD mit sauberem getracktem Arbeitsstand; Pushes anderer Commits werden abgewiesen, reine Löschungen benötigen keine Tests. Ungetrackte Dateien dürfen keine fehlenden Build-Eingaben des Commits ersetzen. Hooks sind eine lokale Hilfe und können umgangen werden. Bei GitHub-API-Änderungen läuft kein lokaler Git-Hook: denselben Prüfbefehl ausdrücklich vor Veröffentlichung ausführen. Keine alten Testergebnisse als frischen Nachweis verwenden.

PR-CI prüft Quality und vier `@smoke`-Szenarien auf einem Browser-Runner; Main-CI wiederholt nur Quality. Manuelle QA und Release-Rollout prüfen alle Szenarien auf vier Shards, beim Release mit Produktionszeiten. Details: [CI-Prüfstrategie](docs/ci-strategy.md).

## Versionierung und Releases

Wir nutzen [Release Please](https://github.com/googleapis/release-please-action) wie The Sara Protocol, hier mit der `node`-Strategie für ein einzelnes Spiel. Die offizielle Action übernimmt Versions-PRs, Changelog, Tags und GitHub Releases. Ein eigener Release-Manager oder eine zweite Paketinstallation ist dafür nicht nötig. Container-Promotion und komponentenspezifische Backend-Prüfungen aus The Sara Protocol entfallen.

- Startversion: `0.1.0`; Tags: `v0.1.0`, `v0.1.1` usw. Die Versionsangabe in `package.json` ist vor dem ersten Tag ein vorbereiteter Stand, kein bereits veröffentlichter Release.
- Unter `1.0.0` erhöhen normale `feat`- und `fix`-Änderungen die Patch-Version; Breaking Changes erhöhen die Minor-Version. Der erste Release verwendet `initial-version: 0.1.0`. Der Schritt zu `1.0.0` wird bewusst im Versions-PR entschieden.
- Conventional Commits und insbesondere Squash-Commit-Nachrichten bestimmen den Versionsvorschlag. Beim Merge daher den passenden Typ und eine aussagekräftige Beschreibung erhalten.
- Release Please pflegt `package.json`, `package-lock.json`, `.release-please-manifest.json` und `CHANGELOG.md`. Versionen nicht einzeln von Hand erhöhen. Die beiden generierten Dateien `.release-please-manifest.json` und `CHANGELOG.md` sind gezielt von Prettier ausgenommen; Paketdatei und übrige Quellen bleiben im Formatcheck.

### Bedienung nach dem Bootstrap-Merge

1. Unter **Actions → Spielrelease → Run workflow** den Branch `main` und Modus `prepare` wählen. Nach Bestätigung der bereits erfolgreichen Main-QA erstellt/aktualisiert Release Please den Versions-PR, ohne Tag oder Veröffentlichung. Ein älterer gemergter pending-Kandidat wird nur dann nachvollziehbar abgelöst, wenn er ein Vorfahr dieses Main ist und weder sein Tag noch ein Release existieren. Der Workflow kommentiert den alten PR und entfernt ausschließlich dessen pending-Label; Release Please erzeugt anschließend den aktuellen Kandidaten. Ist der pending-Versions-Merge bereits aktueller Main, zeigt prepare stattdessen PR/Version und den nächsten Schritt publish an.
2. Den Versions-PR Sara zuweisen und Review von Rico anfordern. Version und Changelog prüfen. Unter **Actions → QA → Run workflow** ausdrücklich den Release-Branch wählen: Mit `GITHUB_TOKEN` erzeugte PRs starten normale PR-Workflows nicht automatisch. Das Repository muss GitHub Actions das Erstellen von PRs erlauben. Ein zusätzlicher PAT ist nicht erforderlich.
3. Nach grüner QA und Review den Versions-PR nach `main` mergen. Die Action-vergebenen `autorelease`-Labels erhalten.
4. Auf genau diesem Versions-Merge **Spielrelease** mit `main` und Modus `publish` starten. Der Workflow bestätigt die bereits erfolgreiche Main-QA und prüft, dass der geprüfte Commit weiterhin `main` ist und zu genau einem gemergten, noch ausstehenden Release-PR gehört. Erst danach erstellt Release Please Tag und GitHub Release. Nur wenn die Action ein neues Release meldet und Tag/Commit verifiziert sind, startet automatisch dieselbe Pages-Pipeline für diesen Commit. Diese führt erst jetzt die vollständige QA einschließlich Produktionszeiten aus und übernimmt deren unter `/pixels-world/` getesteten Produktionsbuild, ohne Neubau oder zweite Test-Suite. Es gibt keinen unabhängigen manuellen Pages-Start.

Ist `main` inzwischen weitergelaufen, schlägt publish bewusst fehl. Dann prepare auf aktuellem grünem Main starten: Der sichere Ablösepfad verhindert die frühere Sackgasse mit alten unveröffentlichten Kandidaten. Den neuen Versions-PR erneut prüfen und mergen; Main-QA abwarten. Bei mehreren pending-Kandidaten, bestehenden Tags/Releases oder unklarer Historie nichts automatisch ändern; Status prüfen. Es gibt keinen automatischen Merge oder npm-Publish. Pages wird nach erfolgreichem `publish` automatisch ausgerollt; `prepare` und ergebnislose Publish-Läufe lösen keinen Rollout aus. Das GitHub Release enthält zunächst Quellcodearchive; ein spielbares Build-Archiv ist noch nicht Teil dieses Ablaufs. Unter Settings → Actions → General muss „Allow GitHub Actions to create and approve pull requests“ aktiviert sein, damit `prepare` den Versions-PR erstellen kann. Der Standard für Workflow-Berechtigungen kann auf Read bleiben; die benötigten Rechte stehen ausdrücklich im Workflow. Der erste vollständige Versionsrelease mit automatischem Rollout muss nach dem Merge auf GitHub geprüft werden; lokale Gate-Prüfungen ersetzen diesen Integrationstest nicht.

## Lesbarer TypeScript-Code

Die [Lesbarkeitsregeln](docs/code-style.md) beschreiben Formatierung, kurze Funktionen,
Leerzeilen, Ausnahmen und die schrittweise Einführung in der CI.
