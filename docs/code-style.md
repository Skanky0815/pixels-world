# Lesbarer TypeScript-Code

Code soll sich auch ohne tiefe Phaser-Kenntnisse nachvollziehen lassen. Bestehende
ESLint-/typescript-eslint-Fehlerregeln und der strikte Typecheck bleiben erhalten.
Prettier übernimmt die Darstellung: zwei Leerzeichen, einfache Anführungszeichen,
Semikolons und bis zu 100 Zeichen pro Zeile. Bestehende Bezeichner bleiben erhalten.

## Lokal arbeiten

- `npm ci`: reproduzierbar installieren.
- `npm run lint`: bestehende Fehler blockieren; neue Lesbarkeitsregeln warnen.
- `npm run format:check`: Formatierungsbedarf im Repository anzeigen.
- `npm exec prettier -- --write <Dateipfad>`: nur bearbeitete Dateien formatieren.
- `npm run format`: bewusst das gesamte Repository formatieren; erzeugt derzeit einen großen Diff.
- `npm run typecheck`: Typen prüfen; auch in `npm run build` enthalten.
- `npm run qa`: Lint, Unit-Tests, Typprüfung und Produktionsbuild.

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

Keine pauschalen Dateiausschlüsse oder globalen Abschaltungen ergänzen. Bestehende
Warnungen bleiben zunächst sichtbar, statt überall nachträgliche Ausnahmen einzutragen.

## Einführung in der CI

1. Bestehende Fehler bleiben blockierend. Die neuen Lesbarkeitsregeln laufen als
   Warnungen; deshalb entfällt das bisherige `--max-warnings 0`. Kein bestehendes
   Fehlerniveau wird herabgesetzt. Typprüfung, Unit-Tests und Build bleiben Pflicht.
2. Die Formatierungsprüfung läuft im QA-Workflow separat und zunächst mit
   `continue-on-error: true`. Ihr Fehlschlag zeigt den Bestand, blockiert aber keine
   fachlich unabhängigen Änderungen. Lokal liefert der Check weiterhin Exitcode 1.
3. Bestehende Dateien gezielt formatieren und danach in getrennten Änderungen
   refaktorieren. Warnungen beim Anfassen prüfen und möglichst abbauen.
4. Wenn der Formatierungsbestand bereinigt ist, `continue-on-error` entfernen und
   `format:check` in `qa` aufnehmen. Nach Prüfung der verbliebenen Ausnahmen einzelne
   Lesbarkeitsregeln auf `error` heben. Diese Verschärfung erfolgt ausdrücklich in
   einem späteren Review; es gibt derzeit keine automatische Warnungs-Baseline.

Die Einführung erzwingt daher noch keinen Rückgang der Warnungszahl. Neue Warnungen
müssen im Review bewertet werden. Release- und Deployment-Gates bleiben erhalten;
der anfängliche Formatierungsbericht wird nur im QA-Workflow ergänzt.
