# Beiträge zu Pixel’s World

## Projektsprache und Commits

Deutsch ist die Standardsprache für Projektdokumentation, neue Issue-Titel und -Beschreibungen, Akzeptanzkriterien, PR-Titel und -Beschreibungen sowie die Zusammenarbeit auf GitHub. Historische Kommentare und Diskussionen bleiben unverändert.

`AGENTS.md` bleibt Englisch. Code, Bezeichner, Dateipfade, CLI-Befehle und Konfigurationsschlüssel behalten ihre technische Schreibweise. Commit-Nachrichten dürfen Englisch sein. Wir verwenden das bestehende Conventional-Commits-Muster: `feat:`, `fix:`, `docs:`, `ci:`, `test:` oder `chore:`, bei Bedarf mit Scope, etwa `fix(physics): restore gravity after climbing`.

Git-Identitäten müssen wahrheitsgemäß bleiben; standardmäßig keine Attribution-Trailer wie `AI-assisted-by` ergänzen. Keine Secrets oder echten Gesprächsprotokolle committen.

Normale PRs verwenden die [PR-Vorlage](.github/pull_request_template.md), einschließlich
des einzelnen englischen Commit-Overrides. Der verbindliche Vertrag für Release Note
und Squash-Merge steht unter [Release Notes](CONTRIBUTING.md#release-notes-und-squash-merge).

## Änderungen vorbereiten

[README](README.md) und [Arbeitsregeln](AGENTS.md) lesen. Änderungen auf einem eigenen Branch entwickeln und überschaubar halten. Bewährte Werkzeuge bevorzugen; wesentliche Entscheidungen mit Alternativen und Grenzen nachvollziehbar dokumentieren. Bedeutende langfristige Architekturentscheidungen erhalten bei Bedarf einen Eintrag unter `docs/adr/`.

Jeder Implementierungs-PR verweist auf sein Issue: `Refs #N` für Teilschritte, `Closes #N` nur bei vollständiger Umsetzung mit Merge nach `main`. Zusätzlich den direkten Issue-Link angeben. PR-Beschreibungen erklären das konkrete Problem, das resultierende Verhalten und die tatsächlich ausgeführte Validierung.

## Aufgaben abgrenzen

| Auftrag                | Vorgehen und Abschluss                                                                                                                                                                                                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Analyse / Issueplanung | Relevante Quellen und vorhandene Issues lesen, Befunde von Vermutungen trennen, konkrete Aufgaben erstellen oder ergänzen. Zusammengehörige Leseabfragen bündeln und die gespeicherten Änderungen einmal abschließend prüfen; ohne Codeänderung kein vollständiger Testlauf. |
| Dokumentation          | Die zuständige Anleitung aktualisieren; Sprache, Aussagen, Links und Format prüfen. Bereits bestätigte Fakten weiterverwenden, solange sich ihre Grundlage nicht geändert hat.                                                                                               |
| Code / Tooling         | Einen nachvollziehbaren Verhaltensschritt umsetzen, gezielt prüfen und auf dem finalen Stand die vollständige Abschlussprüfung ausführen. Betroffene Dokumentation im selben PR aktualisieren.                                                                               |

Implementierungs-Issues beschreiben das gewünschte Verhalten, die betroffenen Bereiche
und wenige überprüfbare Abnahmekriterien. Die vorhandenen [Bug-](.github/ISSUE_TEMPLATE/bug_report.yml)
und [Featurevorlagen](.github/ISSUE_TEMPLATE/feature_request.yml) unterstützen diesen Einstieg;
technische Umsetzungsschritte und Abhängigkeiten bei der Triage ergänzen. Große Umbauten
in einzeln funktionierende, reviewbare Schritte teilen. `Refs` kennzeichnet Teilschritte;
das übergeordnete Issue erst bei vollständiger Abnahme schließen. Neue Objekte benötigen
zusätzlich den [Wechselwirkungsvertrag](game/play/content/README.md#neue-objekte-gegenseitige-einwirkungen-planen).

## Prüfen und Review

Prüfumfang, gezielte Aufrufe und zusätzliche manuelle Prüfungen stehen verbindlich
[unten](#qualität-prüfen). Während der Umsetzung passende Einzelprüfungen
verwenden; der finale vollständige Lauf enthält bereits QA und Browserprüfungen.
Tatsächliche Ergebnisse und verbleibende Lücken kurz im PR nennen.

Sara übernimmt ihre Issues und PRs als `Sara-Pixel42`; fertige PRs gehen zur Review an `Skanky0815`, sofern Rico niemand anderen bestimmt. Issue, Branch und PR nachvollziehbar verknüpfen. Bestehende Branches nicht für eine Verknüpfung löschen oder neu erstellen; bei fehlender API-Unterstützung die Grenze und den direkten Branch-Link im Issue dokumentieren. Review- und Branch-Schutzregeln bleiben verbindlich.

Die Konventionen sind aus [The Sara Protocol](https://github.com/Skanky0815/the-sara-protocol/blob/main/CONTRIBUTING.md) übernommen und an Phaser/TypeScript angepasst.

## Qualität prüfen

Maßgeblich für Befehle und CI-Umfang sind [package.json](package.json),
[qa.yml](.github/workflows/qa.yml), [Pfadklassifikation](tools/qa-selection.ts),
[Testprofile](tools/qa-profiles.ts) und [Playwright-Konfiguration](playwright.config.ts).
Eine zweite Liste der Fälle, Matrixgruppen, Worker oder Artefaktfristen wird hier
nicht gepflegt. Workflowänderungen zusätzlich mit Actionlint prüfen.

### Lokal prüfen

Nach Checkout beziehungsweise geänderten Abhängigkeiten gemäß README installieren.
Für Browserprüfungen zusätzlich Chromium vorbereiten:

```sh
npx playwright install chromium
```

Auf Linux kann `npx playwright install --with-deps chromium` erforderlich sein.
Für Code-/Tooling-PRs den von Rico lokal abgenommenen finalen Stand unmittelbar
vor dem Push vollständig mit `npm run check:pr` prüfen, vorzugsweise über den
nativen Hook. Keine vollständige Suite vor der lokalen Abnahme und kein doppelter
QA-/E2E-Vorlauf. Nach Änderungen, Fehlern oder offenen Befunden passend erneut
prüfen; alte Ergebnisse sind kein Nachweis für einen geänderten Stand.
Bei Bewegung/Physik kommt der [manuelle Spieltest](#manueller-spieltest) hinzu.

Reine Dokumentation benötigt Sprache-, Fakten-, Link- und Formatprüfung, reine
Analyse ohne Dateiänderung keinen Testlauf. Nur bearbeitete Dateien formatieren;
Asset-Markdown ist vom normalen Prettier-Aufruf ausgeschlossen und kann bewusst
mit `--ignore-path /dev/null` geprüft werden. Der eingerichtete native Hook bleibt
auch für Doku-Pushes aktiv; siehe [Hook-Vertrag](#lokale-prüfung-vor-push).
Für Code-/Tooling-Veröffentlichung per GitHub-API ohne Hook die vollständige
Abschlussprüfung ausdrücklich vorher ausführen.

### Gezielt prüfen

Während der Umsetzung die nächstliegende Prüfung und betroffene Verbraucher wählen.
Specs und Assertions unter [tests](tests) sind das Testinventar. Einzelne Unit-Dateien
unmittelbar an Node übergeben; `test:unit` enthält bereits den gesamten Glob:

```sh
node --experimental-strip-types --test tests/unit/input-state.test.ts
npm run test:e2e -- tests/e2e/play/couch.spec.ts --grep 'Sofa:'
```

Für Anwendungsschnittstellen den betroffenen Integrationstest einbeziehen;
Importregeln lassen sich mit `npm run check:imports` und
`node --test tests/ci/import-boundaries.test.mjs` gesondert prüfen.
Die Bereichs-, Debug-, Vollrunden- und Reportskripte stehen in `package.json`.
Ein gewähltes Profil kann Fälle filtern; Profil und tatsächlich gesammelte Fälle
abgleichen. Produktionszeiten und bewusste Stabilitätswiederholungen sind über
`test:e2e:full` beziehungsweise `--repeat-each` möglich. Retries bleiben ausgeschaltet.

Playwright startet eigene Server. Ports und Wiederverwendung stehen in
[playwright.config.ts](playwright.config.ts); fremde Server nicht übernehmen und
die benötigten Ports freihalten. Der persönliche Dev-Server bleibt unabhängig.
Zusätzliches Tablet-WebKit benötigt `npx playwright install webkit`, danach
`npm run test:e2e:tablet:webkit`. Emulation ersetzt keine echte Geräteprüfung.
Browser-/Clock-/Beobachterregeln: [arc42](docs/arc42/README.md#browser-prüfvertrag).

### Bildreferenzen und Gegenproben

Referenzbilder liegen beim Spec. Fehlende oder abweichende Referenzen werden im
normalen Lauf nicht automatisch akzeptiert. Bei Browser-Updates macOS und Linux
visuell prüfen; Linux-Referenzen mit dem im [QA-Workflow](.github/workflows/qa.yml)
festgeschriebenen Image auf `linux/amd64` erzeugen. Beide neuen Bilder und ihren
Diff vor dem Commit ansehen:

```sh
npm run test:e2e -- tests/e2e/play/round.spec.ts tests/e2e/play/ball-play.spec.ts --grep 'Der Rundentimer|Ballfund:' --update-snapshots
E2E_FULL_ROUND=1 npm run test:e2e -- tests/e2e/play/round.spec.ts tests/e2e/play/ball-play.spec.ts --grep 'Der Rundentimer|Ballfund:' --repeat-each=3
```

Die Gegenproben müssen am Bildvergleich scheitern; niemals mit einer
Referenzaktualisierung kombinieren. Ihre erlaubte Instrumentierung steht in
[arc42](docs/arc42/README.md#browser-prüfvertrag), Umsetzung und Toleranzen in
[character-visuals.ts](tests/e2e/play/character-visuals.ts):

```sh
E2E_VISUAL_FAULT=missing-sara npm run test:e2e -- tests/e2e/play/round.spec.ts --grep 'Der Rundentimer'
E2E_VISUAL_FAULT=pixel-size npm run test:e2e -- tests/e2e/play/ball-play.spec.ts --grep 'Ballfund:'
```

### Ergebnisse auswerten

Lokal liegen ignorierte Reports unter `test-reports/`, `test-results/` und
`playwright-report/`. Den HTML-Bericht mit `npm run test:e2e:report` öffnen;
für aufgezeichnete Abläufe `npx playwright show-trace <pfad-zur-trace.zip>` verwenden.
Aktuelle Zahlen, Laufzeiten, Screenshots und Diffs gehören in Actions/PRs.
Fehlende Reports sind kein Erfolg; Job-Ergebnis und geplante Artefakte gemeinsam prüfen.

Die [Audit-Action](.github/actions/npm-audit/action.yml) ist maßgeblich für
Abhängigkeits-Gates; keine pauschalen Advisory-Ausnahmen oder ungeprüften
`audit fix --force`-Upgrades. Bei Änderung transitiver Overrides Aufrufer,
Lint-Dateiauswahl und Audit erneut prüfen. Versionsstände und Findings nicht
zusätzlich in Markdown spiegeln.

### Manueller Spieltest

Automatisierte Fälle nicht als zweite Schrittfolge abschreiben. Bei Änderungen
die betroffenen Abläufe anhand der [Spiel-Specs](tests/e2e/play) und
[Kontaktaufbauten](tests/e2e/support/fixtures/playground-recipes.json) wählen;
für vollständige Küchenrunden die [Runden-Rezepte](game/play/content/round-recipes.json)
über die [Spielwiese](#objektkontakte-und-spielwiese) laden. Bei Bewegung/Physik mindestens:

- Öffentliche Räume in beiden Orientierungen auf echtem Handy/Tablet prüfen;
  auf Touch-Laptops zusätzlich Maus/Tastatur. Mehrfinger-Eingaben, Rotation,
  Browserleisten, Notch und Home-Leiste dürfen keine Bedienflächen verdecken.
- Hauptziel auf den betroffenen Schwierigkeitsgraden ohne Schaden erreichen;
  Auflagen, Sprünge, Raumgrenzen und Rückweg zu Sara prüfen. Ballspiel/Fressen,
  Heimkehr, erfolgreiche und gescheiterte Versöhnung bis zur Auswertung bedienen.
- Betroffene Kletterflächen, Objektkontakte und Ketten testen, auch gleiche Typen.
  Fremdtreffer dürfen keine besondere Pixel-Aktion starten. Pause/Fokusverlust
  und Neustart mitten in Fall, Klettern oder Innenbesuch dürfen keine alten
  Eingaben, nachgeholte Zeit oder doppelten Schaden hinterlassen.
- DE/EN, lange Texte, reduzierte Bewegung und schmal/breit während einer Runde
  wechseln. Standardkamera und `?camera=room` vergleichen; Dialoge/Banner und
  alle Menü-/Albumaktionen müssen lesbar, scrollbar und erreichbar bleiben.
- Vormerkungen bleiben bis zum erfolgreichen Abschluss geheim. Scheitern,
  Neustart/Reload und blockierten Speicher prüfen; bestätigte Funde bleiben
  erhalten. Friedlicher Napffund darf Album-/Raumfortschritt bestätigen, aber
  keinen Versöhnungszähler erhöhen. Album-Reset nur nach ausdrücklicher Bestätigung.
- Ladefehler und langsame Module/Assets im Browser-Netzwerkpanel prüfen: echter
  Fortschritt, keine frühen Spielaktionen und erfolgreicher vollständiger
  Neuladeversuch nach Freigabe. Gehaltene Tasten dürfen keine Startfreigabe nachholen.

Für hörbare Unterschiede und echte Audiofreigabe zusätzlich die
[Hörprobe](assets/audio/README.md#hörprobe-und-lebensdauer) ausführen.
Vor öffentlichem Release den Produktions-/Pages-Stand und dessen Versionslink,
Rechtsseiten und Ressourcen prüfen; E2E-Observer und DEV-Aktionen dürfen nicht vorhanden sein.
Ein für einen Footer-Test gesetzter `PIXELS_RELEASE_TAG` ist kein Deployment-Nachweis.

### Updates auf echten Geräten prüfen

Auf iOS/Safari und Android die veröffentlichte App installieren, eine Runde
beginnen und nach einem Folgerelease zurückkehren. Erst **Später**, dann bewusst
**Jetzt aktualisieren** wählen; Album/Einstellungen, zweiten Tab und Offline→Online
prüfen. Ein anderer Tab darf keine eigene Neustartfreigabe ersetzen. Zusätzlich
Offline-Spiel über die Optionen vorbereiten und die App ohne Verbindung erneut öffnen.
Automatisierte A→B-Prüfungen verwenden echte Browserzeit und Service Worker statt
der pausierten Gameplay-Uhr; Quelle: [pwa-update.spec.ts](tests/e2e/integration/pwa-update.spec.ts).

## Lokale Prüfung vor Push

Die [QA-Voraussetzungen](#lokal-prüfen) einmalig vorbereiten, dann
`npm run hooks:install` ausführen. Der versionierte native `pre-push`-Hook startet
`npm run check:pr` und blockiert bei Fehlern. Kleine Commits bleiben ohne vollständigen
Testlauf möglich. Der Installer überschreibt weder einen anderen `core.hooksPath`
noch einen bestehenden nativen Hook. Kein automatisches Verändern der Git-Konfiguration
bei `npm ci`.

Der Hook prüft den aktuellen HEAD mit sauberem getracktem Arbeitsstand; Pushes anderer Commits werden abgewiesen, reine Löschungen benötigen keine Tests. Ungetrackte Dateien dürfen keine fehlenden Build-Eingaben des Commits ersetzen. Hooks sind eine lokale Hilfe und können umgangen werden. Bei Code-/Toolingänderungen über die GitHub-API läuft kein lokaler Git-Hook: die vollständige Abschlussprüfung ausdrücklich vor Veröffentlichung ausführen. Keine alten Testergebnisse als frischen Nachweis verwenden.

Der Hook läuft weiterhin bei jedem passenden Push; er besitzt keinen Ergebnis-Cache.
Ein separater vollständiger Vorlauf ist dafür nicht erforderlich. Auch Dokumentations-
Pushes lösen einen installierten Hook aus; diese Dokumentationsänderung ändert dessen
Verhalten nicht. Die leichtgewichtige Dokumentationsprüfung gilt für den fachlich
nötigen Prüfumfang, nicht als Anweisung zum Umgehen eines installierten Hooks.
CI-Profile und Runnerumfang stehen im [QA-Workflow](.github/workflows/qa.yml)
und der [gemeinsamen Profilauswahl](tools/qa-profiles.ts).

Vor dem Start der QA entfernt der Hook die von Git geerbten lokalen
Repositoryvariablen. So verwenden Git-Kommandos in isolierten Test-Repositories
deren eigene Metadaten und verändern weder Branch noch Index des Arbeits-Repositories.

## Lokal entwickeln

Voraussetzungen und erster Start stehen im [README](README.md#lokal-starten),
alle verfügbaren Skripte in [package.json](package.json). HTML-Quellen unter `game/`
bearbeiten; Zuordnung, Importgrenzen und öffentliche URLs erklärt
[arc42](docs/arc42/README.md#5-bausteinsicht). Keine zweiten HTML-Kopien im Root anlegen.

Produktionsbuild lokal ansehen:

```sh
npm run build
npm run preview
```

Vite nennt die lokale Adresse. Zum Testen auf einem Handy im selben Netz:

```sh
npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
```

Netzwerkadresse von Vite verwenden; DHCP, Firewall und Gastnetz können den Zugang
beeinflussen. Zusätzliche Hosts gezielt über `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS`
freigeben. Ein veröffentlichtes Release-ZIP in einen eigenen Ordner entpacken
und dort beispielsweise mit installiertem Python 3 ausliefern:

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Landingpage unter `/`, Spiel unter `/play.html` öffnen, keine `file://`-URLs verwenden.
Für Offline-Prüfungen den Produktionsbuild verwenden und die Offline-Kopie in den
Spieloptionen ausdrücklich vorbereiten; Prüfabläufe stehen [unten](#updates-auf-echten-geräten-prüfen).

### DEV-Vorschauen

Die eigenständigen Vorschauseiten gibt es nur im Dev-Server; Produktions- und
E2E-Builds enthalten diese Diagnoseoberflächen nicht. Der Raumparameter im Spiel
funktioniert in DEV/E2E, die Ladescreen-Vorschau nur in DEV. Menü und normale Eingabe bleiben
unabhängig davon prüfbar; die versteckte Taste R startet nach Spielbeginn neu.

| Einstieg                       | Verwendung                                                                                                           |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `/play.html?room=cozy-remix`   | Wohnzimmer-Inhaltsvariante; in Produktion ignoriert                                                                  |
| `/animation-compare.html`      | Animationen, gemeinsame Fußanker, Größen, Pause und Einzelschritt; auch über **DEV · Animationen** im Footer         |
| `/ball-play-preview.html`      | Ballspiel, Zeitregler, Nahansicht, Pause und reduzierte Bewegung; gemeinsames Zeitprofil mit dem Spiel               |
| `/portrait-preview.html`       | DE/EN, lange Texte, Desktop-/Handygrößen und fehlende Porträts vergleichen                                           |
| `/charm-preview.html`          | Annäherung, nächste Spieleraktion, Reset, Pause und ruhige Posen unabhängig von der Runde abstimmen                  |
| `/play.html?loading-preview=1` | Reale Ladeansicht mit Fortschrittsregler, Fehleransicht und reduzierter Bewegung; **Zum Spiel** beendet die Vorschau |

Assetquellen und Exporte: [Pixel](assets/pixel/README.md), [Sara](assets/sara/README.md),
[Charme](assets/pixel/charm-v1/README.md), [Dialogporträts](assets/dialogue-portraits/README.md),
[Team](assets/team/README.md) und [Website-Aufnahmen/Metadaten](assets/landing/README.md).

### Objektkontakte und Spielwiese

Der Spiel-Footer zeigt ausschließlich im Dev-Modus **DEV · Playground**.
Auf der DEV-Seite führt ebenfalls **Playground** zu `/interactable-playground.html`.
**Testart** wechselt zwischen Einzelobjekt und eigenem Aufbau. Als Grundaufbauten
stehen ein leeres Zimmer, Wohnzimmer, Wohnzimmervariante und Küchenvorschau bereit.
Auf breiten Bildschirmen steht die Diagnose neben der höchstens 800 Pixel breiten
Szene; auf schmalen Geräten darunter. Weltmaße und Physik bleiben unverändert.
`?object=cozy-couch` oder `?scenario=empty` wählen den Einstieg. Die ehemaligen
Labor-IDs sind auch aus diesem Auswahlkatalog entfernt.

Unter **Objekte platzieren / bearbeiten** Variante und Auflage beziehungsweise
Wandposition wählen und **Spawnen** betätigen. Mehrere Instanzen derselben Variante
sind erlaubt. Über **Diagnoseziel** ein Objekt auswählen, seine Startposition
ändern und **Auswahl verschieben** verwenden oder es mit **Auswahl entfernen**
entfernen. Feste Raummöbel werden nicht als lose Objekte bearbeitet. Ungültige
Positionen oder noch benötigte Auflagen werden abgewiesen; der gültige Aufbau bleibt
bestehen. Jede erfolgreiche Änderung beginnt einen neuen Versuch mit unverändertem
Aufbau, frischem Pixel und zurückgesetzten Schäden/Punkten.

**Aufbau laden / kopieren** exportiert die Startkonfiguration in ein Textfeld und
lädt sie wieder. Import und manuelle Aktionen verwenden denselben validierten
Spawnpfad in `playground-layout.ts`; es gibt keine Testsetter. Die automatisierten
Kontaktaufbauten liegen ausschließlich in den Testdaten und werden über diese
öffentliche Bedienung geladen. Eigenen Aufbau vor einem Grundaufbauwechsel bei
Bedarf kopieren; es gibt keine automatische Speicherung.

Pixel lässt sich ohne Rundenstart normal steuern; Sofa/Pflanze reagieren nach
kurzem Stillstand, der Vorhang beim Klettern/Rutschen und die Vase beim Schieben
vom Testregal. Touch-Geräte erhalten dieselbe Eingabe wie im Spiel.

**Diagnoseziel** wählt ein Objekt oder Möbelstück, ohne die Szene neu zu starten.
Die Live-Diagnose zeigt Typ, Zustand, Chaos-Punkte und die letzten Chaos-Ereignisse.
Die Detailansicht enthält losgelöste Objekt-/Pixelwerte, Kontaktherkunft,
Ressourcenanzahlen und aus den Schadensereignissen ermittelte Funde. Diese
Funddiagnose ist kein Albumfortschritt.
**Szene zurücksetzen**, Debug-R und Objektwechsel entsorgen den alten Durchlauf
und setzen Pixel, Schaden und Punkte zurück; dasselbe gilt für Szenariowechsel.
Fokusverlust pausiert die Szene.
Es gibt keine Heimkehr, Rundenuhr oder gespeicherten Ergebnisse.
**Mit vollständiger Runde im Spiel testen** erscheint nur für die expliziten
Runden-Fixtures `kitchen-preview`, `fridge-visit` und `fridge-incoming`. Der Link erscheint nur für deren unveränderten Aufbau und
öffnet `/play.html?scenario=…` im DEV-/E2E-Betrieb. Andere Kontaktszenarien haben
keinen Zugang zum Rundenablauf; Produktionsbuilds ignorieren diesen Parameter.
Reine Objekt- und Kontakttests laufen über die Spielwiese, während die getrennten
`*-round.spec.ts` Rundenuhr, Heimkehr, Dialoge und Albumabschluss im Spiel prüfen.
Die normalen Spielräume bleiben über die öffentliche Raumauswahl erreichbar.

### Spielphasen gezielt prüfen

Im Dev-Spiel öffnet **F2** oder **Debug (F2)** im Footer den Entwicklerdialog.
Er bleibt zunächst geschlossen und fehlt vollständig in Produktions- und
E2E-Builds. F2 und der Schließen-Button schließen ihn wieder. Die Runde läuft
während der Diagnose weiter; Formularfokus blockiert reguläre Spieltasten.
Öffnen und Schließen lösen gehaltene Eingaben.

Der Live-Zustand enthält Phase, Chaoswert/Ärgerstufe, Rundentimer, Saras Auswahl,
Pixels Rückkehr und den Versöhnungsfortschritt. **Rundentimer +10 Sekunden** spult
nur die Rundenuhr während der Chaosphase vor; ein Ablauf löst die normale
Heimkehr genau einmal aus.

**Szenario neu starten** setzt die aktuelle Runde mit gewähltem Chaoswert,
Startzeit, Seed und Zielphase neu auf. Phasen und Timer rückwärts zu ändern
beginnt bewusst einen frischen Durchlauf. Der Chaoswert ist synthetisch; die
Dialogerinnerung wird für reproduzierbare Seeds geleert. Normale Rundenneustarts
behalten dagegen die letzte Zeile je Raum-/Ärgerstufe während der Spielsitzung.
Gegenstände bleiben zunächst unbeschädigt. Ohne echte Schadensereignisse verwenden
Heimkehr und Reaktion die allgemeinen/raumbezogenen Dialoge. Konkrete Reaktionen
lassen sich durch reguläres Beschädigen eines Objekts und anschließendes Vorspulen
mit **Rundentimer +10 Sekunden** prüfen. Für Versöhnung und Ergebnis geht Pixel zunächst selbst
zu Sara; danach laufen Bestätigung und gegebenenfalls das echte Minispiel über
seine vorhandenen APIs. Es gibt keine direkten Herz-/Ergebnissetter.

## Lesbarer TypeScript-Code

Prettier formatiert; ESLint mit typescript-eslint und gezielten Stylistic-Regeln
prüft den Code. Die Konfigurationen im Repository sind maßgeblich.

- Deklarationen dürfen zusammenstehen. Logische Blöcke, Bedingungen, Schleifen,
  Rückgaben, Funktionen und mehrzeilige Klassenmethoden durch Leerzeilen trennen.
- Kleine fachliche Schritte, sprechende Namen und frühe Rückgaben bevorzugen.
  Funktionen möglichst höchstens zehn Codezeilen; geringe Komplexität und
  Verschachtelung. Die genauen Grenzen stehen in [eslint.config.js](eslint.config.js).
- Keine künstlichen Einzeiler oder Aufteilung, die zusammenhängende Validierung,
  Lifecycle, Snapshots oder deklarative Aufbauten unlesbarer macht. Solche Ausnahmen
  direkt am betroffenen Funktionsknoten begründen; keine pauschalen Dateiausschlüsse.
- Formatierung und verhaltensbewahrendes Refactoring in getrennten Commits bzw.
  PRs halten. Nur bearbeitete Dateien mit Prettier schreiben; `npm run format`
  ist eine bewusste repositoryweite Änderung.

```ts
// eslint-disable-next-line max-lines-per-function -- Die geordnete Validierung bildet einen zusammenhängenden Vertrag.
function validateDefinition(/* ... */) {
  // ...
}
```

Ungenutzte Ausnahmen und Warnungen blockieren; Prüfung und Reports stehen [oben](#qualität-prüfen).

## Release Notes und Squash-Merge

Jeder normale PR enthält genau einen englischen Conventional-Commit-Override aus
der [PR-Vorlage](.github/pull_request_template.md), auch bei mehreren internen Commits:

```text
BEGIN_COMMIT_OVERRIDE
fix(ui): keep result restart controls touch-only

Refs #205
END_COMMIT_OVERRIDE
```

Der [Release-Please-Override](https://github.com/googleapis/release-please#how-can-i-fix-release-notes)
ersetzt die gesamte ausgewertete Squash-Nachricht. Issue-Verweise deshalb auch im
Block erhalten; `Closes #N` steht zusätzlich im normalen Issue-Bezug. PR-Titel und
Beschreibung bleiben Deutsch. Breaking Changes verwenden `!` und gegebenenfalls
einen englischen `BREAKING CHANGE:`-Footer.

Normale PRs per Squash-Merge integrieren: englischen Betreff aus dem Block übernehmen,
im Commit-Body nur Issue-Verweise verwenden, keine internen Commit-Titel anhängen.
Zusätzliche Conventional-Commit-Zeilen würden doppelte Release-Einträge erzeugen;
Plain-/Rebase-Merges verwenden diesen Override nicht zuverlässig. Git-Historie,
veröffentlichte Tags und alte Changelog-Abschnitte nicht umschreiben.
Nur vom GitHub-Actions-Bot im eigenen Repository erzeugte Release-Please-Versions-PRs
mit `autorelease: pending` sind ausgenommen.
Prüfvertrag und Ausnahmen: [Release-note-Workflow](.github/workflows/release-note.yml)
und [Prüfskript](tools/check-release-note.mjs).

## Release bedienen

Ablauf, Trigger, Rechte, Gates und Artefaktaufbewahrung werden ausschließlich in
[release.yml](.github/workflows/release.yml), [pages.yml](.github/workflows/pages.yml),
[qa.yml](.github/workflows/qa.yml) und deren [Skripten](.github/scripts) gepflegt.
Release Please erzeugt Versionsdateien, Changelog, Tags und Release-Text;
keine einzelnen Versionen von Hand erhöhen und keine parallelen GitHub-Notes erzeugen.
SemVer-Strategie und Notizkategorien: [release-please-config.json](release-please-config.json).
Normale Merges veröffentlichen noch keine Spielversion.

### Voraussetzungen und Freigabe

GitHub Actions muss PRs erstellen dürfen. Pages als Quelle **GitHub Actions** und
als Umgebung `github-pages` mit Freigabe für `main` konfigurieren; kein zusätzlicher
PAT und kein npm-Publish. Vor einem öffentlichen Release die
[offenen Betreiberprüfungen](docs/legal/phase2-review.md#verbleibende-arbeit-aus-252)
abarbeiten; grüne technische QA ersetzt diese nicht.

1. **Actions → Spielrelease → main → Run workflow** bereitet den Versions-PR vor.
2. Version und Changelog prüfen, `autorelease`-Labels erhalten, Sara zuweisen und
   Rico zur Review anfragen. Erst mit grünen Checks und Freigabe mergen.
3. Veröffentlichung und Pages im selben Release-Lauf beobachten. Live Landingpage,
   Spiel, Assets, Rechtsseiten, DE/EN und mobiles Layout prüfen. Versionslink und
   veröffentlichter Tag müssen zusammenpassen; kein E2E-Observer im Produktionsspiel.

Die Vorbereitung verlinkt den konkreten Smoke-QA-Lauf samt Versuch und vollständigem
PR-Commit in der Actions-Summary. Der Dispatch verwendet die Run-ID aus der
[GitHub-API-Antwort](https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event)
(API-Version `2026-03-10`) und prüft Workflow, Repository, Branch und Commit;
anschließend muss der PR weiterhin auf demselben Commit stehen. Bei fehlender oder
widersprüchlicher Zuordnung stoppt der Schritt. Ein angeforderter Lauf kann trotzdem
bereits existieren: den verlinkten Lauf prüfen, bevor erneut gestartet wird.
Die Zuordnung bestätigt keinen Testerfolg. Status und nötige Freigaben im Lauf
prüfen; nach neuen PR-Commits ist ein Nachweis für den neuen Commit erforderlich.

Ein manueller QA-Start auf einem passenden gemergten Versions-Kandidaten kann die
Veröffentlichung auslösen; Diagnose-QA ist deshalb keine pauschal folgenlose Aktion.
Die Zuordnung entscheidet das Gate im Release-Workflow. Spielupdate und Recovery
für Nutzende erklärt die [zweisprachige Hilfe](game/landingpage/help.html#updates).

### Fehler und Wiederanlauf

| Befund in Actions                                             | Nächster Schritt                                                                                                                            |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Main-QA fehlt oder läuft                                      | Prepare startet fehlende QA bzw. wartet; Summary und verlinkten Lauf prüfen                                                                 |
| QA fehlgeschlagen, abgebrochen oder überholt                  | Ursache beheben, danach auf aktuellem Main vorbereiten; Gates nicht umgehen                                                                 |
| Kein aktueller Versions-Merge                                 | Versions-PR vorbereiten, prüfen und mergen; normale Merges sind kein Release-Kandidat                                                       |
| Mehrere Kandidaten oder nur teilweise vorhandener Tag/Release | Identität untersuchen, keine Labels/Tags pauschal bereinigen                                                                                |
| Vollprüfung fehlgeschlagen                                    | Bei unverändertem Kandidaten fehlgeschlagene Jobs desselben Laufs erneut starten; sonst neu vorbereiten                                     |
| Veröffentlichung erfolgreich, Pages fehlgeschlagen            | Fehlgeschlagene Pages-Jobs desselben Laufs erneut starten; geprüfte Release-Identität erhalten                                              |
| Geprüftes Buildartefakt fehlt oder ist abgelaufen             | Lauf stoppt; kein ungeprüfter Ersatzbuild. Wiederanlauf bleibt Gegenstand von [#346](https://github.com/Skanky0815/pixels-world/issues/346) |

Kandidatenprüfung ohne Mutation (Repository und aktuellen Main-SHA einsetzen):

```sh
GITHUB_REPOSITORY=Skanky0815/pixels-world GITHUB_SHA=<aktueller-main-sha> bash .github/scripts/prepare-release-candidate.sh --dry-run
```

Ergebnisse und Wiederanlaufnachweise gehören in Actions/PRs, nicht als Statuschronik
in die Anleitung. Architektur und Vertrauensgrenzen: [arc42](docs/arc42/README.md#7-verteilungssicht).

## Dokumentation pflegen

- Vor einer neuen Markdown-Datei einen vorhandenen Zweck prüfen und die zuständige
  Datei aktualisieren. Kleine Feature-Änderungen brauchen keine eigene Statusseite.
- README erklärt Einstieg und Spiel; CONTRIBUTING bündelt Arbeitsanweisungen,
  Prüfanweisungen bleiben hier, [arc42](docs/arc42/README.md) beschreibt stabile Verträge. Technische
  Release-/Buildabläufe stehen in den Workflows und Skripten.
  Content-Anleitung und Asset-Prompts bleiben nah an ihren Quellen.
- Code/Tests/Konfiguration sind maßgeblich für Verhalten, Parameter und Testumfang;
  Issues/PRs für Planung und Verlauf, Actions für aktuelle Testergebnisse.
  Keine Testzahlen, Laufzeitmessungen oder „zuletzt grün“-Stände in Markdown pflegen.
- ADRs nur für langfristige Entscheidungen mit Alternativen und Folgen. Einmalige
  Reviews, Messungen und Inventare gehören ins zugehörige Issue/PR, nicht in neue
  Berichtsordner. Git-Historie bewahrt entfernte historische Dokumente.
- Notwendige Rechtstexte, freigegebene Quellen und reproduzierbare Asset-Anleitungen
  erhalten. Kontaktangaben nicht automatisch aus anderen Projekten synchronisieren.
- Bei Zusammenlegung interne Links und relevante Code-/Workflow-Verweise prüfen;
  keine leeren Weiterleitungsdateien als zweiten Index zurücklassen.
