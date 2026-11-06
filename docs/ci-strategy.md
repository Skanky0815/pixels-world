# CI-Prüfstrategie

Der Ablauf hat vier Stufen:

1. **PR:** Quality mit Formatierung, Lint, CI-Gate-/Hook-Tests, Unit-Tests, Typprüfung, Build, Audit
   und drei Smoke-Szenarien auf einem Runner als Grundlage für die Review.
2. **Merge:** Quality ohne erneute Browsertests auf dem tatsächlichen `main`-Commit. Ein
   Squash-/Merge-Commit kann vom PR-Stand abweichen.
3. **Manueller Release:** bereits erfolgreiche Main-QA für genau diesen aktuellen
   `main`-Commit bestätigen; Release Please erstellt Tag und GitHub Release.
   Hier startet keine weitere QA.
4. **Rollout nach Release-Erstellung:** Release-Identität bestätigen, gemeinsame
   QA mit `full_round: true` ausführen, getesteten Produktionsbuild übernehmen
   und GitHub Pages veröffentlichen.

Der Versions-PR-Prozess bleibt: `prepare` erstellt/aktualisiert den Release-Please-PR;
dieser wird geprüft und gemerged. `publish` muss auf dem ausstehenden Versions-Merge
starten. Normale Feature-/CI-Merges sind keine Versions-Merges. Beide Modi prüfen
zunächst die vorhandene erfolgreiche Main-QA. Bei älteren unveröffentlichten pending-Kandidaten löst prepare sie nach überprüfter
Historie und Abwesenheit von Tag/Release nachvollziehbar ab, bevor Release Please
einen aktuellen Versions-PR erzeugt (#128). Ein bereits aktueller Kandidat wird
stattdessen als No-op mit PR/Version und Hinweis auf publish angezeigt.
Fehlende, laufende, abgebrochene oder
fehlgeschlagene QA sowie ein inzwischen anderer Main-Commit blockieren früh mit
verständlicher Fehlermeldung. Der Releasejob benötigt dafür `actions: read`.

Pages hat keinen separaten manuellen Einstieg. Der Release-Workflow ruft ihn nur
bei `publish` und `release_created == 'true'` wiederverwendbar auf. Das funktioniert
auch mit `GITHUB_TOKEN`; ein zusätzliches `release: published`-Ereignis ist nicht
nötig. Manueller QA-Start bleibt zur Diagnose ohne Veröffentlichung verfügbar.

## Lokale Verantwortung und Kosten (#126)

Vor Erstellen/Aktualisieren eines Code-/Tooling-PRs führt `npm run check:pr` die
vollständige Projekt-QA und alle 48 Browser-Szenarien lokal aus. Der native
`pre-push`-Hook lässt sich mit `npm run hooks:install` ausdrücklich aktivieren;
bestehende Hook-Konfigurationen werden nicht überschrieben. GitHub-API-Änderungen
lösen ihn nicht aus: gleicher lokaler Prüfbefehl und tatsächlicher Nachweis im PR
bleiben erforderlich. Details und Grenzen stehen in CONTRIBUTING.md.

PRs verwenden nur einen Browser-Runner mit drei getaggten Smoke-Szenarien; Main
startet keinen Browser-Runner. Vollständige manuelle und Release-QA verwendet vier
Shards. Der Sammelcheck behält seinen Namen und unterscheidet absichtlich geplantes
Auslassen auf Main von fehlgeschlagenen/abgebrochenen/übersprungenen notwendigen
Browserjobs. Kein vollständiger E2E-Erfolg wird für einen Smoke-/Main-Lauf behauptet.

## Build, Identität und Fehler

Die vollständige QA läuft nach der Release-Erstellung. Schlägt sie fehl, existieren
Tag und GitHub Release bereits, aber der bisherige öffentliche Spielstand bleibt
unverändert. Fehlgeschlagene Rollout-Jobs desselben Laufs erneut starten, nachdem
die Ursache geklärt wurde; ein erneutes `publish` mit bereits erstelltem Release
startet keinen zweiten Rollout.

Browser-Shard 1 lädt nach erfolgreichem `full`-Test das tatsächlich unter
`/pixels-world/` getestete `dist/` als `qa-pages-dist-<github.sha>` hoch. Quality
inklusive Audit und alle vier Shards müssen erfolgreich sein. Pages lädt dieses Artefakt
nur aus demselben Workflow-Lauf und vom gleichen Commit, ohne Installation, zweite
Testsuite oder Neubau. Fehlende Artefakte blockieren. QA-Builds bleiben einen Tag,
Test-/Fehlerreports 14 Tage verfügbar. Nach Ablauf der Build-Aufbewahrung genügt ein
isolierter Deployment-Retry nicht; die QA muss erneut einen geprüften Build liefern.

Tag, veröffentlichtes Nicht-Draft-Release und vollständiger Commit-SHA werden vor
vollständiger QA, vor Artefaktübernahme und vor Deployment überprüft. Ein neuerer
Main-Stand wird beim Rollout nicht untergeschoben.

Die äußeren Release-/Pages-Concurrency-Gruppen serialisieren ohne laufende Gates
abzubrechen. Normale PR-/Push-QA darf überholte Läufe derselben Ref abbrechen;
manuelle und aufgerufene Release-QA darf dies nicht. Kein notwendiger Job darf
übersprungen sein und trotzdem Deployment freigeben.

## Warum die Vereinfachung (#122)

[Spielrelease 42176256152](https://github.com/Skanky0815/pixels-world/actions/runs/42176256152)
bestand die gesamte vollständige QA und scheiterte danach am Versions-Merge-Gate:
`46b8f78` war der CI-Fix #121, kein ausstehender Versions-Merge. Die Prüfung war
sachlich richtig, aber zu spät und ohne hilfreiche Fehlermeldung. Zugleich blockierte
der alte unveröffentlichte pending-Kandidat neue prepare-Läufe; dieser zusätzliche
Wiederanlauffall wird durch den kontrollierten Ablösepfad aus #128 abgedeckt. Sie läuft jetzt
vor der Release-Aktion, ohne vorherige zusätzliche Vollprüfung.

Der vorige Ablauf wiederholte schon vor #121 Installationen und komplette QA-Suites.
[prepare 42142382295](https://github.com/Skanky0815/pixels-world/actions/runs/42142382295)
enthielt 20 Sekunden zusätzliche Installations-/QA-/Audit-Schritte im Releasejob.
#121 entfernte sie und ersetzte die zweite Pages-Suite durch Artefaktübernahme.
Die erste volle QA lag dort noch vor der Release-Erstellung und wurde nun in den
Rollout verschoben. Insgesamt bleibt es bei einer vollen Suite pro neuem Release;
`prepare` benötigt keine zusätzliche Suite mehr. Zeiten schwanken mit Runnerlast;
eine tatsächliche neue Release-Laufzeit wird erst nach dem ersten bewussten Rollout
gemessen, keine Euro-Ersparnis behauptet.

## Formatierung und Branch-Schutz

Release Please pflegt `.release-please-manifest.json` und `CHANGELOG.md`. Nur diese
beiden generierten Root-Dateien sind gezielt von Prettier ausgenommen (#119).
`package.json`, eigener Code und normale Dokumentation bleiben geprüft.

Die bisherigen Pfadfilter und PR-Checknamen bleiben erhalten. Bei der Prüfung am 6. November 2026 hatte das aktive Repository-Ruleset `main protection` Review-,
Linearitäts-, Lösch- und Force-Push-Regeln, aber keine `required_status_checks`.
Schutzeinstellungen werden nicht verändert. Falls ein reiner Dokumentations-Merge
keine Push-QA auslöst, vor `prepare` die QA ausdrücklich auf `main` manuell starten.
Der Quell-Check akzeptiert Push- und manuelle QA auf exakt diesem Main-Commit,
aber keine PR-Checks. Pfadgefilterte Workflows dürfen nicht
für jeden PR verpflichtend eingestellt werden: Dokumentations-PRs könnten sonst auf
Pending bleiben. Dafür wäre zunächst ein immer gestarteter Gesamtcheck nötig.

Prüfung der Release-Quell-Gates: `bash tests/ci/release-gates.sh` (auch im QA-Qualityjob).

Quellen: [Download Artifact](https://github.com/actions/download-artifact#usage),
[Release-Please-Outputs](https://github.com/googleapis/release-please-action#outputs)
und [GitHub-Kontexte](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#github-context).
