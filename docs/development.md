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

## Einzelne Objekte ausprobieren

Der Spiel-Footer zeigt ausschließlich im Dev-Modus **DEV · Playground**.
Auf der DEV-Seite führt ebenfalls **Playground** zu `/interactable-playground.html`.
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
