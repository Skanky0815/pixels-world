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
- **Kein Versions-Merge:** zuerst `prepare`, aktuellen Versions-PR prüfen/mergen,
  Main-QA abwarten und dann `publish`. Der frühere unklare Abbruch nach langer QA
  wird durch diese konkrete Fehlermeldung ersetzt.
- **main weitergelaufen:** Release auf aktuellem Main neu vorbereiten und prüfen.
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
