# CI-Prüfstrategie und Laufzeitvergleich

## Prüfungen je Anlass

| Anlass                          | Qualitätsprüfung und Audit | Browser-Suite                               | Veröffentlichung                          |
| ------------------------------- | -------------------------- | ------------------------------------------- | ----------------------------------------- |
| Relevanter PR / Push auf `main` | Jeweils einmal             | Jeweils einmal, zwei Shards, `fast`         | Keine                                     |
| Manuelle QA                     | Einmal                     | Einmal, gewähltes Profil und Wiederholungen | Keine                                     |
| Spielrelease `prepare`          | Einmal über gemeinsame QA  | Einmal, zwei Shards, `full`                 | Nur Versions-PR                           |
| Spielrelease `publish`          | Einmal über gemeinsame QA  | Einmal, zwei Shards, `full`                 | Verifizierter Release und geprüfter Build |
| Manueller Pages-Lauf            | Einmal über gemeinsame QA  | Einmal, zwei Shards, `full`                 | Geprüfter aktueller `main`-Stand          |

PR und Merge bleiben bewusst getrennt geprüft: Ein Squash-/Merge-Commit kann von
seinem PR-Stand abweichen. Es gibt keinen erfolgsbasierten Cache und keine pauschale
Ausnahme für Release-Please-Branches. Ein Versions-PR kann Paket-/Lockdateien ändern.
Automatisch mit `GITHUB_TOKEN` erstellte Versions-PRs weiterhin manuell prüfen.
`workflow_call` startet keinen unabhängigen Zusatzlauf, sondern Jobs im aufrufenden
Workflow. Die vorhandenen Pfadfilter und Checknamen bleiben unverändert.

Neuere PR-/Push-Läufe dürfen ältere Läufe derselben Workflow-/Ref-Gruppe abbrechen.
Manuelle QA sowie die wiederverwendbaren Release-/Pages-Gates verwenden kein
`cancel-in-progress`; die äußeren Release-/Pages-Gruppen serialisieren weiterhin.
Ein fehlgeschlagener oder abgebrochener notwendiger Job liefert keinen Erfolg.

## Getesteten Build weiterreichen

Bei `full` lädt Browser-Shard 1 nach erfolgreicher Suite das tatsächlich unter
`/pixels-world/` getestete `dist/` als `qa-pages-dist-<github.sha>` hoch. Beide Shards
bauen denselben Commit aus derselben Lockdatei; der Quality-Job einschließlich Audit
und **beide** Shards müssen erfolgreich sein. Ein erfolgreicher Upload allein gibt
kein Release frei. Normale `fast`-Läufe erzeugen kein Deployment-Artefakt.

Pages lädt ausschließlich das SHA-benannte Artefakt aus **demselben Workflow-Lauf**:
kein anderer Run, kein beliebiger Download und kein Neubau als Ersatz. Beim Release
wartet der Aufrufer zuerst auf die gesamte QA und Release-Identitätsprüfung; beim
manuellen Pages-Lauf übernimmt ein eigener Aufruf derselben QA dieses Gate.
Release-Tag, veröffentlichter Release und Commit werden weiterhin vor Artefaktübernahme
und vor Deployment geprüft. Der manuelle Pfad vergleicht weiterhin mit aktuellem
`main`. Nur ein erfolgreicher Artefaktjob erlaubt Deployment.

QA-Artefakte bleiben einen Tag verfügbar. Bei Ablauf den gesamten Lauf einschließlich
QA wiederholen; fehlende Artefakte dürfen nicht durch ungeprüfte Builds ersetzt
werden. Die bestehenden Fehler-/Testreports bleiben 14 Tage erhalten.

Grundlage: [Download Artifact](https://github.com/actions/download-artifact#usage)
verwendet standardmäßig den aktuellen Lauf. Die
[GitHub-Kontexte](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#github-context)
liefern Commit, Ereignis und Workflow zur Bindung von Artefakt und Concurrency.

## Formatierung generierter Dateien (#119)

Release Please pflegt `.release-please-manifest.json` und `CHANGELOG.md`; der
Versions-Merge `489b46d` enthält die beanstandete Generatorausgabe. Lokal beanstandete
`npm run format:check` vor der Korrektur genau diese zwei Dateien, entsprechend den
fehlgeschlagenen Läufen [main](https://github.com/Skanky0815/pixels-world/actions/runs/42143792701)
und [Versions-PR](https://github.com/Skanky0815/pixels-world/actions/runs/42143583461).
Nur diese zwei Pfade sind nun zusätzlich ignoriert. Die Ausgabe bleibt unverändert,
sodass ein erneuter Generatorlauf keinen Formatierungskonflikt erzeugt. Insbesondere
`package.json`, eigener TypeScript-Code und normale Dokumentation bleiben geprüft.

## Messung und Einsparung (#120)

Am 6. November 2026 zeigten die letzten 15 Runs sechs `push`-QA-Läufe, acht PR-Läufe
(drei davon durch weitere Updates abgebrochen) und einen manuellen Release-Lauf.
PR und Push prüfen dabei unterschiedliche Commit-Identitäten.

Messwerte aus [prepare 42142382295](https://github.com/Skanky0815/pixels-world/actions/runs/42142382295):

- Vollständige QA: erster Jobstart 01:13:38 UTC, Gesamtcheck fertig 01:23:21 UTC,
  also 9 min 43 s einschließlich paralleler Jobs und Wartezeiten.
- Anschließender Releasejob: 41 s. Davon wiederholte Installation 3 s, `npm run qa`
  16 s und Audit 1 s: **20 s redundante serielle Schritte**, jetzt entfernt.
- Der ausgelassene Pages-Job war kein zusätzlicher Testlauf. Die Gesamtspanne des
  Runs bis 01:27:50 UTC darf daher nicht als reine QA-Rechenzeit ausgegeben werden.

Das frühere echte [publish 41945123257](https://github.com/Skanky0815/pixels-world/actions/runs/41945123257)
hatte zusätzlich einen Pages-Buildjob von 4 min 44 s einschließlich Installation,
zweiter Qualitätsprüfung und Browser-Suite. Das ist eine historische Größenordnung
mit älterem Spielstand, keine garantierte aktuelle Zeitersparnis.

Strukturell sinken die Prüfungen pro `publish` von **drei auf eine Qualitäts-Suite**
und von **zwei auf eine vollständige Browser-Suite**. `prepare` sinkt von zwei auf
eine Qualitäts-Suite. Beim manuellen Pages-Lauf bleibt die Abdeckung erhalten und
nutzt nun dieselben zwei vorbereiteten Browser-Container wie die übrige QA.
Upload/Download ersetzen die zweite Installation und Tests beim Release-Rollout.

Nachher-Messung: Die PR-QA und eine manuelle `full`-QA prüfen die Änderung vor dem
Merge; Links und gemessene Laufzeiten werden im PR ergänzt. Ein echter Publish mit
Deployment ist ein separater, ausdrücklich gestarteter Integrationstest nach dem
Merge. Daher werden hier weder eine neue Release-Laufzeit noch Kosten in Euro
behauptet. Abrechnungsdaten wurden nicht erhoben; Runner-Minuten und Wartezeit sind
unterschiedliche Messgrößen.

## Required Checks

Die klassische Branch-Protection-API meldete am 6. November 2026 „Branch not protected“.
Zusätzlich existiert ein aktives Repository-Ruleset `main protection` mit Review-,
Linearitäts-, Lösch- und Force-Push-Regeln, aber ohne `required_status_checks`.
Es werden keine Schutzeinstellungen verändert. Pfadgefilterte Workflows dürfen
weiterhin nicht als für jeden PR verpflichtend eingestellt werden: Bei reinen
Dokumentationsänderungen würden sonst Checks auf Pending bleiben. Vor einer solchen
Umstellung muss ein immer gestarteter Gesamtcheck eingeführt werden.
