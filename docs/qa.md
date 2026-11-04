# Gezielte Game-QA

Wie in The Sara Protocol begrenzen native `paths`-Filter unter `push` und `pull_request` den QA-Workflow auf relevante Änderungen. Es gibt keine eigene Änderungserkennung und keine zusätzliche Filter-Action.

Die identischen Pfadlisten in `.github/workflows/qa.yml` umfassen `src/` (einschließlich künftigem `src/game/`, `src/content/` und `src/dev/`), Assets, Tests, Werkzeuge, Root-HTML/CSS, Paket-/Lockdateien, TypeScript-/Vite-/ESLint-/Playwright-Konfiguration, npm-/Node-Konfiguration sowie Workflows und gemeinsame CI-Skripte. Änderungen an Dev-Werkzeugen prüfen vorerst vollständig, da Typprüfung, Build und Produktionsisolation gemeinsam sind. Asset-READMEs lösen wegen des gemeinsamen Asset-Pfads ebenfalls QA aus.

Reine README-/Dokumentationsänderungen außerhalb dieser Pfade starten keine Game-QA. Neue Build-Eingaben außerhalb der Liste müssen in **beiden** Pfadlisten ergänzt werden. Änderungen an Workflows starten zusätzlich den separaten Workflow **Workflow validation** mit Actionlint, entsprechend der Vorlage aus The Sara Protocol.

Bei einem gestarteten QA-Lauf bleiben Lint, Unit-Tests, Typprüfung, Build und beide Playwright-Shards vollständig erhalten: zwei Browserdurchläufe, null Retries. Der abschließende Check **Playwright (Chromium)** verlangt erfolgreiche Qualität und erfolgreiche Shards; Fehler, Abbruch oder übersprungene notwendige Jobs zählen nicht als Erfolg.

## Manuelle Vollprüfung und Branch-Schutz

Unter **Actions → QA → Run workflow** einen Branch auswählen: `workflow_dispatch` ist ungefiltert und prüft immer vollständig. Der separate manuelle Release-Workflow behält ebenfalls seine Prüfungen.

Die pfadgefilterten Checks dürfen nicht als für **jeden** PR erforderliche Statuschecks konfiguriert werden: Ein komplett ausgelassener Workflow liefert keinen erfolgreichen Check; reine Dokumentations-PRs könnten dadurch blockiert bleiben. Rico übernimmt die Branch-Protection-Einstellungen. Falls künftig zwingend ein erfolgreicher Gesamtcheck für jeden PR erforderlich wird, muss das Workflow-Modell entsprechend angepasst werden.

GitHub verwendet bei PRs einen Drei-Punkt-Vergleich, bei bestehenden Push-Branches einen Zwei-Punkt-Vergleich. Die native Pfaderkennung hat dokumentierte Grenzen: Sie wertet höchstens die ersten 300 geänderten Dateien aus; bei mehr als 1.000 Commits oder einem Diff-Timeout läuft der Workflow unabhängig vom Filter. Große Änderungen bei Bedarf ausdrücklich manuell prüfen.

Für das künftige Pages-Deployment #32 gilt weiterhin: Nur nach erfolgreicher Game-QA des **exakten zu veröffentlichenden Commits** veröffentlichen, gegebenenfalls über einen ungefilterten Aufruf. Das Deployment ist hier noch nicht implementiert.

Quelle: [GitHub-Dokumentation zu Pfadfiltern, Vergleichen und ausgelassenen Checks](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#onpushpull_requestpull_request_targetpathspaths-ignore).

## Testszenarien in der Actions Summary

Die Unit- und Browserjobs zeigen nach ihren Testschritten alle gemeldeten Szenarien mit Statussymbolen direkt in der **Job Summary**. Im abschließenden Job **Playwright (Chromium)** stehen zusätzlich die gemeinsame Liste und explizite Passed-/Failed-/Skipped-Zahlen. Die Statussymbole stehen für Passed, Failed und Skipped. Die Reports werden dafür automatisch als Artefakte zwischen den Jobs übertragen; zum Lesen ist kein Download nötig.

Node erzeugt über `npm run test:unit:ci` neben der Terminalausgabe einen TAP-Report (`test-reports/unit.tap`). Playwright erzeugt zusätzlich zu List/HTML einen JUnit-Report (`test-reports/playwright.xml`). Die gepflegte [test-summary/action](https://github.com/test-summary/action) verarbeitet beide Formate; ihre Version ist als Commit gepinnt. Nodes JUnit-Ausgabe wird bewusst nicht verwendet: Die geprüfte Action übersieht die direkt unter `testsuites` liegenden Testfälle von Node 22. Der TAP-Reporter wird korrekt gelesen.

Die Gesamtübersicht zählt **Ausführungen**: aktuell 30 Unit-Tests plus 26 Browser-Szenarien mit je zwei Durchläufen, also 82 Ergebnisse bei vollständiger CI. Die beiden Browserdurchläufe erscheinen als zwei Zeilen mit demselben Szenarionamen. Es gibt weiterhin null Retries. Jeder Report fließt genau einmal in die Gesamtsumme ein; die zusätzlichen Job-Ansichten werden nicht nochmals mitgezählt.

Die Darstellung läuft mit `always()` auch nach Testfehlern. Reporting- und Downloadfehler werden als Hinweise angezeigt, während die ursprünglichen Testschritte und der immer ausgeführte QA-Gesamtcheck ihren Fehlerstatus behalten. Nur die rein darstellenden Summary-/Transfer-Schritte dürfen mit Fehlern fortfahren. Drei erwartete Reports (Unit und beide Shards) werden auf Vorhandensein geprüft; fehlende Reports sind ausdrücklich als unvollständig markiert. Nach einem harten Runner-Abbruch können nur vorhandene Teilergebnisse angezeigt werden. Aus fehlenden Reports wird kein erfolgreicher Testlauf abgeleitet.

Bei Docs-only startet die pfadgefilterte QA nicht und erzeugt entsprechend keine Testszenarien. Der separate Release-Workflow wird durch diese QA-Erweiterung nicht geändert.

Lokal: `mkdir -p test-reports && npm run test:unit:ci` erzeugt den TAP-Report; `npm run test:e2e` erzeugt zusätzlich JUnit. Generierte Reports sind ignoriert und werden nicht eingecheckt.
