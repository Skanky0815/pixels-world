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
npx playwright install webkit
npm run test:e2e:tablet:webkit
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
Die Debug-Szenarien bedienen ausschließlich F2, Footer und Formular. Geprüft
werden Phasen/Ergebnisse, Eingabefokus, Vorwärtsschritte, wiederholte Neustarts,
Seed-Reproduzierbarkeit und die mobile Dialoggröße.
Die Produktionsisolation umfasst beide DEV-Seiten, ihre Einstiegsmodule und die
Abwesenheit des Debugdialogs samt Aktionen auch nach F2.

## Manueller Spieltest

- Lieblingsball in beiden Räumen ohne Schaden finden: Nach dem kurzen Aufenthalt
  spielt Pixel den Ball auf dem Regal nach rechts und zurück und dreht sich mit.
  Ball und Pfoten bleiben auf dem Regal; Punkte, Objekte und Rundentimer ändern
  sich dabei nicht. Saras Heimkehr und Dialog beginnen erst nach dem Spielmoment.
  Menüpause und Fokusverlust beim Rollen prüfen, dann fortsetzen und während
  eines zweiten Funds neu starten. Reduzierte Bewegung in System und Menü sowie
  Touch im Hoch-/Querformat prüfen; bei verpasstem Ziel gibt es keinen Spielmoment.

- Album aus Einführung und Pause öffnen: Runde bleibt stehen, Esc schließt nur das
  oberste Album. Raum-Tabs und Gesamt-/Kapitelzähler prüfen. Vor einer echten
  Schadensaktion dürfen weder Bilder noch Namen unbekannter Objekte sichtbar sein.
  Nach Schaden neu öffnen, zwischen DE/EN wechseln und Rundenneustart/Reload prüfen.
  Album-Reset erst nach Bestätigung; Abbrechen erhält die Sammlung. Auf schmalen
  Bildschirmen müssen beide Buchseiten und alle Aktionen durch Scrollen erreichbar sein.

Die Tablet-Szenarien laufen regulär in Chromium; `test:e2e:tablet:webkit` prüft
dieselben Abläufe zusätzlich mit WebKit. Viewport-/Touch-Emulation ersetzt keine
Hardwareprüfung von iPadOS Safari oder Android-Browserleisten und Safe Areas.
Auf echten Tablets beide Ausrichtungen, größere Tasten, Rotation, Menü und Neustart
prüfen; auf Touch-Laptops zusätzlich Maus und Tastatur verwenden.

- Einführung → Optionen: Leicht/Normal/Schwer wählen, zurückkehren und starten.
  Timer, Objektbelegung und Versöhnung gemeinsam prüfen. Das untere Regal
  belegt 1/2/3 Slots; Bücher und Vasen überlappen nicht. Gleicher Raumseed und
  Grad reproduzieren die Belegung beim Neustart; während der Runde wird nicht
  nachgefüllt. Beim Einsturz fallen alle noch aufliegenden Vasen selbständig. In beiden Räumen muss der Ball ohne Schaden erreichbar
  bleiben. Auswahl während einer Runde gilt erst für die nächste; das Ergebnis
  zeigt weiterhin den gespielten Grad und seine tatsächlichen Herzen. Auswahl
  nach Reload und bei gesperrtem Speicher auf Desktop und Touch prüfen.

- Feedback nach Kratzen, Rissen, Knabbern, Umkippen und Vasenbruch: angezeigte
  Punkte stimmen, Meldungen bleiben kurz und verdoppeln keine Ereignisse. Pause
  friert auch Hinweise ein; Reset entfernt alte. Phasen, falsche/richtige Pfeile,
  Timeout und Herzfortschritt bleiben erkennbar. Desktop-Zimmerränder und mobile
  Statuszeile überdecken keine zeitkritischen Inhalte. Mit reduzierter Bewegung
  in System/Pause-Menü bleiben dieselben Hinweise statisch verfügbar.

- Esc/Menü während Lauf, Heimkehr und zeitkritischer Versöhnung öffnen: Welt,
  Animationen und Fristen bleiben stehen. Tab-Wechsel und wiederholter Fokus
  heben die Menüpause nicht auf. Fortsetzen holt keine Zeit nach; gehaltene
  Tasten lösen weder Sprung noch Neustart aus. DE/EN und Lautstärken ändern,
  neu laden und nach einem Menü-Neustart erneut prüfen. Mobile: Menüknopf,
  Rotation und Scrollen im Dialog bleiben erreichbar.

- Einführung lesen und scrollen; vor Start keine Bewegung/Timer. Startsignal wird
  verbraucht. Lauf, Luftsteuerung, Sofa/Regale und Raumgrenzen prüfen.
- Vorhang greifen, hoch-/hinabklettern, rutschen, abspringen und wieder lösen.
  Kratzen/Knabbern starten im Stillstand und brechen bei Bewegung/Sprung ab.
  Vasen zählen erst beim Bodenbruch; gleicher Schaden zählt nicht doppelt.
- Die [Kontakt-Testzimmer](development.md#objektkontakte-prüfen) für Vase gegen Vase,
  rollende Vasen, Bild auf Vase, Regal auf Pflanze und Bücher gegen Vase spielen.
  Leichte Kontakte dürfen ohne Bruch enden, starke können mehrere Gegenstände
  beschädigen. Pause während des Falls und Neustart vor dem Aufprall prüfen;
  kein Knabbern, Kratzen oder Haarballen durch Fremdtreffer.
- Im Wohnzimmer mit Raumseed `books-5` über den Vorhang rechts aufs mittlere Regal
  springen und die Vase nach links schieben. Sie kippt beim Fallen die Bücher
  auf dem unteren Regal um. Beide Schäden zählen je einmal; andere Regale und
  Wege bleiben bestehen. Mitten im Bücherfall pausieren und neu starten:
  keine nachgeholten Punkte, Vase und Bücher stehen wieder am Ausgangsort.
- Ballziel ohne Schaden erreichen und alternativ Timer ablaufen lassen. Sara
  kommt, Pixel steigt von Möbeln herunter und setzt sich. Score/Welt bleiben
  eingefroren; Texte warten auf frische Bestätigung.
- Bei völlig schadensfreiem Ballfund erscheint sofort ein herzlicher
  Sara-Satz. Nach Heimkehr und Bestätigung folgt die positive Auswertung ohne
  Minispiel oder Herzen. DE/EN und Touch prüfen; bereits ein Kratzen oder ein
  Timer-Ende ohne Ziel behält den regulären Versöhnungsablauf.
- Neue Album-Funde bleiben während Chaos, Heimkehr und Versöhnung geheim.
  Erst die Auswertung nach erfolgreicher Versöhnung bestätigt sie gemeinsam und
  zeigt ihre Anzahl. Gescheiterte Versöhnung verwirft neue Funde auch mit Teilherzen.
  Neustart/Reload davor verwirft nur Vormerkungen, vorhandene Einträge bleiben erhalten. Mehrere Varianten,
  bekannte Einträge, DE/EN und blockierten Speicher prüfen.
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
  verhindert das Spiel nicht. Sprache, Lautstärke und Bewegungseinstellung, kein Spielstand, werden gespeichert.
- Saras Heimkehr im Wohnzimmer und in der DEV-Leseecke prüfen: allgemeine und zur
  Einrichtung passende Varianten bleiben innerhalb der richtigen Ärgerstufe.
  Zwei reguläre Runden derselben Stufe dürfen nicht dieselbe Zeile direkt
  wiederholen. DE/EN während der Lesepause wechseln: Auswahl und Bestätigung
  bleiben erhalten. Auf schmalem Touch-Bildschirm muss auch die längste Zeile
  vollständig lesbar bleiben. F2-Szenarien mit identischem Seed bleiben absichtlich
  wiederholbar; Reload startet die Dialogerinnerung neu.
- Sofa zerkratzen, Vorhang einreißen, Topf umkippen, Vase zerbrechen oder Regal
  einstürzen lassen: Sara kommentiert einen tatsächlich geschehenen Vorfall,
  passend zur Gesamtärgerstufe. Bei mehreren Schäden hat Einsturz Vorrang vor
  Vasenbruch, Pflanze, Vorhang und Sofa. Sprachwechsel und Lesepause ändern die
  Auswahl nicht. Neustart entfernt den vorherigen Vorfall; ohne passenden Schaden
  bleiben die allgemeinen/raumbezogenen Dialoge erhalten. Auch lange konkrete
  Texte müssen im schmalen Touch-Layout vollständig lesbar bleiben.
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

Für die Hörprobe zu Objektgeräuschen beide Wohnzimmer und den DEV-Playground
verwenden: Vasenbruch, Bildaufprall, Buchumsturz und Regalwarnung/-einsturz
vergleichen. Pause oder Tabwechsel mitten im Klang, dann Fortsetzen und Neustart:
keine alten Töne nachholen. Gesamt-/Effektregler einzeln auf null und nach Reload
prüfen. Auf Desktop und echten Mobilgeräten den ersten Ton nach Start per
Tastatur bzw. Touch prüfen; verweigerte Audiofreigabe darf das Spiel nicht
blockieren. Gleichzeitige fallende Objekte dürfen keine Lautstärkespitze bilden.
Die einzelnen [WAV-Dateien](../assets/audio/README.md) sind direkt anhörbar.

Zusätzlich Pixels Aktionsgeräusche prüfen: Würgen beginnt erst mit der Animation,
beim erfolgreichen Abschluss erklingt genau ein Haarballen-Plopp. Weglaufen oder
Springen beendet Würgen, Kratzen und Knabbern sofort; die erneute Wartezeit bleibt
still. Beim Vorhang unterscheiden sich Klettern und Rutschen; am oberen Anschlag
und nach Ablösen/Bodenkontakt endet die Reibung. Boden- und Vorhangsprünge geben
je einen kurzen Ton, Lufttastendrücke und Spawn keinen. Pause, Tabwechsel,
Stummschaltung und Heimkehr auch mitten im Aktionsloop prüfen; keine vorbereitete
Loopquelle darf weiterlaufen. Danach dieselben Abläufe im DEV-Playground testen.

Bei den aufgenommenen Aktionsgeräuschen die Schnittübergänge und Pegel per
Hörprobe vergleichen. Schritte nur beim realen Laufen prüfen, einschließlich
sofortigem Ende bei Luftphase, Vorhang, Stillstand, Wanddruck und Pause.
Im Impressum müssen die Audio-Quellen samt alexarje, CC BY 4.0 und Hinweis auf
Bearbeitung auch im Produktions-/Pages-Unterpfad erreichbar bleiben.

Ladescreen: Spielmodul und einzelne Audio-/Bilddateien im Netzwerk verzögern.
Anzeige und Pixel-/Ballmotiv müssen schon vor Phaser sichtbar sein, danach folgt
der Balken echten Asset-Abschlüssen. Bei schnellem Laden bleibt die Anzeige
insgesamt zwei Sekunden stehen, bei längerem Laden endet sie nach dem ersten
fertigen Bild ohne erneute Mindestpause. Frühe Spieltasten dürfen die Einführung
nicht überspringen. Modul-/Assetfehler zeigen „Erneut versuchen“; nach Freigabe
der Ressource muss der vollständige Neuladeversuch gelingen. DE/EN, kleine
Displays und gespeicherte/System-Bewegungsreduktion prüfen. DEV-Vorschau und
isolierter Produktionsbuild werden separat geprüft; der Produktionscheck liest
auch tatsächlich geladene dynamische JavaScript-Chunks.

Nach vollständigem Laden kann die verbleibende Mindestanzeige mit einer frischen
Leertaste oder „Los geht’s!“ übersprungen werden. Vorher ist diese Aktion nicht
verfügbar; gehaltene Tasten werden nicht nachträglich als Freigabe gewertet.
Der Button-Platz ist von Beginn an reserviert. Das Fortsetzen zeigt die Einführung
und startet nicht mit derselben Eingabe schon die Runde.
