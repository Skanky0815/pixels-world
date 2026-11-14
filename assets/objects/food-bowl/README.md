# Pixels Futternapf

Transparenter Keramiknapf im warmen Bordeaux-/Creme-Stil der Küche aus [#230](https://github.com/Skanky0815/pixels-world/issues/230).
`food-bowl.png` ist 36×16 Pixel groß und liegt mittig mit seiner Unterkante auf der
validierten Zielauflage. Er ist ein geschütztes Hauptziel, kein verschiebbarer oder
zerstörbarer Chaosgegenstand. Dieselbe Grafik dient als Album-Bild.

Erzeugt mit dem integrierten Bildwerkzeug. Unveränderte Quelle unter
`sources/food-bowl-source-v1.png`; vollständiger [Prompt](generation-prompt.md).
`node tools/prepare-food-bowl.mjs` schneidet auf Alpha-Grenzen ab 192 zu, sampelt per
Nearest-Neighbour auf 18×8 logische Pixel und schreibt unveränderte RGB-Werte als
2×2-Cluster mit binärem Alpha. Kein Hintergrund wird nachträglich entfernt.

Pixels Fressanimation verwendet die vorhandenen Pixel-Bilder 13 (Absenken), 23/24
(Knabbern) und 2 (Aufrichten), ergänzt um kurze Ausrichtung mit den Gehbildern.
Alle Posen behalten den Fußanker auf derselben Arbeitsplatte; Physik und Wertung
stehen während des sichtbaren Fressmoments still. Bei reduzierter Bewegung bleibt
die Knabberpose ruhig. Der Napf gehört mit der öffentlich auswählbaren Küche zum Album; die separate DEV-Vorschau bleibt ein Testraum.
