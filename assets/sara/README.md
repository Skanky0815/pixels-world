# Sara: Chibi-Animationen

`reference-v4/` bewahrt Ricos bestätigten Entwurf unverändert. `sara-sheet-v1.png`
ist der Laufzeitexport: zwölf transparente Zellen à **64×96**, sechs Spalten auf
**384×192 Pixeln**. Im Spiel gilt Faktor **2**, Origin **(0.5, 90/96)** und eine
gemeinsame Sohlenzeile **89**. Die bestätigte Idle-Silhouette bleibt 60 Quellpixel
bzw. 120 Spielpixel hoch. Sara ist eine reine sichtbare Figur ohne Physikkörper;
ihre Animation verändert weder Pixels Kollisionen noch Punkte oder Phasen.

| Frames | Key | Wiedergabe |
| --- | --- | --- |
| 0–1 | `sara-idle` | 0, 0, 1, 0 · 2 FPS · wiederholt |
| 2–5 | `sara-enter` | seitlicher Eintritt · 7 FPS · wiederholt |
| 6–7 | `sara-react-calm` | skeptischer Blick / Hand zum Kinn · 3 FPS · einmalig |
| 8–9 | `sara-react-annoyed` | Hände in die Hüften / trockene Geste · 3 FPS · einmalig |
| 10–11 | `sara-react-angry` | fassungslos / Hände am Kopf · 3 FPS · einmalig |

Die Brille bleibt in allen Posen erhalten. `src/game/actors/sara-animations.ts`
enthält die gemeinsam von Spiel und Dev-Vorschau verwendeten Werte. Reaktionen
halten nach ihrem einmaligen Abspielen den letzten Frame; die laufende Ansicht
startet sie nicht pro Frame neu. Nach Abschluss der Sequenz folgt wieder Idle.
Fokus-/Visibility-Pause hält auch Saras tatsächlichen Animationsframe an.

## Quelle und reproduzierbarer Export

`animation-v1/sara-sheet-source-v1.png` ist das unveränderte korrigierte Imagegen-Blatt.
Prompts stehen in `animation-v1/generation-prompts-v1.md`, Exportparameter in
`animation-v1/metadata-v1.json`. `animation-v1/sara-sheet-preview-v1.png` ist vierfach
per Nearest Neighbor vergrößert und wird nicht im Spiel geladen.

`node tools/prepare-sara-sheet.mjs` exportiert das Sheet erneut. Alle erzeugten Posen
verwenden denselben einmal aus dem Source-Idle bestimmten Maßstab. Der gemeinsame
horizontale Versatz richtet den Fußbereich am bestätigten Idle aus; es gibt keine
individuelle Neuskalierung einzelner Posen. Jede Pose wird auf dieselbe Sohlenzeile
verschoben, ihr Quellbereich begrenzt und ohne Glättung abgetastet. Alpha ab 192
wird deckend, alles andere transparent. Frame 0 übernimmt die unveränderte
Silhouette des bestätigten Raster-Idle (dessen Alpha ist bereits binär).

Alle zwölf Frames werden gemeinsam auf dieselbe feste **24-Farben-Palette** abgebildet,
ohne Dithering. Der alte Referenzexport mit 709 RGB-Werten bleibt separat erhalten;
Frame 0 ist deshalb geometrisch gleich, aber ausdrücklich nicht bytegleich zur
farbreicheren Vorlage. Das Skript zeichnet weder Arme noch Augen oder Bewegungsposen.

## Vergleich im Spielmaßstab

Im lokalen Dev-Server `/animation-compare.html` öffnen: Eine Box je Figur bietet
alle Animationen. Saras Box zeigt die bestätigte Idle-Silhouette und Pixel als
Größenreferenz, mit Auswahl und Größenregler. Pause und Einzelschritt funktionieren
je Figur sowie gemeinsam; ein Auswahlwechsel startet beim ersten Frame. Die Dev-Seite wiederholt
einmalige Reaktionen zur Kontrolle; das Spiel spielt sie einmalig ab. Die Seite ist
kein Produktionsartefakt. Dialog-/Score-Auswahl bleiben im bestehenden Domain-Modell.
