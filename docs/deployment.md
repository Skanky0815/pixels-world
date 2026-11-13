# Release und GitHub Pages

Spieladresse: [Pixel’s World](https://skanky0815.github.io/pixels-world/).
Die Quellen des Ablaufs sind [release.yml](../.github/workflows/release.yml),
[pages.yml](../.github/workflows/pages.yml) und die Skripte unter
[.github/scripts](../.github/scripts/). Kein unabhängiger Pages-Start und kein npm-Publish.

## Spielupdates und Offlineversion

Das Web-App-Manifest beschreibt Installation, Name, Icons und Startseite; eine neue
Versionsnummer darin aktualisiert nicht den gespeicherten Spielcode. Vite PWA und
Workbox laden neue Dateien bei gewählter Offline-Nutzung vollständig in einen wartenden
Service Worker. Die Offline-Kopie entsteht erst auf „Offline-Spiel vorbereiten“ in den
Optionen. Ohne diese Auswahl prüft das Spiel die kleine `version.json` mit `no-store`
und registriert keinen Worker. Diese Datei und die Spielanzeige nutzen dasselbe Versions-Define.
Die Workbox-Laufzeit steckt direkt in `sw.js`, damit eine fehlende externe
Hilfsdatei keine Installation ohne Cache-Handler zulässt
([Workbox-Konfiguration](https://developer.chrome.com/docs/workbox/modules/workbox-build#type-GenerateSWOptions)).

Das Spiel prüft beim Spielaufruf, bei Rückkehr ins sichtbare Fenster und regelmäßig
im Vordergrund auf Updates. „Nach Updates suchen“ in den Optionen startet eine
manuelle Prüfung; Offline- und Fehlerzustände bleiben erneut bedienbar. Die aktuelle
Spielversion steht im selben Menü. Ein Punkt am Optionen-Button kündigt ein
bereitstehendes Update an; er öffnet keinen Dialog während der Runde.

„Jetzt aktualisieren“ bestätigt ausdrücklich den Spielneustart. „Später“ lässt die
aktuelle Runde weiterlaufen. Jeder offene Tab muss seinen eigenen Neustart
bestätigen, auch wenn ein anderer Tab die neue Version schon aktiviert hat.
Ausdrücklich gespeicherte Alben und Einstellungen bleiben beim Update erhalten.
„Album für später merken“ ist separat wählbar; ohne Auswahl bleiben neue Funde für
den Besuch. Alte Albumfunde werden erst auf Wunsch gelesen und durch Abschalten nicht gelöscht.
Alte automatische Offline-Kopien werden beim ersten Start dieser Version ohne gespeicherten
Offline-Wunsch entfernt. „Offline-Dateien entfernen“ betrifft ausschließlich den genauen
App-Scope und seine Workbox-Caches; andere Projekte und Albumdaten bleiben erhalten.

Das gilt auch für die installierte App und den Pages-Unterpfad. Geschlossene oder
offline Geräte können ein Release erst beim nächsten Onlinekontakt erkennen.
Bereits gecachte ältere Releases erhalten die neue Menüanzeige erst, wenn sie
einmal auf diese Version gewechselt haben; die Änderung kann sich nicht rückwirkend
in ihren bereits geladenen Code einbauen.

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

Vor dem nächsten öffentlichen Release ist außerdem die
[Prüfliste zu Jugendschutz und Speicherung](legal/phase2-review.md#vor-dem-release-prüfen)
aus #252 abzuarbeiten; die Anbieter-Einstufung gehört in Ricos normales PR-Review. Grüne technische
QA ersetzt diese Prüfung nicht.

## Englische Release Notes ohne Doppeleinträge

Release Please ist die einzige Quelle für Changelog und GitHub-Release-Text.
Die sichtbaren Kategorien heißen `Features`, `Bug Fixes`, `Performance Improvements`,
`Dependencies` und `Documentation`. Keine parallelen automatisch generierten GitHub-Notes
und keine nachträgliche pauschale Filterung nach SHA oder Text.

Release Please liest zusätzliche Conventional-Commit-Zeilen im Squash-Body als weitere
Änderungen. Daher erzeugt ein englischer Squash-Titel plus erneut kopierter Commit-Titel
zwei Einträge derselben SHA; ein deutscher PR-Titel erklärt zusätzlich den Sprachmix.
Die Lösung ist ein kanonischer Eintrag an der Quelle: Jeder normale PR hat genau einen
englischen Release-Note-Block, auch wenn er mehrere interne Commits enthält:

```text
BEGIN_COMMIT_OVERRIDE
fix(ui): keep result restart controls touch-only

Refs #205
END_COMMIT_OVERRIDE
```

Dies ist der [offizielle Commit-Override von Release Please](https://github.com/googleapis/release-please#how-can-i-fix-release-notes).
Er ersetzt die gesamte ausgewertete Squash-Nachricht. Relevante Issue-Verweise gehören
deshalb auch in den Block; `Closes #N` bleibt zusätzlich im normalen Issue-Bezug des PRs.
PR-Titel und übrige Beschreibung können Deutsch bleiben. Der englische Betreff muss die
zusammengehörige Änderung beschreiben, keine Aufzählung interner Zwischenstände.
Unabhängige Änderungen gehören in getrennte PRs. `!` und eine optionale englische
`BREAKING CHANGE:`-Erklärung bleiben für SemVer erhalten.

Normale PRs werden per Squash-Merge integriert; Plain-/Rebase-Merges verwenden
diesen Override nicht zuverlässig. Beim Squash-Merge den englischen Betreff aus dem Block übernehmen und im Commit-Body nur
Issue-Verweise verwenden. Keine Liste interner Commit-Titel anhängen. Bestehende
Git-Historie, veröffentlichte Tags und alte Changelog-Abschnitte werden nicht umgeschrieben.
Bereits veröffentlichte Release-Texte können bei Bedarf separat geprüft werden.

Der Check `Release note` läuft auch bei Bearbeitung des PR-Texts und bei Label-Änderungen.
So wird ein nach dem Öffnen gesetztes `autorelease: pending` erneut berücksichtigt. Er prüft exakt einen
vollständigen Block, einen Conventional-Commit-Betreff, zulässige Footer und erhaltene
Issue-Verweise. Änderungen an Release-Konfiguration und Manifest starten ebenfalls die
reguläre QA. Englische Grammatik lässt sich aus kurzen Überschriften nicht zuverlässig
ableiten; den Wortlaut prüft die Review, es findet keine automatische Übersetzung statt.
Nur vom GitHub-Actions-Bot im eigenen Repository erzeugte Release-Please-Versions-PRs
mit `autorelease: pending` sind ausgenommen; deren Text generiert Release Please.

`tests/ci/release-notes.test.mjs` prüft mit dem echten Parser und Changelog-Writer aus
`release-please` die doppelte Squash-Nachricht, deutsche Eingabe mit englischem Override,
Feature/Fix, Issue-Verweise, mehrere interne Commits, Breaking Changes und unterschiedliche
Änderungen derselben SHA. Die Entwicklungsabhängigkeit ist auf `17.6.0` fixiert, passend
zur bestehenden Action v5; bei Action-/Parser-Updates gemeinsam prüfen.

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
4. Der bestätigte Kandidat durchläuft zuerst die vollständige QA mit Produktionszeiten
   und Audit. Erst nach erfolgreicher Vollprüfung und verfügbarem Build werden Main,
   auslösender QA-Versuch und Versions-Kandidat erneut geprüft. Dann darf Release Please
   Tag und GitHub Release erstellen; deren Identität muss dem getesteten Kandidaten entsprechen.
   Fehler, Abbruch, fehlender Build oder überholter Kandidat erzeugen keine Veröffentlichung.
5. Nur ein neu erstelltes, verifiziertes Release startet im selben Lauf Pages: getesteten
   Build aus derselben Run-/SHA-Zuordnung übernehmen, Release-Identität erneut prüfen
   und deployen. Kein Neubau und keine zweite Suite im Pages-Job.
6. Live Start/Spiel, Assets, Rechtsseiten, Sprachen und Mobile-Layout prüfen.
   Kein E2E-Observer; verlinkte Version muss dem veröffentlichten Tag entsprechen.

Dieser direkte Workflow-Aufruf berücksichtigt, dass von `GITHUB_TOKEN` erzeugte
Release-Ereignisse keine weitere Pipeline zuverlässig anstoßen. Diagnose-QA ohne passenden Versions-Merge veröffentlicht nichts.
Eine erfolgreiche manuelle Main-QA auf dem gemergten Versions-Kandidaten kann
dagegen den automatischen Publish auslösen. QA-Profile und Reports: [QA](qa.md).

## Identität und Wiederanlauf

`verify-release.sh` bestätigt Tag, veröffentlichtes Nicht-Draft-Release und exakten
Commit nach erfolgreicher Vollprüfung sowie vor Artefaktübernahme und Deployment.
Vor der Vollprüfung bestätigt `auto-publish-candidate.sh` den vorgesehenen Tag
und Commit ohne Veröffentlichung; nach der Prüfung wird dieses Gate erneut ausgeführt. Ein neuer Main-Stand darf
nicht statt des Release-Commits ausgeliefert werden. Concurrency serialisiert
Release/Rollout; notwendige Gates dürfen nicht übersprungen sein.

| Zustand                                                                 | Vorgehen                                                                                                                                                                 |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Main-QA fehlt/läuft/ist fehlgeschlagen                                  | Prepare startet fehlende Main-QA und wartet auf laufende QA. Bei Fehler/Abbruch den verlinkten QA-Lauf beheben; nach Timeout erneut Spielrelease starten.                |
| Kein aktueller Versions-Merge                                           | `prepare`, Versions-PR prüfen/mergen und Main-QA abwarten. Normale Merges sind keine Veröffentlichung.                                                                   |
| Main nach Versions-Merge weitergelaufen                                 | Neu auf aktuellem grünem Main vorbereiten; keinen alten Kandidaten ungeprüft veröffentlichen.                                                                            |
| Mehrere pending-Kandidaten, Tag/Release vorhanden oder unklare Historie | Status untersuchen; keine automatische Bereinigung erzwingen.                                                                                                            |
| Vollprüfung fehlgeschlagen/abgebrochen                                  | Kein neuer Tag und kein Release. Fehler beheben und neuen Kandidaten vorbereiten oder bei unverändertem Commit die fehlgeschlagenen Jobs desselben Laufs erneut starten. |
| Rollout nach erfolgreicher Veröffentlichung fehlgeschlagen              | Tag/Release existieren, der bisherige Pages-Stand bleibt. Fehlgeschlagene Pages-Jobs desselben Laufs erneut starten; Release-Identität wird erneut geprüft.              |
| QA-Artefakt abgelaufen                                                  | Erneut geprüften Build im selben Release-Ablauf liefern; keinen ungeprüften Ersatz hochladen. Aufbewahrung steht im Workflow.                                            |

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

Nach Prüfung des noch unveröffentlichten Kandidaten wird dessen vorgesehener
`release_tag` an QA weitergegeben. Der Release-Link wird vorab in den
QA-Build eingebettet; öffentlich ausgeliefert wird dieser erst nach erfolgreicher
Vollprüfung und verifizierter Veröffentlichung.
Vite erhält `PIXELS_RELEASE_TAG`, vergleicht ihn mit der Paketversion und bettet
den exakten Release-Link ein. Das deployte Artefakt ist derselbe getestete Build.
Ohne expliziten Kontext zeigen Entwicklungs-/Vorschaubuilds nur die Version.
Die Variable allein ersetzt keine Veröffentlichungsprüfung; das Identity-Gate
vor Pages bleibt zuständig. Release-Notes öffnen separat, damit die Runde erhalten bleibt.
