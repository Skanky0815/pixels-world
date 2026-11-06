# Release und GitHub Pages

Spieladresse: [Pixel’s World](https://skanky0815.github.io/pixels-world/).
Die Quellen des Ablaufs sind [release.yml](../.github/workflows/release.yml),
[pages.yml](../.github/workflows/pages.yml) und die Skripte unter
[.github/scripts](../.github/scripts/). Kein unabhängiger Pages-Start und kein npm-Publish.

## Einrichtung und Versionierung

Pages verwendet GitHub Actions und die Umgebung `github-pages`; zugelassene
Deployments auf `main` beschränken. Nur der Deploymentjob erhält Pages-/OIDC-Rechte.
Der Releasejob braucht seine expliziten Release-/PR-Rechte und Lesezugriff auf
Main-QA. GitHub Actions muss PRs erstellen dürfen. Kein zusätzlicher PAT nötig.

Release Please pflegt Paket-/Lockversion, `.release-please-manifest.json`,
`CHANGELOG.md`, Tags und GitHub Releases. Versionen nicht einzeln von Hand erhöhen.
Conventional Commits, insbesondere der Squash-Titel, steuern den Vorschlag.
Strategie und Versionsregeln stehen in [release-please-config.json](../release-please-config.json).
Nur generierte Root-Dateien sind gezielt von Prettier ausgenommen.

## Bedienung

1. Vor Code-/Tooling-PRs lokal `npm run check:pr`, PR-Checks und Review abschließen.
   Nach Merge erfolgreiche Main-QA für genau den aktuellen Main-Commit abwarten.
2. **Actions → Spielrelease → main → prepare** erstellt/aktualisiert den Versions-PR.
   Version und Changelog prüfen. Mit `GITHUB_TOKEN` erstellte PRs starten nicht
   automatisch weitere Workflows: QA nötigenfalls manuell auf dem Release-Branch
   ausführen. Sara zuweisen, Rico zur Review anfragen und erst bei grünen Checks
   mergen. `autorelease`-Labels erhalten.
3. Auf dem gemergten Versions-PR grüne Main-QA abwarten. **Spielrelease → main →
   publish** bestätigt Quell-Commit, Versions-Merge und vorhandene QA und erzeugt
   Tag/Release. Normale Feature-/CI-Merges dürfen nicht veröffentlichen.
4. Nur ein neu erstelltes Release startet im selben Lauf Pages: Release-Identität
   prüfen, vollständige QA mit Produktionszeiten und Audit, getesteten Build aus
   derselben Run-/SHA-Zuordnung übernehmen, Identität erneut prüfen und deployen.
   Kein Neubau und keine zweite Suite im Pages-Job.
5. Live Start/Spiel, Assets, Rechtsseiten, Sprachen und Mobile-Layout prüfen.
   Kein E2E-Observer; verlinkte Version muss dem veröffentlichten Tag entsprechen.

Dieser direkte Workflow-Aufruf berücksichtigt, dass von `GITHUB_TOKEN` erzeugte
Release-Ereignisse keine weitere Pipeline zuverlässig anstoßen. Manuelle Diagnose-
QA bleibt ohne Veröffentlichung möglich. QA-Profile und Reports: [QA](qa.md).

## Identität und Wiederanlauf

`verify-release.sh` bestätigt Tag, veröffentlichtes Nicht-Draft-Release und exakten
Commit vor Vollprüfung, Artefaktübernahme und Deployment. Ein neuer Main-Stand darf
nicht statt des Release-Commits ausgeliefert werden. Concurrency serialisiert
Release/Rollout; notwendige Gates dürfen nicht übersprungen sein.

| Zustand                                                                 | Vorgehen                                                                                                                                                                 |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Main-QA fehlt/läuft/ist fehlgeschlagen                                  | Abwarten bzw. Fehler beheben; keine Ersatz-QA im Releasejob. Bei gefiltertem Docs-Merge QA manuell auf genau diesem Main starten.                                        |
| Kein aktueller Versions-Merge                                           | `prepare`, Versions-PR prüfen/mergen und Main-QA abwarten. Normale Merges sind keine Veröffentlichung.                                                                   |
| Main nach Versions-Merge weitergelaufen                                 | Neu auf aktuellem grünem Main vorbereiten; keinen alten Kandidaten ungeprüft veröffentlichen.                                                                            |
| Mehrere pending-Kandidaten, Tag/Release vorhanden oder unklare Historie | Status untersuchen; keine automatische Bereinigung erzwingen.                                                                                                            |
| Vollprüfung/Rollout fehlgeschlagen                                      | Tag/Release können existieren, der bisherige Pages-Stand bleibt. Fehlgeschlagene Jobs desselben Laufs erneut starten. Ein Release-No-op erzeugt keinen weiteren Rollout. |
| QA-Artefakt abgelaufen                                                  | Erneut geprüften Build im selben Release-Ablauf liefern; keinen ungeprüften Ersatz hochladen. Aufbewahrung steht im Workflow.                                            |

`prepare-release-candidate.sh` darf einen alten unveröffentlichten Kandidaten nur
bei eindeutigem Root-Paket/Tagformat, gültiger Manifestversion, Merge als Main-
Vorfahr und Abwesenheit von Tag/Release ablösen. Es dokumentiert die Ablösung am
alten PR und entfernt nur `autorelease: pending`. Der neue PR entsteht durch
Release Please; kein manuelles `tagged`, keine manuelle Versionsänderung.
Ein aktueller Kandidat ergibt einen erklärten No-op mit nächstem Schritt.

```sh
GITHUB_REPOSITORY=Skanky0815/pixels-world GITHUB_SHA=<aktueller-main-sha>   bash .github/scripts/prepare-release-candidate.sh --dry-run
```

Release- und Retry-Nachweise gehören in PR/Actions, nicht als zweite Statuschronik
hier. Grundlagen: [Release Please](https://github.com/googleapis/release-please-action#outputs)
und [Pages-Workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Versionslink im Footer

Nur nach verifizierter Release-Identität wird `release_tag` an QA weitergegeben.
Vite erhält `PIXELS_RELEASE_TAG`, vergleicht ihn mit der Paketversion und bettet
den exakten Release-Link ein. Das deployte Artefakt ist derselbe getestete Build.
Ohne expliziten Kontext zeigen Entwicklungs-/Vorschaubuilds nur die Version.
Die Variable allein ersetzt keine Veröffentlichungsprüfung; das Identity-Gate
bleibt zuständig. Release-Notes öffnen separat, damit die Runde erhalten bleibt.
