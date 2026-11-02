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
