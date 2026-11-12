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

Vollständige Runden prüfen die zentralen Übergänge bis zum Ergebnis: erfolgreiche
und gescheiterte Versöhnung, friedlicher Fund und Touch-Bedienung. Varianten von
Grafiken, Punkten, Seeds und Schwierigkeiten werden vollständig in den vorhandenen
Content-/Modelltests geprüft. Im Browser bleiben repräsentative Szenenaufbauten,
reale Kontakte, Grafik-/Audioanbindung, Eingaben, Speicher und Layoutgrenzen.
Reine UI-Prüfungen benötigen keinen erneut erspielten Rundenabschluss. Bei einer
Reduktion muss jede bisher einzigartige Prüfung einer konkreten verbleibenden
Browser- oder Modellprüfung zugeordnet sein; weniger Fallnamen allein sind kein
Nachweis für gleichwertige Abdeckung oder eine kürzere Laufzeit.

Specs unter [tests/e2e](../tests/e2e/) verwenden die gemeinsame Gesundheits-/Clock-
Fixture aus `support.ts`, echte Tastatur-/Pointer-Eingaben und eigene Browserkontexte.
Es gibt keine Spielzustandssetter und keine für Tests exponierten Phaser-Objekte.
`window.__pixelTest` ist ausschließlich im E2E-Build ein unveränderlicher Observer;
seine Abwesenheit im Produktionsbuild wird im Browser geprüft.

Reine Album-Layoutfälle dürfen vor dem Start bestätigte Einträge im regulären
Browser-Speicher vorbereiten. Die echte Freischaltung nach erfolgreicher
Versöhnung sowie das Verwerfen bei Scheitern bleiben eigene Durchläufe.
Pause und Fortsetzen für die Layoutprüfung in einer noch aktiven Runde prüfen,
damit ein bereits abgeschlossener Rundentimer keine fehlende Pause verdeckt.

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

## Gezielte Charakter-Bildvergleiche

Die bestehenden Ballspiel- und Heimkehrabläufe vergleichen feste Ausschnitte der
tatsächlichen Browseransicht: Pixel mit dem Ball sowie Sara mit Pixel nach der
Heimkehr. Seed, Viewport, DPR und beobachtete Pose sind festgelegt; die pausierte
Browser-Uhr hält den erreichten Frame. Die Ausschnitte folgen festen Weltgrenzen,
nicht einer möglicherweise falsch positionierten Figur. Zustands-, Eingabe- und
Layoutprüfungen bleiben zusätzlich bestehen.

Playwright vergleicht mit den eingecheckten PNGs unter `*.spec.ts-snapshots`.
Es sind keine abweichenden Pixel zugelassen (`maxDiffPixels: 0`, `threshold: 0`).
Referenzen für Chromium auf macOS und Linux sind getrennt. Linux-Bilder mit dem
im [QA-Workflow](../.github/workflows/qa.yml) festgeschriebenen Browser-Image auf
`linux/amd64` erzeugen und überprüfen; bei Browser-Updates auch die Referenzen
visuell prüfen. Normale Läufe verwenden `updateSnapshots: 'none'`: fehlende oder
abweichende Referenzen schlagen fehl und werden nicht automatisch freigegeben.

```sh
# Bewusste Aktualisierung: beide neuen Bilder und ihren Diff vor Commit prüfen.
npm run test:e2e -- tests/e2e/round.spec.ts tests/e2e/ball-play.spec.ts --grep 'Der Rundentimer|Ballfund:' --update-snapshots
# Ohne Aktualisierung prüfen, auch mehrfach und mit Produktionszeiten:
E2E_FULL_ROUND=1 npm run test:e2e -- tests/e2e/round.spec.ts tests/e2e/ball-play.spec.ts --grep 'Der Rundentimer|Ballfund:' --repeat-each=3
```

Zwei ausdrücklich aktivierte Gegenproben verändern ausschließlich die
Canvas-Zeichenaufrufe im Testbrowser: fehlendes Sara-Sprite oder um 35 Prozent
vergrößerte Pixel-Grafik. Der Test bestätigt zuerst, dass die Einspritzung
tatsächlich gegriffen hat, und muss anschließend **am Bildvergleich fehlschlagen**.
Die Proben dürfen nicht zusammen mit einer Referenzaktualisierung laufen und
gelangen nicht in den Produktionsbuild.

```sh
E2E_VISUAL_FAULT=missing-sara npm run test:e2e -- tests/e2e/round.spec.ts --grep 'Der Rundentimer'
E2E_VISUAL_FAULT=pixel-size npm run test:e2e -- tests/e2e/ball-play.spec.ts --grep 'Ballfund:'
```

Ergebnisbilder und Diffs gehören zur Review. Die `Bildvergleich:`-Schritte im
Playwright-Bericht zeigen den Zusatzaufwand; es entstehen keine zusätzlichen
vollständigen Spielrunden. Beide Fälle gehören zur PR-Smoke-Auswahl und zur
vollständigen Release-QA. Grundlage: [Playwright-Bildvergleiche](https://playwright.dev/docs/test-snapshots).

## CI und Runnerverbrauch

Maßgeblich ist [.github/workflows/qa.yml](../.github/workflows/qa.yml):

| Anlass                       | Umfang                                                           |
| ---------------------------- | ---------------------------------------------------------------- |
| Pull Request                 | Quality und getaggte `@smoke`-Auswahl                            |
| Main-Push                    | Quality; Browser bewusst nicht erneut geplant                    |
| Manuelle QA                  | Standardmäßig Vollprüfung; Smoke-Profil für Versions-PRs wählbar |
| Release vor Veröffentlichung | Vollständige Suite mit Produktionszeiten                         |

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
  Album-Reset ausschließlich in den Optionen und erst nach Bestätigung; Abbrechen
  oder Schließen erhält die Sammlung. Nach erneutem Öffnen darf keine alte
  Bestätigung fortbestehen; Runde, Punkte und vorgemerkte Funde bleiben erhalten. Auf schmalen
  Bildschirmen müssen beide Buchseiten und alle Aktionen durch Scrollen erreichbar sein.
  Im Handy-Querformat sechs Kacheln in zwei Reihen ohne Scrollen anzeigen; auch
  die unterste Reihe öffnen und Seiten wechseln. In der Detailansicht stehen
  Bild und Name links, Beschreibung und Saras Kommentar rechts sowie „Zur Übersicht“
  unten rechts; alle aktuellen
  Einträge müssen auf Deutsch und Englisch ohne Scrollen lesbar sein. Kacheln und Navigation dürfen
  nicht überlappen. Mit geöffnetem Eintrag auf der letzten Seite drehen;
  der Eintrag bleibt erhalten und die Seitenaufteilung passt sich an. Notch und Home-Leiste freihalten sowie
  Reset-Abbruch, leere Kapitel und Schließen nach dem Scrollen prüfen.

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
- Von beiden Seiten auf eine Vase springen: Sie kippt und rollt weg, ohne allein
  durch die Landung Punkte zu vergeben. Auch mit reduzierter Bewegung, während
  einer Pause und nach Neustart prüfen.
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
  Vergleichsansicht `?camera=room` im Querformat: Steuerkreuz links, Raum mittig, Aktion rechts; Texte/Buttons bleiben
  lesbar und erreichbar, der Raum unverzerrt. Auf kurzen Handy-Querformaten stehen
  Einführung und Spiel im selben Raster; beim Start bleiben Zimmer und Tasten
  an derselben Position. Gleich breite Seitenleisten zentrieren das Zimmer. Der Titel steht links oben, beide Tastengruppen sind vertikal mittig; Status und Meldungen stehen rechts oben, Album/Menü rechts unten. Die seitlichen Bereiche vermeiden eine zusätzliche Kopfzeile über dem Zimmer. Die Touch-Tasten liegen neben dem
  unverdeckten Zimmer; beides passt in die erste Bildschirmansicht.
  Dialoge dürfen die Tasten nicht überdecken. Rechtslinks,
  Version und Hinweise stehen im Optionen-Menü unter „Über das Spiel“.
  Vor dem Start zeigt die Startkarte die Altersinformation; längere Einführungstexte
  bleiben scrollbar. Lange Texte scrollen innerhalb ihrer
  Box. Unterhalb der getesteten Viewports in `responsive.spec.ts` gegebenenfalls
  mehr Platz oder Hochformat verwenden. Emulation ist kein Hardware-Nachweis.
- Standardkamera mit `play.html` im Handy-Querformat prüfen:
  Leinwand füllt die Fläche, transparente Tasten unten reagieren auch gleichzeitig,
  Kamera folgt Pixel; die Kulisse setzt sich seitlich außerhalb des Spielraums fort.
  Die sichtbare Randfläche passt sich an die Touch-Tasten an und hält nur einen
  kleinen Sicherheitsabstand frei.
  Pixel erreicht die ursprünglichen Raumgrenzen und bleibt vor den Tasten sichtbar.
  Randobjekte, beide Räume und Rückkehr nach Rotation prüfen. Dialoge, Minispiel
  und Ergebnis stehen links über den Pfeiltasten; Sara und Pixel bleiben daneben
  sichtbar. Lange Texte innerhalb der Karte scrollen und Richtungsvorgaben prüfen. Raumränder, Vorhang, Sprünge, Pause
  und Rotation prüfen; mit `?camera=room` bleibt die Zimmerübersicht erreichbar.
- Desktop-Standardkamera vergleichen: moderater Zoom,
  Tastatursteuerung und unveränderte Objektpositionen; Status und linke Dialogkarte
  bleiben unabhängig von der Kamera lesbar. Die größere Desktopkarte mit größerer
  Schrift muss auch während der Gesten links neben beiden Figuren bleiben. Fenster über die Kompaktgrenze verkleinern
  und wieder vergrößern; klassische Ansicht mit `?camera=room` vergleichen.
- HUD: Punktestand und kurze Aktionsrückmeldungen bleiben sichtbar; Schwierigkeitsgrad
  steht in den Optionen. Zielstatus und Versuchszähler erscheinen weder im Spiel
  noch im Ergebnis. Ball, Zielmarker und Herzfortschritt bleiben erhalten.
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

Schmale Maus-/Tastaturfenster (568×320 und 390×844) zusätzlich ohne Touch prüfen:
HUD und Dialoge bleiben lesbar, Touch-Tasten bleiben verborgen. Während Saras
Dialog, Charme und Ergebnis zwischen schmal und breit wechseln: genau eine
Textansicht, vollständiges Zimmer, unveränderte Runde. Pause, Sprache und
Neustart müssen weiterhin funktionieren.
