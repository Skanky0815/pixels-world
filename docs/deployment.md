# Release und GitHub Pages

Spieladresse: [Pixel’s World](https://skanky0815.github.io/pixels-world/).
Die Quellen des Ablaufs sind [release.yml](../.github/workflows/release.yml),
[pages.yml](../.github/workflows/pages.yml) und die Skripte unter
[.github/scripts](../.github/scripts/). Kein unabhängiger Pages-Start und kein npm-Publish.

## Einrichtung und Versionierung

Pages verwendet GitHub Actions und die Umgebung `github-pages`; zugelassene
Deployments auf `main` beschränken. Nur der Deploymentjob erhält Pages-/OIDC-Rechte.
Der Releasejob braucht seine expliziten Release-/PR-Rechte und Actions-Zugriff für
Main-QA sowie das gezielte Starten der Versions-PR-QA. GitHub Actions muss PRs erstellen dürfen. Kein zusätzlicher PAT nötig.

Release Please pflegt Paket-/Lockversion, `.release-please-manifest.json`,
`CHANGELOG.md`, Tags und GitHub Releases. Versionen nicht einzeln von Hand erhöhen.
Conventional Commits, insbesondere der Squash-Titel, steuern den Vorschlag.
Strategie und Versionsregeln stehen in [release-please-config.json](../release-please-config.json).
Es gilt die normale SemVer-Strategie, auch vor Version 1.0: `fix:` erhöht Patch,
`feat:` erhöht Minor und `!` bzw. `BREAKING CHANGE` erhöht Major.
Ausgehend von 0.1.5 ergibt das beispielsweise 0.1.6, 0.2.0 oder 1.0.0.
Die Sonderregeln `bump-minor-pre-major` und `bump-patch-for-minor-pre-major`
sind dafür deaktiviert. Bei mehreren Änderungen bestimmt der größte nötige
Versionssprung den Vorschlag; die Prüfung erfolgt weiterhin im Versions-PR.
Nur generierte Root-Dateien sind gezielt von Prettier ausgenommen.

## Bedienung

1. Vor Code-/Tooling-PRs lokal `npm run check:pr`, PR-Checks und Review abschließen.
   Der Release-Start verwendet die erfolgreiche Main-QA für genau den aktuellen Commit.
2. **Actions → Spielrelease → main → Run workflow** startet ausschließlich `prepare`
   und erstellt/aktualisiert den Versions-PR. Fehlt für diesen Main-Commit QA
   (etwa nach einem reinen Docs-Merge), startet Prepare automatisch eine kurze QA.
   Bereits laufende QA wird bis zu 20 Minuten abgewartet, erfolgreiche QA wird
   wiederverwendet. Ein separater QA-Klick ist dafür nicht erforderlich.
   Fehlgeschlagene/abgebrochene QA oder ein inzwischen veränderter Main stoppen
   Prepare weiterhin; zuerst den Fehler beheben bzw. auf aktuellem Main neu starten.
   Version und Changelog prüfen. Weil `GITHUB_TOKEN`-PR-Ereignisse keine normale
   PR-QA starten, stößt prepare ausdrücklich `workflow_dispatch` mit Smoke-Profil
   auf dem Release-Branch an. Vollprüfungen bleiben manuell möglich. Sara
   zuweisen, Rico zur Review anfragen und erst bei grünen Checks mergen.
   `autorelease`-Labels erhalten.
3. Der Abschluss von Main-QA löst `workflow_run` aus. Nur der jüngste erfolgreiche
   Push-/manuelle QA-Versuch für exakt den aktuellen Main-Commit kann einen
   eindeutigen gemergten Release-Please-Versions-PR veröffentlichen. Branch,
   Version, erlaubte Versionsdateien und Abwesenheit von Tag/Release werden
   zusätzlich geprüft. Normale Feature-/CI-/Doku-Merges sind erklärte No-ops.
   Ein separater manueller `publish`-Modus entfällt.
4. Nur ein neu erstelltes Release startet im selben Lauf Pages: Release-Identität
   prüfen, vollständige QA mit Produktionszeiten und Audit, getesteten Build aus
   derselben Run-/SHA-Zuordnung übernehmen, Identität erneut prüfen und deployen.
   Kein Neubau und keine zweite Suite im Pages-Job.
5. Live Start/Spiel, Assets, Rechtsseiten, Sprachen und Mobile-Layout prüfen.
   Kein E2E-Observer; verlinkte Version muss dem veröffentlichten Tag entsprechen.

Dieser direkte Workflow-Aufruf berücksichtigt, dass von `GITHUB_TOKEN` erzeugte
Release-Ereignisse keine weitere Pipeline zuverlässig anstoßen. Diagnose-QA ohne passenden Versions-Merge veröffentlicht nichts.
Eine erfolgreiche manuelle Main-QA auf dem gemergten Versions-Kandidaten kann
dagegen den automatischen Publish auslösen. QA-Profile und Reports: [QA](qa.md).

## Identität und Wiederanlauf

`verify-release.sh` bestätigt Tag, veröffentlichtes Nicht-Draft-Release und exakten
Commit vor Vollprüfung, Artefaktübernahme und Deployment. Ein neuer Main-Stand darf
nicht statt des Release-Commits ausgeliefert werden. Concurrency serialisiert
Release/Rollout; notwendige Gates dürfen nicht übersprungen sein.

| Zustand                                                                 | Vorgehen                                                                                                                                                         |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Main-QA fehlt/läuft/ist fehlgeschlagen                                  | Prepare startet fehlende Main-QA und wartet auf laufende QA. Bei Fehler/Abbruch den verlinkten QA-Lauf beheben; nach Timeout erneut Spielrelease starten.        |
| Kein aktueller Versions-Merge                                           | `prepare`, Versions-PR prüfen/mergen und Main-QA abwarten. Normale Merges sind keine Veröffentlichung.                                                           |
| Main nach Versions-Merge weitergelaufen                                 | Neu auf aktuellem grünem Main vorbereiten; keinen alten Kandidaten ungeprüft veröffentlichen.                                                                    |
| Mehrere pending-Kandidaten, Tag/Release vorhanden oder unklare Historie | Status untersuchen; keine automatische Bereinigung erzwingen.                                                                                                    |
| Vollprüfung/Rollout fehlgeschlagen                                      | Tag/Release können existieren, der bisherige Pages-Stand bleibt. Fehlgeschlagene Jobs desselben Laufs erneut starten. Ein No-op erzeugt keinen weiteren Rollout. |
| QA-Artefakt abgelaufen                                                  | Erneut geprüften Build im selben Release-Ablauf liefern; keinen ungeprüften Ersatz hochladen. Aufbewahrung steht im Workflow.                                    |

`prepare-release-candidate.sh` darf einen alten unveröffentlichten Kandidaten nur
bei eindeutigem Root-Paket/Tagformat, gültiger Manifestversion, Merge als Main-
Vorfahr und Abwesenheit von Tag/Release ablösen. Es dokumentiert die Ablösung am
alten PR und entfernt nur `autorelease: pending`. Der neue PR entsteht durch
Release Please; kein manuelles `tagged`, keine manuelle Versionsänderung.
Ein aktueller Kandidat ergibt einen erklärten No-op mit nächstem Schritt.
Fehlt sein erfolgreicher QA-Abschluss als Ereignis, QA manuell auf genau diesem
aktuellen Main erneut starten; alte/überholte Versuche werden nicht übernommen.

```sh
GITHUB_REPOSITORY=Skanky0815/pixels-world GITHUB_SHA=<aktueller-main-sha>   bash .github/scripts/prepare-release-candidate.sh --dry-run
```

`workflow_run` verwendet vertrauenswürdigen Code des Default-Branches, nicht
Code/Artefakte aus dem auslösenden PR. Repository, Branch, Workflow-Pfad,
Commit, Run-ID und Versuch werden gegen die bekannte QA-API geprüft. Main und
die globale Eindeutigkeit des pending-Kandidaten werden vor Release Please erneut
bestätigt. Gemeinsame Concurrency und vorhandene Tags/Release-Metadaten verhindern
doppelte Veröffentlichungen; No-ops und Fehler erscheinen in der Summary.
Ein zwischenzeitlich weitergelaufener Main wird nicht nachträglich freigegeben.

Release- und Retry-Nachweise gehören in PR/Actions, nicht als zweite Statuschronik
hier. Grundlagen: [Release Please](https://github.com/googleapis/release-please-action#outputs), [workflow_run](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_run)
und [Pages-Workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Versionslink im Footer

Nur nach verifizierter Release-Identität wird `release_tag` an QA weitergegeben.
Vite erhält `PIXELS_RELEASE_TAG`, vergleicht ihn mit der Paketversion und bettet
den exakten Release-Link ein. Das deployte Artefakt ist derselbe getestete Build.
Ohne expliziten Kontext zeigen Entwicklungs-/Vorschaubuilds nur die Version.
Die Variable allein ersetzt keine Veröffentlichungsprüfung; das Identity-Gate
bleibt zuständig. Release-Notes öffnen separat, damit die Runde erhalten bleibt.
