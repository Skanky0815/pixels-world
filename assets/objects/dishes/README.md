# Tasse, Teller und Keramikscherbe

Eigene Pixel-Art für [#226](https://github.com/Skanky0815/pixels-world/issues/226), erzeugt mit dem integrierten Bildwerkzeug. Cremefarbene Keramik mit Bordeauxrand und warmbraunen Konturen passt zum Küchenset. Die unveränderten transparenten Originale liegen in `sources/`; die vollständigen [Prompts](generation-prompts.md) gehören zur Quelle.

`node tools/prepare-dish-assets.mjs` exportiert `cup.png` (24×26), `plate.png` (32×10) und `shard.png` (10×8). Das Werkzeug beschneidet Alpha-Grenzen ab 192, sampelt proportional per Nearest-Neighbour auf die halbe Zielgröße und schreibt die unveränderten RGB-Samples als 2×2-Cluster mit binärem Alpha. Der transparente Hintergrund stammt aus der Erzeugung. Nur die kleinen Exporte werden im Spiel gebündelt.

Intaktes und fallendes Geschirr verwendet denselben Sprite mit tatsächlicher Bewegung und Drehung. Sieben begrenzte Scherben bilden den einmaligen Bruchzustand. Reduzierte Bewegung unterdrückt die Drehung; Reset entfernt die Scherben. Beide Varianten nutzen dieselbe gemeinsame Physik und Schadenshistorie wie Vasen.
