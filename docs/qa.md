# Qualität und Tests

## Lokal prüfen

Die verfügbaren Skripte sind in [package.json](../package.json) definiert.
Vor einem Code-/Tooling-PR:

```sh
npm ci
npx playwright install chromium
npm run check:pr
```

`check:pr` führt Formatierung, Lint, CI-Gate-/Hook-Tests, Unit-Tests,
Typprüfung, Produktionsbuild und die vollständige Browsersuite aus. Bei reinen
Dokumentationsänderungen Sprache, Fakten, Formatierung und interne Links prüfen;
kein Browserlauf allein wegen Markdown. Der aktivierte native Pre-Push-Hook
unterstützt lokale Git-Pushes, nicht GitHub-API-Pushes; siehe
[CONTRIBUTING](../CONTRIBUTING.md#lokale-prüfung-vor-push).

Für gezielte Diagnose:

```sh
npm run lint
npm run typecheck
npm run test:unit
npm run test:ci
npm run test:e2e -- tests/e2e/movement.spec.ts
npm run test:e2e -- --grep 'Sofa:'
npm run test:e2e -- --workers=1
npm run test:e2e -- --repeat-each=3
npm run test:e2e:debug
npm run test:e2e:report
```

Auf Linux kann `npx playwright install --with-deps chromium` erforderlich sein.
Playwright startet eigene Vorschauen auf 4174 (E2E) und 4175 (Produktion mit
Pages-Unterpfad). Vollständige Läufe starten zusätzlich einen Dev-Server auf 4176
für Animationsvergleich und Objekt-Playground; CI-Smoke lässt ihn aus. Diese Ports müssen frei sein;
fremde Server werden nicht übernommen. Der persönliche Dev-Server bleibt unabhängig.

## Browser-Vertrag und Rundenprofile

Specs unter [tests/e2e](../tests/e2e/) verwenden die gemeinsame Gesundheits-/Clock-
Fixture aus `support.ts`, echte Tastatur-/Pointer-Eingaben und eigene Browserkontexte.
Es gibt keine Spielzustandssetter und keine für Tests exponierten Phaser-Objekte.
`window.__pixelTest` ist ausschließlich im E2E-Build ein unveränderlicher Observer;
seine Abwesenheit im Produktionsbuild wird im Browser geprüft.

Die pausierte Playwright-Uhr wird mit `clock.runFor` schrittweise weitergeführt.
Runnerlatenz darf gehaltene Eingaben nicht verlängern. Die langen Rundenszenarien
verwenden nach ihrer Vorbereitung gröbere RAF-Schritte; das ersetzt keine
Bewegungs-/Renderprüfungen mit normalem Frame-Takt. `fastForward` ist kein Ersatz
für aktive Spielzeit. Headless-Visibility wird an der Browsergrenze simuliert;
echte Tab-/Appwechsel gehören zur Geräteprüfung.

```sh
npm run test:e2e:full
npm run test:e2e:slow
```

Das Vollprofil verwendet Produktionszeiten. Das kurze Profil existiert nur im
E2E-Build und wird für Rundenszenarien ausdrücklich gewählt. Beide durchlaufen
dieselben Regeln und Assertions; Produktionsbuilds enthalten keine entsprechende
Query-Steuerung. Tags, Worker und Timeouts stehen in den Specs und
[playwright.config.ts](../playwright.config.ts), keine zweite Szenarienliste hier.
Automatische Retries bleiben ausgeschaltet; Wiederholungen dienen einer bewusst
gestarteten Stabilitätsprüfung. Bei Browser-Updates die Mehrfinger-Freigabe in
`touch-support.ts` mitprüfen: Der verwendete CDP-Pfad gibt einzelne Kontakte per
gezieltem `touchEnd` frei.

## CI und Runnerverbrauch

Maßgeblich ist [.github/workflows/qa.yml](../.github/workflows/qa.yml):

| Anlass          | Umfang                                                           |
| --------------- | ---------------------------------------------------------------- |
| Pull Request    | Quality und getaggte `@smoke`-Auswahl                            |
| Main-Push       | Quality; Browser bewusst nicht erneut geplant                    |
| Manuelle QA     | Standardmäßig Vollprüfung; Smoke-Profil für Versions-PRs wählbar |
| Release-Rollout | Vollständige Suite mit Produktionszeiten                         |

Die lokale Vollprüfung trägt die breite PR-Abdeckung. Mehr Shards verkürzen
Wartezeit, sparen aber nicht automatisch Runner-Minuten. Matrix, Worker,
Playwright-Image und Digest ausschließlich im Workflow bzw. Lockfile pflegen;
bei Updates gemeinsam abgleichen. Das offizielle Browser-Image vermeidet eine
eigene Image-Pipeline. Diagnose nur aufgrund von Messungen verschlanken, niemals
durch Zustandssetter, ausgelassene Interaktionen oder schwächere Assertions.

Der Sammelcheck `Playwright (Chromium)` verlangt Quality und alle für das Profil
geplanten Browserjobs. Nur das ausdrücklich geplante Auslassen auf Main ist
zulässig; Fehler, Abbruch und unerwartetes Überspringen sind kein Erfolg.
Pfadfilter in Push und PR müssen übereinstimmen. Referenz-/Quell-/Vorschaubilder,
Asset-Markdown und Banner sind keine direkten Runtime-/Testimporte. Ein neues
Runtime-Asset braucht einen nicht ausgeschlossenen Pfad; bei neuen Eingabepfaden
beide Filter anpassen. Workflow-Änderungen prüft zusätzlich Actionlint.

Bei ausschließlich pfadgefilterter Dokumentation kann QA fehlen. Vor einem Release
QA ausdrücklich für den genauen Main-Commit starten. Gefilterte Jobs nicht ohne
immer gestarteten Gesamtcheck als verpflichtend konfigurieren: Sonst bleiben
Docs-PRs auf Pending. Manuelle QA unter Actions → QA ist ungefiltert; GitHub-
Pfadfilter besitzen Grenzen bei großen Vergleichen und sind keine Importanalyse.

## Ergebnisse und Abhängigkeiten

Aktuelle Testzahlen und Laufzeiten gehören in [Actions](https://github.com/Skanky0815/pixels-world/actions)
und den jeweiligen PR. Die Unit-/Browserjobs liefern TAP, JUnit, HTML-Berichte und
bei Fehlern Screenshots/Traces; der Gesamtjob führt die geplanten Reports zusammen.
Fehlende Reports werden als unvollständig gemeldet, nicht als Test-Erfolg.
Aufbewahrung und Artefaktnamen stehen im Workflow. Lokal entstehen ignorierte
Dateien unter `test-reports/`, `test-results/` und `playwright-report/`.

```sh
npx playwright show-trace <pfad-zur-trace.zip>
```

Die gemeinsame [Audit-Action](../.github/actions/npm-audit/action.yml) blockiert
Runtime-high/critical sowie Audit-/Registry-Fehler. Der vollständige Audit für
Entwicklungsabhängigkeiten ist ein sichtbarer Zusatzbericht. Keine pauschalen
Advisory-Ausnahmen oder ungeprüften `audit fix --force`-Upgrades. Das vorhandene
minimatch-Override ist eine kontrollierte transitive Entwicklungsabhängigkeit;
bei Entfernung Aufrufer, Lint-Dateiauswahl und Audits erneut prüfen. Aktuelle
Versionen und Findings nicht in Markdown spiegeln.

Die DEV-Szenarien verwenden sichtbare, losgelöste DOM-Diagnosen und reguläre
Eingaben. Sie prüfen Auswahl aller Katalogvarianten, reale Interaktionen, Reset
und stabile Body-/Collider-/Listenerzahlen nach wiederholten Objektwechseln.
Die Produktionsisolation umfasst beide DEV-Seiten und ihre Einstiegsmodule.

## Manueller Spieltest

- Einführung lesen und scrollen; vor Start keine Bewegung/Timer. Startsignal wird
  verbraucht. Lauf, Luftsteuerung, Sofa/Regale und Raumgrenzen prüfen.
- Vorhang greifen, hoch-/hinabklettern, rutschen, abspringen und wieder lösen.
  Kratzen/Knabbern starten im Stillstand und brechen bei Bewegung/Sprung ab.
  Vasen zählen erst beim Bodenbruch; gleicher Schaden zählt nicht doppelt.
- Ballziel ohne Schaden erreichen und alternativ Timer ablaufen lassen. Sara
  kommt, Pixel steigt von Möbeln herunter und setzt sich. Score/Welt bleiben
  eingefroren; Texte warten auf frische Bestätigung.
- Versöhnung: Lesepause, nächste Pfeiltaste, richtige/falsche/zu späte Eingaben,
  begrenzte Versuche, Erfolg und Scheitern. Ergebnis bleibt stabil; „Neue Runde“
  funktioniert mit Maus/Touch. Debug-R setzt den kompletten Durchlauf zurück.
- Fokus-/Tab-/Appwechsel während Bewegung, Heimkehr und Eingabe: keine klemmenden
  Tasten, keine nachgeholte Hintergrundzeit. Link-/Sprachbuttonfokus blockiert
  Spieltasten; Feedback öffnet separat, Rechtsseiten im selben Tab.
- Auf iPhone/Safari und Android/Chrome zwei Finger für Richtung plus Sprung,
  Abbruch, Rotation, Browserleisten/Safe Areas und Start/Ergebnis prüfen.
  Querformat: Steuerkreuz links, Raum mittig, Aktion rechts; Texte/Buttons bleiben
  lesbar und erreichbar, der Raum unverzerrt. Lange Texte scrollen innerhalb ihrer
  Box. Unterhalb der getesteten Viewports in `responsive.spec.ts` gegebenenfalls
  mehr Platz oder Hochformat verwenden. Emulation ist kein Hardware-Nachweis.
- DE/EN in Einführung, Dialog, Versöhnung und Ergebnis wechseln: Runde bleibt
  erhalten. Auswahl wird beim Reload wiederhergestellt; gesperrter Speicher
  verhindert das Spiel nicht. Nur die Sprache, kein Spielstand, wird gespeichert.
- Produktions-/Pages-Build: eigene Ressourcen, kein Testobserver, erreichbare
  Rechtsseiten; verlinkte Spielversion passt zum Release. Entwicklung/Preview
  ohne Release-Kontext zeigen nur die Versionsnummer. Für die gezielte Prüfung
  den passenden Paket-Tag in `PIXELS_RELEASE_TAG` setzen und `footer.spec.ts`
  laufen lassen; das simuliert keinen echten Deployment-Nachweis.

Spielregeln und Parameter werden in Content/Domain gepflegt, nicht als zweite
Zahlentabelle hier. Release-Identität und Wiederanlauf: [Deployment](deployment.md).
Die CI-Gate-Tests simulieren auch QA-Ereignisse, veraltete Versuche, Main-Wechsel,
mehrdeutige Kandidaten und vorhandene Tags/Release-Metadaten. Sie führen keine
GitHub-Schreiboperationen oder echten Releases aus.
