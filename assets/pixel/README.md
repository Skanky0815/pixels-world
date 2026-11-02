# Pixel: 32×32-Animationen

`pixel-idle-master.png` ist Ricos bestätigter Stand-Sprite v3. Frame 0 in `pixel-sheet.png` ist bytegenau dieser Master. Das Sheet enthält 25 transparente Zellen à 32×32 auf 160×160 Pixeln; `pixel-sheet-preview.png` zeigt es fünffach vergrößert.

| Frames | Darstellung |
| --- | --- |
| 0–2 | Sitzen, Atmen, Blinzeln |
| 3–4 | Zusätzliche Standposen, derzeit ungenutzt |
| 5–9 | Seitlicher Laufzyklus, links gespiegelt |
| 10–12 | Aufstieg, Scheitelpunkt, Fall |
| 13–14 | Landung und Aufrichten |
| 15–18 | Klettern in Rückansicht |
| 19 | Festhalten/Rutschen in Rückansicht |
| 20–22 | Kratzen |
| 23–24 | Knabbern |

Mit dem eingebauten Bildwerkzeug anhand des bestätigten Masters erstellt; Originalprompt: `generation-prompt.md`. `pixel-sheet-source.png` ist die größere generierte Vorlage. Ihr Abstandsraster ist für direkte Engine-Nutzung zu ungenau.

`node tools/prepare-pixel-sheet.mjs` extrahiert 25 zusammenhängende Figuren und packt sie reproduzierbar per Nearest Neighbor. Schwache Alpha-Artefakte werden bei der Figurensuche ignoriert; übernommene Motivpixel behalten ihre Alpha-Werte. Pro Bewegungsgruppe gilt eine gemeinsame Skalierung. Bodenposen enden auf Zeile 30. Das Skript zeichnet keine Posen; Frame 0 wird aus dem Master übernommen.

Abspielreihenfolge und Geschwindigkeit: `src/pixel-animations.ts`. Gameplay bestimmt die Animation; Frames steuern weder Kollisionen noch Schaden. Die Quelldaten bleiben 32×32. Die Grunddarstellung im Spiel ist ohne Glättung 2× groß (64×64); die horizontal zentrierte Kollisionsfläche skaliert von 26×26 Quellpixeln auf 52×52 Spielpixel. Der Produktionsbuild lädt nur das gepackte Sheet.


Die Laufposen werden aus `pixel-walk-source.png` übernommen: kompakter Körper, größerer Kopf und aufgerichteter Schwanz halten die Figur auch beim Gehen annähernd so hoch wie den Idle. Dadurch muss ein langgestreckter Lauf nicht mehr in dieselbe quadratische Zelle hineingeschrumpft werden. Alle fünf Laufbilder sind mindestens 27 Quellpixel hoch (Idle: 30). Unit-Tests sichern diese Untergrenze ab. Die übrigen Posen und der bestätigte Master bleiben erhalten.

Ein separates sichtbares Sprite folgt dem festen Physikkörper am Pfotenanker. Gestreckte/geduckte Posen (Sprung, Fall, Landung, Kratzen, Knabbern) verwenden einen größeren Faktor als 2, weil ihre ursprünglichen Köpfe/Rümpfe im Sheet kleiner ausfallen. Ihre Zeichenfläche ist 94×94 für Sprung/Fall/Landung, 80×80 beim Knabbern und Kratzen; transparente Ränder und die Haltung bestimmen die tatsächliche Silhouette. Idle und korrigierter Lauf verwenden Faktor 2; Klettern und Rutschen Faktor 2,5 (80×80-Zeichenfläche, 25 % größer als zuvor). Die Textur wird weiterhin ohne Glättung gezeichnet; Sprung ist gegenüber der ersten Angleichung um zwei Spielpixel verkleinert; Knabbern und Kratzen wurden im direkten Vergleich zum Idle auf eine gemeinsame 80×80-Zeichenfläche abgestimmt. Die Physik bleibt durchgehend 52×52. [Korrektur-Prompt](walk-correction-prompt.md).
