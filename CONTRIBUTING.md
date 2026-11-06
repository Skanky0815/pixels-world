# Beiträge zu Pixel’s World

## Projektsprache und Commits

Deutsch ist die Standardsprache für Projektdokumentation, neue Issue-Titel und -Beschreibungen, Akzeptanzkriterien, PR-Titel und -Beschreibungen sowie die Zusammenarbeit auf GitHub. Historische Kommentare und Diskussionen bleiben unverändert.

`AGENTS.md` bleibt Englisch. Code, Bezeichner, Dateipfade, CLI-Befehle und Konfigurationsschlüssel behalten ihre technische Schreibweise. Commit-Nachrichten dürfen Englisch sein. Wir verwenden das bestehende Conventional-Commits-Muster: `feat:`, `fix:`, `docs:`, `ci:`, `test:` oder `chore:`, bei Bedarf mit Scope, etwa `fix(physics): restore gravity after climbing`.

Git-Identitäten müssen wahrheitsgemäß bleiben; standardmäßig keine Attribution-Trailer wie `AI-assisted-by` ergänzen. Keine Secrets oder echten Gesprächsprotokolle committen.

## Änderungen vorbereiten

[README](README.md) und [Arbeitsregeln](AGENTS.md) lesen. Änderungen auf einem eigenen Branch entwickeln und überschaubar halten. Bewährte Werkzeuge bevorzugen; wesentliche Entscheidungen mit Alternativen und Grenzen nachvollziehbar dokumentieren. Bedeutende langfristige Architekturentscheidungen erhalten bei Bedarf einen Eintrag unter `docs/adr/`.

Jeder Implementierungs-PR verweist auf sein Issue: `Refs #N` für Teilschritte, `Closes #N` nur bei vollständiger Umsetzung mit Merge nach `main`. Zusätzlich den direkten Issue-Link angeben. PR-Beschreibungen erklären das konkrete Problem, das resultierende Verhalten und die tatsächlich ausgeführte Validierung.

## Prüfen und Review

Für Code- oder Tooling-Änderungen `npm ci` und vor Erstellen/Aktualisieren des PRs `npm run check:pr` ausführen: vollständige Projekt-QA und alle E2E-Szenarien lokal. Tatsächliche Ergebnisse im PR dokumentieren. Bei Bewegungs- oder Physikänderungen zusätzlich den [manuellen Spieltest](docs/qa.md#manueller-spieltest) durchführen. Bei Gameplay-, Rendering- oder Teständerungen zusätzlich `npm run test:e2e` ausführen; Installation und Debugging stehen in der [QA-Dokumentation](docs/qa.md#lokal-prüfen). Bei reinen Dokumentationsänderungen Sprache, Aussagen und Links prüfen.

Sara übernimmt ihre Issues und PRs als `Sara-Pixel42`; fertige PRs gehen zur Review an `Skanky0815`, sofern Rico niemand anderen bestimmt. Issue, Branch und PR nachvollziehbar verknüpfen. Bestehende Branches nicht für eine Verknüpfung löschen oder neu erstellen; bei fehlender API-Unterstützung die Grenze und den direkten Branch-Link im Issue dokumentieren. Review- und Branch-Schutzregeln bleiben verbindlich.

Die Konventionen sind aus [The Sara Protocol](https://github.com/Skanky0815/the-sara-protocol/blob/main/CONTRIBUTING.md) übernommen und an Phaser/TypeScript angepasst.

## Lokale Prüfung vor Push

Einmalig Node 22/Abhängigkeiten und Chromium vorbereiten (`npm ci`, `npx playwright install chromium`), dann `npm run hooks:install` ausführen. Der versionierte native `pre-push`-Hook startet `npm run check:pr` und blockiert bei Fehlern. Kleine Commits bleiben ohne vollständigen Testlauf möglich. Der Installer überschreibt weder einen anderen `core.hooksPath` noch einen bestehenden nativen `pre-push`-Hook. Kein automatisches Verändern der Git-Konfiguration bei `npm ci`.

Der Hook prüft den aktuellen HEAD mit sauberem getracktem Arbeitsstand; Pushes anderer Commits werden abgewiesen, reine Löschungen benötigen keine Tests. Ungetrackte Dateien dürfen keine fehlenden Build-Eingaben des Commits ersetzen. Hooks sind eine lokale Hilfe und können umgangen werden. Bei GitHub-API-Änderungen läuft kein lokaler Git-Hook: denselben Prüfbefehl ausdrücklich vor Veröffentlichung ausführen. Keine alten Testergebnisse als frischen Nachweis verwenden.

PR-CI prüft Quality und die `@smoke`-Auswahl auf einem Browser-Runner; Main-CI wiederholt nur Quality. Manuelle QA und Release-Rollout prüfen alle Szenarien auf den konfigurierten Shards, beim Release mit Produktionszeiten. Details: [QA](docs/qa.md#ci-und-runnerverbrauch).

## Code-Stil und Releases

[Entwicklung und Code-Stil](docs/development.md#lesbarer-typescript-code) beschreiben
Formatierung, logische Blöcke und begründete Ausnahmen. Release-Please-Bedienung,
Versionsregeln, Identitäts-Gates und Wiederanlauf stehen ausschließlich unter
[Release und Pages](docs/deployment.md). Aktuelle Ergebnisse stehen in Actions/PRs.

## Dokumentation pflegen

- Vor einer neuen Markdown-Datei einen vorhandenen Zweck prüfen und die zuständige
  Datei aktualisieren. Kleine Feature-Änderungen brauchen keine eigene Statusseite.
- README erklärt Einstieg und Spiel; Entwicklung erklärt Werkzeuge/Code-Stil,
  QA Prüfverfahren, Deployment Veröffentlichungen, Architektur stabile Verträge.
  Content-Anleitung und Asset-Prompts bleiben nah an ihren Quellen.
- Code/Tests/Konfiguration sind maßgeblich für Verhalten, Parameter und Testumfang;
  Issues/PRs für Planung und Verlauf, Actions für aktuelle Testergebnisse.
  Keine Testzahlen, Laufzeitmessungen oder „zuletzt grün“-Stände in Markdown pflegen.
- ADRs nur für langfristige Entscheidungen mit Alternativen und Folgen. Einmalige
  Reviews, Messungen und Inventare gehören ins zugehörige Issue/PR, nicht in neue
  Berichtsordner. Git-Historie bewahrt entfernte historische Dokumente.
- Notwendige Rechtstexte, freigegebene Quellen und reproduzierbare Asset-Anleitungen
  erhalten. Kontaktangaben nicht automatisch aus anderen Projekten synchronisieren.
- Bei Zusammenlegung interne Links und relevante Code-/Workflow-Verweise prüfen;
  keine leeren Weiterleitungsdateien als zweiten Index zurücklassen.
