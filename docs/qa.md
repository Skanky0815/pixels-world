# Qualitätsprüfungen

```sh
npm run format:check # Einheitliche Formatierung
npm run lint       # ESLint mit TypeScript-Regeln; Warnungen führen zum Fehler
npm run typecheck  # Strenge TypeScript-Prüfung
npm run test:unit  # Punkte, Doppeltzählung, Reset und Ärgerschwellen
npm run qa         # Formatierung, Lint, Unit-Tests, Typprüfung und Produktionsbuild
```

Die [Lesbarkeitsregeln](code-style.md) einschließlich lokal begründeter Ausnahmen
sind verbindlich; Formatierungsfehler sind auch in CI, Release und Pages blockierend.

## Manueller Spieltest

1. Lokal öffnen: Die Einführung zeigt Banner, Spielidee und Steuerung. Vor Leertaste laufen weder Zeit noch Bewegung oder Schäden; Pfeiltasten und R starten nichts. Leertaste halten startet genau einmal und erzeugt keinen Sprung. Danach sind Raum, Pixel, Sofa, Regale und Vorhang sichtbar. Im schmalen Fenster bleiben Text lesbar und Start-Hinweis sichtbar; Inhalt bei Bedarf scrollen. Nach R beginnt direkt eine neue Runde, nach Reload erscheint die Einführung erneut.
2. Links und rechts laufen: Boden und Raumgrenzen halten Pixel auf.
3. Von der Startposition nach rechts aufs Sofa springen. Zur rechten Kante laufen und auf das erste Regal springen; danach das nächste Regal erreichen. Pixel landet auf den sichtbaren Flächen.
4. Am Vorhang ↑ halten: Pixel klettert. Loslassen zum langsamen Abrutschen mit Stoffschaden, ↓ zum schnelleren Absteigen und Leertaste mit einer Richtung zum Abspringen. Nach dem Verlassen wirkt wieder Schwerkraft.
5. Auf einer Plattform oder beim Klettern R drücken: Pixel kehrt zur Startposition zurück.
6. Die erste Vase auf dem Regal von links anschubsen. Beim Kontakt bleiben die Punkte unverändert; erst der Bodenaufprall liefert 25 Punkte und sichtbare Splitter. Warten/erneutes Berühren zählt nicht nochmals.
7. Am Vorhang zur zweiten Vase klettern und sie nach links vom Regal schieben. Nach deren Bruch liefern die beiden Vasen zusammen 60 Punkte; Vorhangrisse können zusätzliche Punkte beitragen. Beim seitlichen Regalwechsel wegen des Abrutschens etwas höher ansetzen.
8. R drücken: alle Vasen stehen wieder, Splitter verschwinden und Punkte/Ärger-Vorschau sind zurückgesetzt.
9. Browsergröße ändern: Der gesamte Raum bleibt im ursprünglichen Seitenverhältnis sichtbar.
10. Während Sprung/Klettern auf einen anderen Tab wechseln und zurückkehren: Uhr, Bewegung und Schaden pausieren; keine klemmenden Tasten oder nachgeholte Hintergrundzeit.
11. Eine Runde abwarten: grobe Hinweise wechseln, nach 60–105 aktiven Sekunden tritt Sara ein. Eintritt, Reaktionsmoment, passender Dialog und das per Leertaste gestartete Versöhnungsspiel folgen in dieser Reihenfolge. Pixel läuft automatisch zu Sara und setzt sich hin, auch vom Regal oder Vorhang aus. Weitere Schäden und Punkte bleiben unverändert. Der Kommentar wartet auf einen neuen Druck auf die Leertaste; eine gehaltene Taste überspringt ihn nicht. Fokusverlust pausiert auch die Sara-Sequenz. R stellt die gesamte Runde samt unsichtbarer Sara und leerer Dialogauswahl wieder her.

12. Nach Saras Kommentar Leertaste drücken: Die Anleitung wartet ohne Timer auf erneute Bestätigung. Danach erscheint nur die nächste Pfeiltaste als große Kachel. Saras Sprüche und Rückmeldungen warten nach jeder Folge auf die Leertaste; während der Reaktion gibt es keinen Dialogtext zum Mitlesen. Die Herzanzeige verlangt bei 0–24 Chaos ein, bei 25–59 zwei und ab 60 drei Herzen. Jede richtige Folge vergibt genau eines; falsche Tasten und Timeout erlauben Wiederholung ohne Herzverlust. Gedrückthalten überspringt keine Taste. Fokus-/Tabpause stoppt die Frist; R setzt Fortschritt und Route zurück. Volle Leiste zeigt Streicheln und anschließend „Versöhnt“. Das Ergebnis zeigt Chaospunkte, Saras ursprüngliche Reaktion, Versöhnungsausgang, Herzen und einen neuen Abschlussspruch passend zu Ärgerstufe und Ausgang. Nach R verschwinden Ergebnis und alle alten Schäden; Uhr und Punkte starten frisch. Zwei Fehler am selben Herz ergeben „Versöhnung gescheitert“; Leertaste öffnet keinen weiteren Versuch, R startet vollständig neu.

13. „Feedback & Ideen“ per Maus und Tab/Enter öffnen: neuer GitHub-Tab, unveränderte Spielseite. Feedback links und Copyright rechts in derselben Zeile, ohne zusätzlichen Infotext; während Linkfokus lösen Leertaste/R/Pfeile keine Spielaktion aus. Bei Tabwechsel pausiert die Runde, nach Rückkehr geht sie weiter. Im schmalen Fenster überdeckt der Link weder Spiel noch HUD.

14. Zum goldenen Lieblingsball auf dem oberen rechten Regal klettern und 1,2 Sekunden stehen bleiben: Fortschritt, dann vorzeitige Heimkehr mit Zielerfolg, auch ohne Chaospunkte. Bewegung bricht Teilfortschritt ab, Browserpause hält ihn an. Ohne Zielkontakt endet die Runde wie bisher am Timer mit nicht erreichtem Ziel. Auswertung und R-Neustart behandeln beide Wege konsistent.

15. Impressum und Datenschutz vom Startbildschirm und laufenden Spiel aus öffnen: derselbe Tab ohne zusätzliches Fenster, korrekte Kontaktdaten aus der freigegebenen Quelle und Rückkehr zur Einführung über „Zum Spiel“. Beide Seiten unter Root- und Pages-Unterpfad direkt erreichbar, zurück zum Spiel verlinkt und bei 390 px ohne horizontalen Überlauf lesbar.

## End-to-End-Tests

```sh
npm ci
npx playwright install chromium
npm run test:e2e
```

Playwright baut und startet selbst zwei lokale Vorschauen auf den Ports **4174** (E2E-Build) und **4175** (Produktionsbuild). Die Ports müssen frei sein; ein vorhandener Server wird nicht übernommen. Der normale Entwicklungsserver auf 5173 bleibt davon unabhängig. Die Suite verwendet echte Tastatureingaben; sie setzt keine Spielfigurenpositionen.

```sh
npm run test:e2e -- --repeat-each=3  # Stabilitätsprüfung ohne automatische Retries
npm run test:e2e -- --workers=1     # Serieller Lauf bei knappen Ressourcen
npm run test:e2e:debug              # Sichtbarer Browser und Playwright Inspector
npm run test:e2e:report             # Letzten HTML-Bericht öffnen
```

Auf Linux bei Bedarf einmal `npx playwright install --with-deps chromium` ausführen. CI führt jeden Test normalerweise einmal ohne automatische Retries aus; zusätzliche Durchläufe sind manuell wählbar, installiert Chromium samt Systemabhängigkeiten und speichert den HTML-Bericht sowie Screenshots/Traces fehlgeschlagener Tests für 14 Tage getrennt je Teil-Suite als `playwright-results-1` bis `playwright-results-4`. Ein Trace lässt sich mit `npx playwright show-trace <pfad-zur-trace.zip>` öffnen.

Lokal laufen Tests isoliert mit zwei Workern, auch innerhalb derselben Testdatei, und geben Tasten im Cleanup frei. PR-CI prüft nur die vier `@smoke`-Szenarien auf einem Runner. Main-CI startet keine Browserjobs. Manuelle QA und Release-Rollout verteilen die vollständige Suite mit Playwrights `--shard=1/4` bis `--shard=4/4` auf vier unabhängige Runner mit je einem Worker. `fullyParallel` erlaubt die Aufteilung einzelner Tests statt ganzer Dateien. Der Gesamtcheck **Playwright (Chromium)** verlangt Quality und alle geplanten Browserjobs. Nur auf Main zählt das ausdrücklich geplante Auslassen des Browserjobs als Erfolg; bei PR/Release zählt Überspringen, Fehler oder Abbruch nicht als Erfolg; ein Fehler bricht die anderen Teil-Suites nicht vorzeitig ab. Jeder Test besitzt seinen eigenen Browser-Kontext und seine eigene pausierte Uhr; die statischen Vorschau-Server werden gemeinsam genutzt. Ein Worker je CI-Runner vermeidet Konkurrenz beim Software-Rendering; zwei lokale Worker nutzen die lokale Hardware. Bei knappen Ressourcen lässt sich mit `--workers=1` seriell ausführen; `--workers=N` überschreibt die Vorgabe auch in CI. Testabdeckung und null automatische Retries bleiben erhalten; zusätzliche Durchläufe lassen sich manuell wählen.

Playwrights Browser-Uhr ist vor dem Laden installiert und pausiert; zwischen Zustandsabfragen werden Timer und Animationen in kleinen Simulationsschritten weitergeführt. So verlängert die Antwortzeit eines langsamen CI-Runners keine Tastatureingaben. Abbruchgrenzen und tolerante Ergebnisprüfungen ersetzen feste Echtzeitpausen und exakte Frame-Positionen.

Nur `vite build --mode e2e` enthält die lesbare, unveränderliche Beobachtungsschnittstelle `window.__pixelTest`. Sie liefert Bereitschaft, Szene, Frame, Kamera und Pixels Bewegungszustand als eingefrorene Kopien, ohne Mutatoren oder Phaser-Objekte. `npm run build` entfernt den gesamten Beobachter durch Vites Modusauswertung; ein eigener Test prüft den ausgelieferten Produktionscode darauf. Der manuelle Spieltest bleibt für das Spielgefühl sinnvoll; Cross-Browser- und pixelgenaue Screenshot-Tests sind noch nicht enthalten.

# Gezielte Game-QA

Wie in The Sara Protocol begrenzen native `paths`-Filter unter `push` und `pull_request` den QA-Workflow auf relevante Änderungen. Es gibt keine eigene Änderungserkennung und keine zusätzliche Filter-Action.

Die identischen Pfadlisten in `.github/workflows/qa.yml` umfassen `src/` (einschließlich künftigem `src/game/`, `src/content/` und `src/dev/`), Assets, Tests, Werkzeuge, Root-HTML/CSS, Paket-/Lockdateien, TypeScript-/Vite-/ESLint-/Playwright-Konfiguration, npm-/Node-Konfiguration sowie Workflows, gemeinsame CI-Skripte, lokale Actions und `.githooks/`. Änderungen an Dev-Werkzeugen prüfen vorerst vollständig, da Typprüfung, Build und Produktionsisolation gemeinsam sind. Der breite Asset-Pfad wird anschließend durch negative Muster eingeschränkt: Ordner `assets/**/reference-*/**`, PNGs mit `-source` oder `-preview` im Namenssuffix, Asset-Markdown und `assets/banner.*` sind allein keine Game-QA-Eingaben. Dazu gehört die reine Sara-Referenzablage aus PR #89. Tatsächlich geladene Grafikdateien wie `assets/pixel/pixel-sheet.png` und der in Unit-Tests gelesene `pixel-idle-master.png` bleiben eingeschlossen.

Die Reihenfolge ist wesentlich: Die negativen Asset-Muster stehen **nach** `assets/**`. GitHub nimmt passende Pfade damit wieder aus. Enthält ein PR zusätzlich Spielcode, Runtime-Grafiken oder eine andere positive Eingabe, startet weiterhin die vollständige QA. Siehe [GitHubs Dokumentation zu Pfadfiltern](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#onpushpull_requestpull_request_targetpathspaths-ignore).

**Ablagevertrag:** Referenzordner, Quell-/Vorschaubilder und Banner dürfen nicht direkt aus Spielcode oder Tests geladen werden. Ein ausgewähltes Produktionsasset wird unter einem nicht ausgeschlossenen Runtime-Namen abgelegt und im Asset-Katalog eingebunden. Die Einbindung ist eine Codeänderung und löst QA aus; spätere Änderungen an der Runtime-Datei ebenfalls. Werden neue Eingabepfade eingeführt, zuerst beide Filter prüfen. Die Muster sind ein expliziter Vertrag, keine automatische Importanalyse.

Reine README-/Dokumentationsänderungen außerhalb dieser Pfade starten keine Game-QA. Neue Build-Eingaben außerhalb der Liste müssen in **beiden** Pfadlisten ergänzt werden. Änderungen an Workflows starten zusätzlich den separaten Workflow **Workflow validation** mit Actionlint, entsprechend der Vorlage aus The Sara Protocol.

Bei einem gestarteten QA-Lauf bleiben Lint, Unit-Tests, Typprüfung, Build und Audit erhalten. PRs führen vier Smoke-Szenarien aus; Main-Pushes keine Browsertests. Manuelle QA und Release-Rollout führen alle Szenarien aus, null Retries. Der abschließende Check **Playwright (Chromium)** verlangt erfolgreiche Qualität und erfolgreiche Shards; Fehler, Abbruch oder übersprungene notwendige Jobs zählen nicht als Erfolg.

## Manuelle Vollprüfung und Branch-Schutz

Unter **Actions → QA → Run workflow** einen Branch, eine Durchlaufzahl (1, 2 oder 3;
Standard 1) und das Rundenprofil `fast` oder `full` auswählen. `workflow_dispatch`
ist ungefiltert und prüft immer alle 63 Szenarien. Normale PR-/Push-Läufe verwenden
`fast`: Nur das explizite Heimkehr-Szenario nutzt 8–10 Sekunden Testdauer. `full`
prüft denselben Ablauf mit den produktiven 60–105 Sekunden; alle Assertions bleiben
gleich. Die Domain-Unit-Tests prüfen die echten Grenzen zusätzlich.

PRs prüfen die Smoke-Auswahl mit normaler Testkonfiguration, Main nur Quality. Lokal vor dem PR läuft `npm run check:pr` mit allen Szenarien. Der manuelle Release bestätigt die bereits
erfolgreiche Main-QA für exakt seinen Commit und erstellt Tag/Release. Erst der
anschließende Pages-Rollout ruft die QA mit `full_round: true` auf und übernimmt
deren getestetes Artefakt. Es gibt keinen separaten Pages-Start ohne Release.
Ein Testfehler oder fehlender notwendiger Job blockiert den Pages-Rollout;
Tag und GitHub Release existieren zu diesem Zeitpunkt bereits. Ein echter Release-/Pages-Rollout wird nur ausdrücklich gestartet.

Die pfadgefilterten Checks dürfen nicht als für **jeden** PR erforderliche Statuschecks konfiguriert werden: Ein komplett ausgelassener Workflow liefert keinen erfolgreichen Check; reine Dokumentations-PRs könnten dadurch blockiert bleiben. Rico übernimmt die Branch-Protection-Einstellungen. Falls künftig zwingend ein erfolgreicher Gesamtcheck für jeden PR erforderlich wird, muss das Workflow-Modell entsprechend angepasst werden.

GitHub verwendet bei PRs einen Drei-Punkt-Vergleich, bei bestehenden Push-Branches einen Zwei-Punkt-Vergleich. Die native Pfaderkennung hat dokumentierte Grenzen: Sie wertet höchstens die ersten 300 geänderten Dateien aus; bei mehr als 1.000 Commits oder einem Diff-Timeout läuft der Workflow unabhängig vom Filter. Große Änderungen bei Bedarf ausdrücklich manuell prüfen.

Der [Pages-Rollout nach Release-Erstellung](deployment.md) prüft den **exakten zu veröffentlichenden Commit** ungefiltert mit vollständiger QA, Runtime-Audit und allen Browser-Szenarien. Die dabei getesteten Produktionsdateien unter `/pixels-world/` werden unverändert veröffentlicht.

Quelle: [GitHub-Dokumentation zu Pfadfiltern, Vergleichen und ausgelassenen Checks](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#onpushpull_requestpull_request_targetpathspaths-ignore).

## Testszenarien in der Actions Summary

Die Unit- und Browserjobs zeigen nach ihren Testschritten alle gemeldeten Szenarien mit Statussymbolen direkt in der **Job Summary**. Im abschließenden Job **Playwright (Chromium)** stehen zusätzlich die gemeinsame Liste und explizite Passed-/Failed-/Skipped-Zahlen. Die Statussymbole stehen für Passed, Failed und Skipped. Die Reports werden dafür automatisch als Artefakte zwischen den Jobs übertragen; zum Lesen ist kein Download nötig.

Node erzeugt über `npm run test:unit:ci` neben der Terminalausgabe einen TAP-Report (`test-reports/unit.tap`). Playwright erzeugt zusätzlich zu List/HTML einen JUnit-Report (`test-reports/playwright.xml`). Die gepflegte [test-summary/action](https://github.com/test-summary/action) verarbeitet beide Formate; ihre Version ist als Commit gepinnt. Nodes JUnit-Ausgabe wird bewusst nicht verwendet: Die geprüfte Action übersieht die direkt unter `testsuites` liegenden Testfälle von Node 22. Der TAP-Reporter wird korrekt gelesen.

Die Gesamtübersicht zählt **Ausführungen**: aktuell 98 Unit-Tests plus 4 Browser-Szenarien, also 102 Ergebnisse bei PR-CI. Main-CI zählt 98 Unit-Tests und kennzeichnet Browsertests als absichtlich nicht geplant. Vollständige manuelle QA und Release-Rollout zählen 98 plus 63, also 161 Ergebnisse. Bei manuell gewählten zwei Durchläufen sind es 224, bei drei Durchläufen 287. Beide Rundenprofile haben dieselbe Szenarioanzahl; das gewählte Profil ist in Job Summary und Rundentest-Annotation erkennbar. Wiederholungen erscheinen als eigene Zeilen mit demselben Szenarionamen. Es gibt weiterhin null Retries. Jeder Report fließt genau einmal in die Gesamtsumme ein; die zusätzlichen Job-Ansichten werden nicht nochmals mitgezählt.

Die Darstellung läuft mit `always()` auch nach Testfehlern. Reporting- und Downloadfehler werden als Hinweise angezeigt, während die ursprünglichen Testschritte und der immer ausgeführte QA-Gesamtcheck ihren Fehlerstatus behalten. Nur die rein darstellenden Summary-/Transfer-Schritte dürfen mit Fehlern fortfahren. Je nach Profil werden ein (Main), zwei (PR-Smoke) oder fünf (vollständige QA) erwartete Reports auf Vorhandensein geprüft; fehlende Reports sind ausdrücklich als unvollständig markiert. Nach einem harten Runner-Abbruch können nur vorhandene Teilergebnisse angezeigt werden. Aus fehlenden Reports wird kein erfolgreicher Testlauf abgeleitet.

Bei Docs-only startet die pfadgefilterte QA nicht und erzeugt entsprechend keine Testszenarien. Der separate Release-Workflow verwendet denselben verpflichtenden Runtime-Audit.

Lokal: `mkdir -p test-reports && npm run test:unit:ci` erzeugt den TAP-Report; `npm run test:e2e` erzeugt zusätzlich JUnit. Generierte Reports sind ignoriert und werden nicht eingecheckt.

## Testaufteilung und Typprüfung

Die beiden Browser-Jobs der QA laufen im offiziellen Microsoft-Image
`mcr.microsoft.com/playwright:v1.64.1-noble`, zusätzlich durch den Manifest-Digest
`sha256:2f05f8a734509a7b3f26a912639488ee08f58a7b292d14d62271bcff9038768f`
festgehalten. Chromium und seine Systembibliotheken sind dort vorinstalliert;
`playwright install --with-deps` entfällt in diesen Jobs. Node 22 und die npm-Pakete
werden weiterhin über die bestehenden Schritte bereitgestellt. Die zusätzliche
Versionsdimension der Matrix hat genau einen Wert; es bleiben zwei Shards.

Vor dem Browserlauf muss die tatsächlich installierte Playwright-Version zur
Image-Version passen. Bei einem Playwright-Update daher Lockfile, Matrix-Version
und Image-Digest gemeinsam aktualisieren und alle vier Browser-Shards prüfen.
`--init --ipc=host` folgt der empfohlenen Chromium-Containerkonfiguration. Es gibt
keine eigene Image-Build-/Registry-Pipeline. Das Image muss weiterhin geladen werden;
ein schnellerer Gesamtjob ist zu messen und wird nicht pauschal garantiert.

Pages installiert keinen Browser mehr: Die vollständige Browserprüfung läuft im
Playwright-Container der wiederverwendbaren QA. Shard 1 übergibt bei `full` den
getesteten Produktionsbuild als `qa-pages-dist-<SHA>`; der Quality-Job und alle vier
Shards müssen erfolgreich sein. Pages übernimmt nur dieses Artefakt aus demselben
Workflow-Lauf, ohne Neubau. Der GitHub-Host stellt weiterhin `gh` und `jq` für die
unveränderten Release-Identitätsprüfungen bereit. Details und Messwerte stehen in
[der CI-Prüfstrategie](ci-strategy.md).

Grundlage: [Playwright-Docker-Image](https://playwright.dev/docs/docker) und
[Container-Jobs in der Playwright-CI-Anleitung](https://playwright.dev/docs/ci#via-containers).

Die 63 Szenarien sind nach Inhalt auf Spec-Dateien verteilt, mit gemeinsamer Clock-/Gesundheits-Fixture und Eingabehelfern. [Lokale Auswahl und Gruppen](../tests/e2e/README.md). `fullyParallel` und die vier Shards bei vollständigen Läufen bleiben erhalten; die Gruppen erzeugen keine weiteren CI-Jobs. Zeitverteilung anhand echter Läufe beurteilen.

Der Qualitätsjob verwendet die Typprüfung in `npm run build` statt eines zusätzlichen identischen Aufrufs davor. In der Playwright-Vorbereitung prüft `build:e2e` die Typen; die zweite Produktionsvorschau baut deshalb direkt mit Vite. Playwright verlangt beide erfolgreichen Serverstarts. Die eigenständig nutzbaren Befehle `build`, `build:e2e` und `qa` bleiben typgeprüft.

## Abhängigkeiten und Release-Gate

Die gemeinsame lokale Action `.github/actions/npm-audit` läuft im Qualityjob. Die reguläre Main-QA prüft sie vor der Release-Erstellung; die vollständige QA wiederholt sie nach Release-Erstellung vor dem Pages-Rollout. `npm audit --omit=dev --audit-level=high` ist verpflichtend: Runtime high/critical sowie Audit-/Registry-Fehler schlagen fehl. Der vollständige Audit inklusive Dev-Abhängigkeiten läuft sichtbar, aber zunächst nicht blockierend. Beide Originalberichte stehen in Job-Log und Summary, auch bei Auditfehlern. Der Audit verändert keine Abhängigkeiten und führt kein `audit fix` aus.

`--audit-level` ändert die Fehlerschwelle, nicht den Inhalt des Berichts. Moderate Findings werden deshalb weiterhin angezeigt. Findings nach betroffenem Runtime-/Tooling-Pfad und tatsächlicher Nutzung bewerten, konkrete Folgeissues anlegen und kontrollierte Updates als getestete PRs liefern. Keine pauschalen Ausnahmen und keine ungeprüften Force-Upgrades. Die bestehenden Runtime-Findings werden nicht durch einen erfolgreichen Gesamtbericht maskiert.

Aktueller Tooling-Befund: [moderates minimatch-Advisory im ESLint-Baum (#66)](https://github.com/Skanky0815/pixels-world/issues/66). Der Runtime-Audit meldet derzeit keine Findings.

## Mobile Touch-Abnahme (#54, erster Schritt)

Automatisiert: Chromium/Playwright 1.64.1, Viewports 390×844 und 844×390,
Touch-/Pointer-Eingaben inklusive Mehrfinger-Sprung, Klettern, Abbruch, Fokus,
Rotation, Neustart erst am Ergebnis und komplette Versöhnung. Desktop-Tastatur-Suite bleibt Teil
der lokalen Vollprüfung. Richtungspaare neutralisieren sich nach gehaltenen
Aktionen, nicht nach Anzahl der Finger. Frische Quellenimpulse werden pro Aktion
und Spielframe zusammengefasst; reine Wiederholung einer gehaltenen Taste erzeugt
keine neue Flanke. Touch-Abbruch verwirft noch nicht konsumierte Touch-Flanken.

Erster Praxistest auf iPhone/Safari positiv bestätigt. Die vollständige
Hardware-Abnahme bleibt offen: Safari auf iPhone/iPad sowie Chrome auf Android.
Dort dieselben Abläufe mit realen Fingern, Geräte-Rotation, App-/Tabwechsel und
den erst am Ergebnis sichtbaren Button „Neue Runde“ prüfen. Keine solche Prüfung wird durch Chromium-Emulation
ersetzt. Darstellung von HUD, Dialogen und Minispiel auf kleinen Displays folgt unten (#108);
Touch-Buttons liegen bereits außerhalb des Canvas und verwenden Safe-Area-Abstände.

## Responsives Layout (#108)

`responsive.spec.ts` prüft Handheld-Geometrie bei 667×375, 844×390 und
1024×768 CSS-Pixeln: Richtungstasten links, unverzerrtes Zimmer mittig,
Aktionen rechts und alle drei Bereiche innerhalb des sichtbaren Viewports.
320×568 prüft die separat scrollbar bleibende Einführung; 390×844 → 844×390
prüft Zustandserhalt und fortgesetzte Eingabe nach Rotation. Die komplette
Touch-Heimkehr in `touch.spec.ts` prüft im Querformat lesbare Anleitung,
Pfeilkachel, Zeitbalken und Ergebnis. Desktop-Szenarien bleiben unverändert.

Canvas und Raum behalten ihr Seitenverhältnis, `pixelArt` und
`image-rendering: pixelated` verhindern geglättete Interpolation. Bei kleinen
Displays wird bewusst nicht auf ganzzahlige Vergrößerungen bestanden: die
ganze Spielfläche muss hineinpassen. Dialoge verwenden dann 14 CSS-Pixel, der seitliche Status 13 CSS-Pixel
statt proportional geschrumpfter Canvas-Schrift. Die Textansicht liest
ausschließlich die bestehenden Szenenansichten, keine E2E-Beobachter.
Es gibt kein separates Einstellungsmenü; Fokusverlust pausiert weiterhin.

Manuell auf iPhone/Safari und Android/Chrome ergänzend prüfen: Browserleisten
ein-/ausblenden, Safe Areas, zwei Finger, Rotation während Bewegung und Dialog,
Einführung bis unten lesen, vollständige Runde und „Neue Runde“ am Ergebnis. Das neue Layout
ist zunächst in Chromium emuliert geprüft; Ricos positives Hardwarefeedback
bezieht sich auf #54 vor dieser Layoutänderung. Unterhalb 667×375 im Querformat
können Texte und Footer zusätzlich Scrollen benötigen; Hochformat bleibt
verfügbar. Längere Einführung/Dialoge scrollen bewusst innerhalb ihrer Box.

Während der laufenden Touch-Runde bleibt der Neustart-Button verborgen.
Erst am Ergebnis wird „Neue Runde“ angeboten, danach ist er wieder verborgen.
Der Tastaturkurzbefehl R bleibt für Desktop unverändert.

Querformat-Review: Titel über dem Steuerkreuz und kompakter Status über der
Aktionstaste statt voller Infobox; der Zieltext bleibt in der Einführung und
im Hochformat. Die Aktion heißt anfangs „Weiter“, im Spiel „Sprung“ und
bei Dialogen „Weiter“. Am Ergebnis erscheint ausschließlich „Neue Runde“.

Die Querformat-Prüfung verlangt mindestens 16 CSS-Pixel Abstand zwischen
Steuerungsgruppen und Zimmer. Der mobile Footer verwendet gedeckte Linkfarben
und kleinere Metadaten; Tastatur-Fokus bleibt deutlich sichtbar.

Im kompakten Touch-Layout sind die Canvas-Textpanels für Heimkehr, Versöhnung
und Ergebnis ausgeblendet. Nur die DOM-Textbox ist sichtbar; Schauspieler und
Zuneigungsanimationen bleiben im Raum. Beim Wechsel auf Desktop erscheinen
die Canvas-Panels wieder, ohne die Runde neu zu starten.

## Release-Link im Footer (#131)

Die normale Suite prüft Versionsanzeige und fehlenden Release-Link im
E2E-/Vorschaubuild. Mit `PIXELS_RELEASE_TAG=v<package-Version> npm run test:e2e
-- tests/e2e/footer.spec.ts` wird zusätzlich der Release-Kontext geprüft:
Der E2E-Build bleibt unverlinkt, der Produktionsbuild zeigt exakt den Tag.
Unit-Tests prüfen Buildmodus, Fallback und Abbruch bei abweichenden Metadaten.
Der tatsächliche Pages-Rollout ist beim nächsten Release gegenzuprüfen.

## Sprachen (#105)

Deutsch ist Standard. Die Auswahl im Kopfbereich wechselt zwischen Deutsch und
Englisch, ohne die Szene neu zu starten. Nur die Sprachwahl wird unter
`pixels-world.language` gespeichert; bei fehlendem, ungültigem oder gesperrtem
Speicher bleibt Deutsch der Startwert. Eine gewählte Sprache funktioniert auch
ohne Speicherzugriff für die aktuelle Sitzung. Die Datenschutzerklärung
beschreibt diese Einstellung.

`localization.spec.ts` prüft Einführung, Persistenz, blockierten Speicher und
eine komplette englische Touch-Runde mit Sprachwechsel während Heimkehr und
Versöhnung. Unit-Tests prüfen Katalog-/Platzhalterparität, Fallback, Meldung
fehlender Übersetzungen und kanonische Spieldaten. Die bestehende deutsche
Suite bleibt vollständig erhalten. Hardware-Prüfung beider Sprachen auf
iPhone/Safari und Android bleibt zusätzlich sinnvoll.
