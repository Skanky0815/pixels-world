# Lokal entwickeln

Node.js 22.12+ oder eine unterstützte neuere LTS-Version und npm verwenden.
Die verfügbaren Befehle stehen in [package.json](../package.json).

## Spiel und Vorschau

```sh
npm ci
npm run dev
npm run build
npm run preview
```

Vite gibt die lokale Adresse aus. `build` prüft TypeScript und schreibt nach `dist/`.
Phaser ist lokal gebündelt; ein Hinweis zur Engine-Chunkgröße ist kein Messwert für
Laufzeitprobleme. Die Steuerung erklärt [README](../README.md#steuerung).
Die versteckte Debug-Taste R startet nach Spielbeginn die Szene neu.

Die öffentliche Startadresse lädt die Landingpage ohne Phaser. Das Spiel liegt unter
`play.html`. Beide Einstiege funktionieren auch unter dem GitHub-Pages-Unterpfad;
Vite bündelt sie als getrennte HTML-Einstiege. Die lokalen PNG-Aufnahmen in
`assets/landing/` stammen aus dem bestehenden Spiel und benötigen keine externen Dienste.
`album.png` zeigt den Album-Dialog des Produktionsbuilds nach echtem Kratzen am
Sofa: eine Entdeckung, übrige Plätze geheim. Für eine neue Aufnahme ein frisches
Browserprofil verwenden, die Runde starten, neben das Sofa laufen und nach der
ersten Schandtat das Buchsymbol im Spielkopf öffnen. Bei 1280×800 nur den
Album-Dialog aufnehmen; der Screenshot wird unverändert eingebunden.

Für ein Handy im selben Netz:

```sh
npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
```

Die von Vite ausgegebene Netzwerkadresse verwenden. DHCP kann sie ändern;
Firewall und WLAN-Gastnetz können Verbindungen verhindern. Einen zusätzlichen
Hostnamen bei Bedarf gezielt mit `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS`
freigeben, nicht pauschal alle Hosts erlauben.

`/?room=cozy-remix` wählt nur im Dev-/E2E-Betrieb eine Inhaltsvariante.
[Raum- und Objektinhalte](../src/content/README.md) erklären den Datenvertrag.

## App-Icons und Offline-Vorschau

`node tools/prepare-app-icons.mjs` erzeugt die Icons reproduzierbar aus Pixels
bestätigtem Idle-Master. Der Ausschnitt zeigt seinen Kopf; das maskierbare Icon
hält die Figur im sicheren zentralen Bereich. Die Dateien stehen unter
`public/icons/` und werden lokal ausgeliefert.

`vite-plugin-pwa` erzeugt Manifest und Workbox-Service-Worker beim Produktionsbuild.
Die relative App-ID, Startadresse und Scope unterstützen den Pages-Unterpfad.
Die Registrierung erfolgt ausschließlich auf der veröffentlichten Spielseite,
nicht auf der Landingpage und nicht im E2E-/DEV-Spiel. Es gibt keinen allgemeinen
Navigations-Fallback: fehlende DEV-Seiten bleiben auch mit Service Worker 404.
Updates warten bis zum Schließen der alten Spiel-Tabs, statt aktive Runden neu zu laden.
Für Offline-Prüfungen `npm run build` und `npm run preview` verwenden.

## Animationen vergleichen

Im Dev-Server `/animation-compare.html` öffnen oder im Spiel-Footer
**DEV · Animationen** wählen. Pixel und Sara verwenden dort die
Spiel-Assets und gemeinsamen Fußanker in genau einer Box je Figur. Jede Box bietet
alle Animationen, Größenregler, eigene Pause und Einzelschritt. Ein Auswahlwechsel
startet beim ersten Frame. Die oberen Tasten steuern beide gemeinsam; einzeln
pausierte Figuren bleiben beim gemeinsamen Fortsetzen angehalten.
Einmalige Reaktionen werden nur in dieser Arbeitsansicht wiederholt.
Die Vergleichsseite und ihre Quellen sind aus Produktions- und E2E-Builds
ausgeschlossen; fehlende Dev-Seiten dürfen dort keinen SPA-Fallback erhalten.

Asset-Verträge und reproduzierbare Exporte bleiben bei
[Pixel](../assets/pixel/README.md) und [Sara](../assets/sara/README.md).

Beide DEV-Seiten nutzen `src/dev/dev-shell.css` für Seitenbreite, Navigation,
Typografie und Bedienelemente. Die aktive Seite ist in der Navigation markiert;
„Zum Spiel“ führt zurück. Seitenspezifische Layouts bleiben in eigenen Stylesheets.

## Ballspiel als Bewegungsentwurf ansehen

`/ball-play-preview.html` zeigt im Dev-Server den Vorschlag für #186: hinschauen,
anstupsen, folgen, einfangen und zur Ruhe kommen. Zeitregler, Pause und Nahansicht
helfen beim Vergleichen von Posen und Dauer. Die kompakte Regalvariante bleibt am
Fundort; die Bodenalternative zeigt mehr Ballweg, aber noch keinen Abstieg.
Reduzierte Bewegung lässt Figuren und Ball am Platz. Fokusverlust pausiert.

Die Vorschau verwendet unveränderte [Pixel-Assets](../assets/pixel/README.md), den
vorhandenen Lieblingsball und die reguläre Raumzeichnung. Es entstehen keine
neuen Bildquellen oder Exporte. Bestehende Pfotenposen sind Platzhalter für die
Abstimmung. Die isolierte Szene erzeugt weder Hauptziel noch Punkte oder Heimkehr;
die Spielintegration folgt erst nach Freigabe des Mockups im Issue. HTML und
DEV-Module sind keine Build-Einstiegspunkte und fehlen im Produktionsbuild.

## Einzelne Objekte ausprobieren

Der Spiel-Footer zeigt ausschließlich im Dev-Modus **DEV · Playground**.
Auf der DEV-Seite führt ebenfalls **Playground** zu `/interactable-playground.html`.
Objektauswahl und Reset bilden eine kompakte Toolbar. Auf breiten Bildschirmen
steht die Live-Diagnose neben der höchstens 800 Pixel breiten Testszene; auf
schmalen Geräten darunter. Die Spielwelt und Physik bleiben dabei unverändert.
Die Auswahl stammt direkt aus dem Objektkatalog, einschließlich aller Varianten.
Pixel lässt sich ohne Rundenstart normal steuern; Sofa/Pflanze reagieren nach
kurzem Stillstand, der Vorhang beim Klettern/Rutschen und die Vase beim Schieben
vom Testregal. Touch-Geräte erhalten dieselbe Eingabe wie im Spiel.

Die Live-Diagnose zeigt Typ, Zustand, Chaos-Punkte und die letzten Chaos-Ereignisse.
Die Detailansicht enthält losgelöste Objekt-/Pixelwerte und Ressourcenanzahlen.
**Szene zurücksetzen**, Debug-R und Objektwechsel entsorgen den alten Durchlauf
und setzen Pixel, Schaden und Punkte zurück. Fokusverlust pausiert die Szene.
Es gibt keine Heimkehr, Rundenuhr oder gespeicherten Ergebnisse.

`object-playfield.ts` verdrahtet Physik und Interaktionsschritte gemeinsam für
Hauptspiel und Playground. Neue Katalogvarianten werden automatisch angeboten;
neue Objekttypen brauchen ihren regulären Resolver/Adapter, keine separate
Testmechanik. Die Testplatzierung folgt den bestehenden Fähigkeiten (Boden,
Kletterfläche oder Schiebeobjekt auf einem Regal). Besondere neue Geometrien
können eine Erweiterung dieser Platzierungsdaten erfordern.
Playground-HTML und DEV-Module fehlen wie der Animationsvergleich in allen Builds.

## Spielphasen gezielt prüfen

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
Gegenstände bleiben zunächst unbeschädigt. Heimkehr und Reaktion verwenden
bestehende Übergänge. Für Versöhnung und Ergebnis geht Pixel zunächst selbst
zu Sara; danach laufen Bestätigung und gegebenenfalls das echte Minispiel über
seine vorhandenen APIs. Es gibt keine direkten Herz-/Ergebnissetter.

Phasers vorhandener `RandomDataGenerator` steuert Saras Spruch und die
Pfeilfolgen reproduzierbar, ohne den globalen Zufall zu überschreiben. Gleicher
Seed, gleiches Szenario und gleiche Eingaben ergeben denselben Ablauf.
Die DEV-Anbindung wird dynamisch und generationsgebunden installiert; ein
Szenenwechsel entfernt Dialog, Tastenkürzel und Update-Listener. Sie exponiert
weder Engine-Objekte noch Mutatoren auf `window` oder dem Testobserver.

## Team-Porträts

Die Landingpage verwendet eigene Porträts unter `assets/team/`; die Spiel-Sprites
bleiben unverändert. `portraits-v1.json` enthält Referenzen, finale Prompts und
Exportparameter. `node tools/prepare-team-portraits.mjs` erzeugt die kleinen
128×128-Laufzeitdateien per Nearest Neighbor aus den erhaltenen Imagegen-Quellen.
Der Alpha-Kanal bleibt erhalten. Nur die kleinen Exporte werden von der Seite
geladen; Pixel wird dort per CSS zu Sara gespiegelt. Ricos Vorlage ist sein
öffentlicher GitHub-Avatar; die abgestimmte Haarfarbe steht im Asset-Briefing.

## Pause und Einstellungen

Esc oder **Menü** öffnet den szenengebundenen Pausendialog, auch vor dem Start.
Die Sprachwahl befindet sich ausschließlich dort. **Neue Runde** ist erst nach
Rundenstart sichtbar; der Ergebnis-Button bleibt erhalten. Der Dialog verwendet
den gemeinsamen DE-/EN-Katalog, speichert Sprache, Audiopegel, Bewegungswunsch
und Schwierigkeit lokal und bleibt
bei blockiertem Browser-Speicher funktionsfähig. **Optionen** in der Einführung
öffnet denselben Dialog. Die Schwierigkeit wird erst beim nächsten Rundenstart
übernommen; Presets und Snapshot-Vertrag stehen in der
[Gameplay-Architektur](architecture/gameplay.md#schwierigkeitsgrade).

`PlayActivity` verknüpft Menüpause mit Fokus/Sichtbarkeit. Fortsetzen verwirft das
erste Zeitdelta, während `InputFrames` eine dabei noch unbenutzte frische
Eingabeflanke für den nächsten aktiven Frame bewahrt. Cleanup verwirft den Puffer;
gehaltene Bewegung wird nicht wiederholt. Menütasten werden im Dialog behandelt,
damit Phasers globale Tastensperre native Regler und Formularbedienung nicht stört.

`AudioPreferences` speichert `master` und `effects` unter `pixels-world.audio`.
`GameAudio` setzt Gesamt- × Effektpegel und übernimmt Pause/Resume von der
Aktivitätsgrenze; Szenenabbau stoppt alte Sounds. Noch sind keine Audio-Assets
eingebunden. E2E-Snapshots enthalten nur losgelöste Pegel/Statuswerte.

## Visuelles Feedback abstimmen

`src/content/feedback.ts` enthält die kurzen Anzeigezeiten, Ausblenddauer und
Bewegungsdistanz. `FeedbackModel` beobachtet bereits vergebene Chaosereignisse und
vorhandene Phasen-/Versöhnungssnapshots. Es vergibt weder Punkte noch verändert es
Eingaben, Physik oder Domain-Zeit. Pro Kanal bleibt nur die jüngste Meldung; identische
Schadensereignisse lösen keine zweite Meldung aus.

`GameFeedback` zeigt am Desktop kompakte Hinweise in freien Zimmerrändern. Im
Handheld ersetzt dieselbe Rückmeldung kurz die vorhandene Statuszeile, ohne
neue Flächen über Dialog oder Pfeiltasten zu legen. Darstellung altert nur mit
aktiver Zeit; Pause, Fokusverlust und Lesesprachwechsel erzeugen keine neuen
Ereignisse. Reset entfernt Ansichten und Listener des vorherigen Durchlaufs.

`MotionPreferences` kombiniert `prefers-reduced-motion` mit dem Wunsch aus dem
Pause-Menü. `pixels-world.reduced-motion` speichert nur die lokale Auswahl.
Reduzierte Bewegung bleibt sichtbar als statischer Text ohne Versatz/Ausblenden;
eine Systemvorgabe kann im Spiel nicht aufgehoben werden. Audio-Cues warten auf
passende Assets, die vorhandenen Lautstärkeeinstellungen bleiben unverändert.

## Lesbarer TypeScript-Code

Prettier formatiert; ESLint mit typescript-eslint und gezielten Stylistic-Regeln
prüft den Code. Die Konfigurationen im Repository sind maßgeblich.

- Deklarationen dürfen zusammenstehen. Logische Blöcke, Bedingungen, Schleifen,
  Rückgaben, Funktionen und mehrzeilige Klassenmethoden durch Leerzeilen trennen.
- Kleine fachliche Schritte, sprechende Namen und frühe Rückgaben bevorzugen.
  Funktionen möglichst höchstens zehn Codezeilen; geringe Komplexität und
  Verschachtelung. Die genauen Grenzen stehen in [eslint.config.js](../eslint.config.js).
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

Ungenutzte Ausnahmen und Warnungen blockieren. Prüfungen, Reports und manueller
Spieltest: [QA](qa.md). Branches, Review und Dokumentationsregeln:
[CONTRIBUTING](../CONTRIBUTING.md). Release-Bedienung: [Deployment](deployment.md).

Die Rechtsseiten erhalten Copyright und Versionsanzeige aus demselben
`buildInfoMarkup` wie Landingpage und Spiel. Das Vite-Plugin `legal-footer.ts`
setzt diesen Block beim Ausliefern beziehungsweise Bauen statisch ein; die
Rechtsseiten benötigen dafür kein JavaScript und laden keine Spielengine.

Ein gemeinsamer DE-/EN-Footer-Hinweis benennt KI-erstellten Code, Grafiken und
Texte sowie Ricos Idee und Review. Auf den deutschen Rechtsseiten wird dieser
Hinweis ebenfalls statisch ausgeliefert.
