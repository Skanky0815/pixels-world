# Lesbarer TypeScript-Code

Code soll sich auch ohne tiefe Phaser-Kenntnisse nachvollziehen lassen. Bestehende
ESLint-/typescript-eslint-Fehlerregeln und der strikte Typecheck bleiben erhalten.
Prettier übernimmt die Darstellung: zwei Leerzeichen, einfache Anführungszeichen,
Semikolons und bis zu 100 Zeichen pro Zeile. Bestehende Bezeichner bleiben erhalten.

## Lokal arbeiten

- `npm ci`: reproduzierbar installieren.
- `npm run lint`: Fehler und Warnungen blockieren; Lesbarkeitsregeln sind verbindlich.
- `npm run format:check`: Formatierung im gesamten Repository prüfen; Abweichungen blockieren.
- `npm exec prettier -- --write <Dateipfad>`: nur bearbeitete Dateien formatieren.
- `npm run format`: das gesamte Repository einheitlich formatieren.
- `npm run typecheck`: Typen prüfen; auch in `npm run build` enthalten.
- `npm run qa`: Formatierung, Lint, Unit-Tests, Typprüfung und Produktionsbuild.

Formatierung in einem eigenen Commit durchführen. Anschließende Umstrukturierungen
müssen das Verhalten erhalten und in einen separaten Commit oder PR. Bei Gameplay-,
Rendering- oder Teständerungen zusätzlich `npm run test:e2e` ausführen.

## Logische Blöcke und Funktionen

Deklarationen dürfen zusammenstehen. Vor Bedingungen, Schleifen, `try`, `switch`
und `return` sowie nach abgeschlossenen Kontrollblöcken und zwischen Funktionen
steht eine Leerzeile. Mehrzeilige Klassenmethoden werden ebenfalls getrennt.
`@stylistic/eslint-plugin` prüft diese semantischen Abstände; Prettier erfindet sie
nicht selbst und erhält einzelne Leerzeilen. Keine vollständige Stylistic-Preset-
Konfiguration aktivieren, die mit Prettier um Einrückung oder Umbrüche konkurriert.

Funktionen und Methoden sollen möglichst höchstens zehn Codezeilen enthalten;
Leerzeilen und Kommentare zählen nicht, Signatur und Klammern schon. Bevorzugt
sprechende Namen, frühe Rückgaben und kleine fachliche Schritte. Richtwerte:
zyklomatische Komplexität höchstens acht, Verschachtelung höchstens drei Ebenen.
Tests werden ebenfalls geprüft; lange Szenarioabläufe können bewusst zusammenbleiben.

Zehn Zeilen sind ein Hinweis, kein Anlass für unverständliche Einzeiler oder künstliche
Hilfsfunktionen. Zusammenhängende Validierung, Phaser-Lifecycle und deklarative
Grafik-/Content-Aufbauten können länger bleiben, wenn Aufteilen das Verständnis
verschlechtert. Neue bewusste Ausnahmen im Code konkret begründen, etwa:

```ts
// eslint-disable-next-line max-lines-per-function -- Ein atomarer Validierungsschritt; getrennte Prüfungen würden den Vertrag zerstreuen.
function validateDefinition(/* ... */) {
  // ...
}
```

Keine pauschalen Dateiausschlüsse, globalen Abschaltungen oder höheren Grenzwerte
verwenden. Ausnahmen gelten nur für den unmittelbar folgenden Funktionsknoten.
Unbenutzte Ausnahmen schlagen als Fehler fehl und müssen entfernt werden.

## Verbindliche Prüfungen nach der Bereinigung

`format:check` und `lint` sind lokal und in der QA verpflichtend. `qa` enthält beide
Prüfungen; Release und Pages verwenden denselben Befehl. In der separaten QA-Pipeline
bleiben Formatierung, Lint, Unit-Report und Build einzelne Schritte, damit die
Testzusammenfassungen erhalten bleiben. Der frühere nicht blockierende
Formatierungsbericht entfällt. Komplexität, Verschachtelung, logische Leerzeilen und
Funktionslänge sind als Fehler konfiguriert; `--max-warnings 0` fängt weitere Warnungen ab.

## Bewusste Längenausnahmen

Die Zehnzeilenregel zählt auch mehrzeilige Signaturen, Objektliterale und ausgeschriebene
Aufrufparameter. Sie ist daher ein strenger Hinweis auf Überprüfung, kein Maß für die
Zahl fachlicher Schritte. Nach dem Aufteilen der Bewegungs-, Interaktions- und
Auflösungslogik bleiben ausdrücklich lokale, kommentierte Längenausnahmen bestehen:

- Zusammenhängende Testabläufe behalten Vorbereitung, Aktionen und Assertions in
  einem Szenario; die Bildauswertung ist als eigene Routine ausgelagert.
- Flache Snapshots und Konfigurationsverträge bleiben vollständig ausgeschrieben,
  statt durch verstreute Teilobjekte oder verdichtete Einzeiler verdeckt zu werden.
- Kleine Validierungsgruppen behalten ihre Fehlerreihenfolge; Referenzauflösung und
  Zykluswache bleiben gemeinsam nachvollziehbar. Der Resolver besitzt nur Zustand
  für einen Aufruf, keinen Cache über Runden hinweg.
- Zeichenroutinen und Phaser-Initialisierung dürfen ihre zusammengehörigen Parameter
  und die nötige Reihenfolge zeigen.
- E2E-Import und Snapshot bleiben innerhalb derselben Buildbedingung. Die
  Produktionsbuild-Isolation wird weiterhin im Browser geprüft.

Die Bestandbereinigung ergänzt 117 lokal begründete Ausnahmen, davon 116 nur für die
Länge und eine zusätzlich für die zusammenhängende Vorhangvalidierung (Komplexität
neun). Die bereits begründete Couch-Konfigurationsvalidierung bleibt erhalten.
Das ist keine Behauptung, alle Funktionen hätten nun höchstens zehn Zeilen.
Neue Ausnahmen müssen im Review fachlich begründet werden; die dokumentierte Zahl
beschreibt diesen Bereinigungsschritt und ist keine automatisch gepflegte Baseline.
