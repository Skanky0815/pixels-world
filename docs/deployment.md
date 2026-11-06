# Veröffentlichung auf GitHub Pages

Spieladresse: [Pixel’s World](https://skanky0815.github.io/pixels-world/).
Pages verwendet GitHub Actions als Quelle und die Umgebung `github-pages`.

## Einmalige Einrichtung

Unter Settings → Pages die Quelle GitHub Actions wählen; die Umgebung auf `main`
beschränken und bei Bedarf eine Freigabe verlangen. Nur der Deploymentjob erhält
`pages: write` und `id-token: write`. Der Releasejob besitzt die benötigten
Release-/PR-Rechte und `actions: read` für die bestehende Main-QA. Kein neuer PAT.

## Veröffentlichung

1. Lokal `npm run check:pr` ausführen, PR-Quality/Smoke und Review abschließen; nach Merge die Main-Quality-Prüfung ohne Browserwiederholung abwarten.
2. **Spielrelease → main → prepare** erstellt den Versions-PR. Version und Changelog
   prüfen, PR-QA bei automatisch mit `GITHUB_TOKEN` erstellten PRs nötigenfalls manuell
   starten, reviewen und mergen. Die `autorelease`-Labels erhalten.
3. Grüne Main-QA auf dem Versions-Merge abwarten. **Spielrelease → main → publish**
   prüft exakt diese bereits vorhandene QA, den aktuellen Main-SHA und den
   ausstehenden Versions-Merge; dann erstellt Release Please Tag und GitHub Release.
4. Bei neuem Release ruft derselbe Workflow Pages auf: Release-Identität bestätigen,
   vollständige gemeinsame QA mit Produktionszeiten einschließlich Audit und beiden
   Browser-Shards ausführen, getestetes SHA-Artefakt übernehmen, erneut Release-Tag
   und Commit bestätigen und deployen. Kein zweiter Build oder zweiter Testlauf.
5. Öffentliche Spieladresse prüfen: Startbildschirm, Spiel, Assets und Rechtsseiten
   erreichbar; Bewegung, Sprung, Schäden und Neustart funktionieren, kein Testobserver.

Ein unabhängiger Pages-Start ohne Release ist nicht mehr vorgesehen. `prepare` und
ein ergebnisloses `publish` veröffentlichen keine Website. Das direkte Aufrufen des
wiederverwendbaren Pages-Workflows nach erfolgreicher Release-Aktion vermeidet einen
zusätzlichen Event-Trigger: `GITHUB_TOKEN` startet nicht zuverlässig weitere
Workflows über selbst erzeugte `release`-Ereignisse.

## Fehler und Wiederholung

- **Keine grüne Main-QA:** bestehenden Lauf abwarten oder Fehler beheben. Es wird
  keine Ersatz-QA im Releasejob gestartet.
- **Kein Versions-Merge:** zuerst `prepare`, einen älteren unveröffentlichten Kandidaten kontrolliert ablösen lassen und den neuen Versions-PR prüfen/mergen,
  Main-QA abwarten und dann `publish`. Der frühere unklare Abbruch nach langer QA
  wird durch diese konkrete Fehlermeldung ersetzt.
- **main weitergelaufen:** Mit `prepare` auf aktuellem grünem Main neu vorbereiten. Der alte pending-Kandidat wird nur als unveröffentlicht abgelöst, wenn weder Tag noch Release existieren und sein Merge ein Vorfahr ist. Aktueller pending-Versions-Merge ergibt dagegen einen erklärten No-op mit PR-Nummer/Version und Hinweis auf `publish`. Mehrere Kandidaten oder vorhandene Tags/Releases benötigen Statusprüfung, keine automatische Änderung.
- **Volle QA oder Deployment gescheitert:** Tag und GitHub Release können bereits
  existieren; der alte Pages-Stand bleibt erhalten. Fehlgeschlagene Rollout-Jobs
  desselben Laufs erneut starten. `publish` erzeugt kein zweites Release und löst
  bei No-op kein neues Deployment aus.
- **Build-Artefakt abgelaufen:** ein reiner Deployment-Retry reicht nicht; die QA
  muss erneut einen geprüften Build liefern. QA-Artefakte bleiben einen Tag,
  Fehler-/Testreports 14 Tage erhalten. Keine ungeprüften Ersatzbuilds hochladen.

Tag, Nicht-Draft-Veröffentlichung und Commit werden mehrfach durch
`.github/scripts/verify-release.sh` bestätigt. Checkout und Artefakt sind an den
Workflow-SHA gebunden. Ein inzwischen neuerer Main-Stand wird beim Rollout nicht
statt des Release-Commits ausgeliefert. Die Pages-Concurrency serialisiert Rollouts.

## Bisherige Integration und aktuelle Grenze

Der ursprüngliche [Pages-Lauf 41918859915](https://github.com/Skanky0815/pixels-world/actions/runs/41918859915)
und der automatische [v0.1.1-Rollout 41945123257](https://github.com/Skanky0815/pixels-world/actions/runs/41945123257)
wurden am öffentlichen Spiel abgenommen. Das belegt den damaligen Ablauf.
Die neue Reihenfolge aus #122 wird lokal und im PR geprüft; ein vollständiger
Publish-/Pages-Integrationstest folgt erst nach Review/Merge und ausdrücklichem
Start des nächsten Releases. Diese Änderung erzeugt selbst keinen Release.

Details und Messgrenzen: [CI-Prüfstrategie](ci-strategy.md).
Quellen: [Pages-Workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
und [Release Please](https://github.com/googleapis/release-please-action#outputs).

## Ablösung unveröffentlichter Kandidaten (#128)

Der reine Main-Gleichheitscheck und Release Pleases Sperre für gemergte pending-PRs
konnten sich gegenseitig blockieren. Der prepare-Vorschritt löst dies für unser
Root-Paket mit `v`-Tags ohne Komponentenpräfix: genau ein älterer pending-PR,
Release-Please-Branch, gültige Manifestversion, Merge als Main-Vorfahr, keinerlei
Tag oder Release dieser Version und weiterhin derselbe Main-SHA. Erst dann wird die
Ablösung am alten PR dokumentiert und nur `autorelease: pending` entfernt. Kein
`tagged`-Label, kein manueller Versionswechsel und keine Tag-/Release-Erstellung.
Der neue Kandidat entsteht weiterhin über die gepinnte Release-Please-Action.

Ein abgelöster Kandidat bleibt unveröffentlicht; Versionsnummern können dadurch
übersprungen werden. Version und Changelog des neuen PRs prüfen. Scheitert Release
Please nach der Ablösung, ist ein erneutes prepare möglich. Bleibt eine Mutation
wegen API-Fehlern unvollständig, bleibt der Lauf fehlgeschlagen und Status/Kommentar
sichtbar; es wird kein Erfolg vorgetäuscht.

Trockenlauf ohne Metadatenänderung: `GITHUB_REPOSITORY=Skanky0815/pixels-world GITHUB_SHA=<aktueller-main-sha> bash .github/scripts/prepare-release-candidate.sh --dry-run`.
Der Workflow prüft davor zusätzlich die erfolgreiche Main-QA. Nur nach Merge dieses
Fixes prepare real erneut ausführen, den neuen Versions-PR reviewen/mergen und nach
grüner Main-QA ausdrücklich publish starten. Die Automatisierung #127 bleibt Phase 2.5.

Grundlage: [Release Pleases Kandidaten-Sperre](https://github.com/googleapis/release-please/blob/main/src/manifest.ts)
und [Outputs der gepinnten Action](https://github.com/googleapis/release-please-action/blob/v5.0.0/src/index.ts).

### Versionslink im Spiel

Nach der bestehenden Prüfung von Veröffentlichung, Tag und Commit reicht Pages
den `release_tag` an die wiederverwendbare QA weiter. Deren Produktionsbuild
erhält `PIXELS_RELEASE_TAG`; Vite vergleicht den Tag mit der Paketversion und
bettet nur den exakt passenden GitHub-Release-Link ein. Der danach deployte
Build ist weiterhin dasselbe getestete Artefakt, ohne Neubau.

Ohne expliziten Release-Kontext wird nur die Versionsnummer angezeigt.
Entwicklungs- und E2E-Builds verlinken auch bei gesetzter Variable keinen Release.
Die Umgebungsvariable allein ersetzt keine Veröffentlichungsprüfung: diese
bleibt im Pages-Identity-Gate. Die Release-Notes öffnen in einem neuen Tab,
damit die laufende Runde erhalten bleibt.
