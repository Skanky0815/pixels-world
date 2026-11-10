# Charme: Köpfchen geben und Bauch zeigen

Die beiden neuen Reihen wurden mit dem eingebauten OpenAI-Bildgenerator anhand
des bestätigten `../pixel-idle-master.png` und des bestehenden Bewegungs-Sheets
erzeugt. Die Originale bleiben unverändert. Vollständige Prompts, Quellen und
Framezuordnung stehen in [generation-v1.json](generation-v1.json).

`node tools/prepare-charm-sprites.mjs` extrahiert sechs zusammenhängende Figuren
pro Quelle und packt sie reproduzierbar per Nearest Neighbor in `charm-sheet-v1.png`:
288×96 Pixel, zwölf 48×48-Zellen, Fußbasis Zeile 46. Je Aktion gilt ein gemeinsamer
Faktor mit höchstens 42 Pixel Breite und 30 Pixel Höhe. Der feste linke Einzug
erhält die Kopfbewegung, statt jede wechselnde Silhouette neu zu zentrieren.
Schwache Alpha-Artefakte werden wie im bestehenden Pixel-Exporter ignoriert;
übernommene RGBA-Samples bleiben unverändert. Die großen Quellen und das
vierfach vergrößerte Vorschau-Sheet gehören nicht in ein Laufzeitbundle.

- Frames 0–5: Kopf vorstrecken, Stirn senken, sanft drücken und lösen.
- Frame 6: Hinlegen; 7: Seitenlage; 8: Rückenlage.
- Frames 8–11: ruhiges Bauch-Atmen, Pfötchen und Blinzeln in Rückenlage.

Die lokale `/charm-preview.html` verwendet die neuen Kopf-/Bauch-Frames ohne
Drehen des Sitzbilds. Beim Fortfahren richtet sich Pixel einmal über die
umgekehrten Bauchposen auf und läuft zum Sitzanker. Die Schleife selbst endet
erst durch eine weitere Aktion. Die reguläre Spielintegration ist noch nicht
Teil dieses Bewegungsentwurfs. Die 48×48-Zelle gibt nur Platz für die Zeichnung;
das reguläre Bewegungs-Sheet und die Kollisionsmaße bleiben unverändert.
