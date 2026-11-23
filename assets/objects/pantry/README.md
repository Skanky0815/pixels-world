# Vorratsglas und Keksdose

Eigene Pixel-Art für [#227](https://github.com/Skanky0815/pixels-world/issues/227), passend zum warmen Walnuss-/Bordeaux-/Creme-Set der Küche. Erzeugt mit dem integrierten Bildwerkzeug; unveränderte Quellen unter `sources/`, vollständige [Prompts](generation-prompts.md). Die offene Dose verwendet die v2-Bearbeitung: Das aufgedruckte Herz dreht sich passend zur Lage mit.

`node tools/assets/prepare-pantry-assets.mjs` exportiert `jar.png` (28×34), `tin.png` (32×28), `jar-broken.png` (76×24), `tin-opened.png` (84×32) und `glass-shard.png` (8×8). Die Dose passt damit in kleine Auflagenplätze, das Glas braucht mittlere Kapazität. Alpha-Bounds ab 192 und Nearest-Neighbour übernehmen unveränderte RGB-Samples als 2×2-Cluster mit binärem Alpha. Der transparente Hintergrund stammt aus der Erzeugung. Nur die fünf kleinen Export-PNGs gelangen ins Laufzeitbundle.

Intakte und fallende Behälter verwenden denselben Sprite mit tatsächlicher Bewegung. Das Glas endet in sieben begrenzten Glassplittern und dem Streubild mit Nudeln und Deckel; die offene Dose zeigt Dose, Deckel und wenige Kekse als einen begrenzten Endzustand. Ein kurzer pausierbarer Tween stellt das Streuen dar; reduzierte Bewegung zeigt den Endzustand direkt. Der verstreute Inhalt hat keine eigene Kollisions- oder Schadensphysik.

Auf einer erhaltenen Auflage bleibt das Endbild an der Aufprallfläche. Verschwindet der Träger später, fallen Endbild und gegebenenfalls Splitter mit zum Boden, ohne einen weiteren Schaden auszulösen. Reset und Szenenwechsel entfernen die Bilder und laufenden Tweens vollständig.
