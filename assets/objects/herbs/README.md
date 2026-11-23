# Küchenkräuter

Basilikum, Petersilie und Minze für [#229](https://github.com/Skanky0815/pixels-world/issues/229) verwenden warme Terrakottatöpfe mit Bordeauxrand. Eigene Grafiken aus dem integrierten Bildwerkzeug; unveränderte Quellen unter `sources/`, vollständige [Erzeugungs- und Bearbeitungsprompts](generation-prompts.md). Basilikum ist die Ausgangsgrafik; die beiden anderen Varianten übernehmen deren Topf und Aufbau.

Jede Quelle enthält links den intakten und rechts den angeknabberten Zustand. `node tools/assets/prepare-herb-assets.mjs` trennt die beiden Hälften, bestimmt Alpha-Grenzen ab 192 und richtet beide Zustände am Topfmittelpunkt und der gemeinsamen Unterkante aus. Dieselbe proportionale Skalierung bewahrt die kleinere angeknabberte Silhouette. Nearest-Neighbour übernimmt unveränderte RGB-Samples als 2×2-Pixelcluster mit binärem Alpha. Jeder Export ist 40×60 Pixel groß; nur die sechs kleinen PNGs werden im Spiel gebündelt.

Der gekippte Zustand verwendet den jeweiligen aktuellen Sprite in der bestehenden statischen Kippstellung. Die begrenzte Erde stammt unverändert aus dem Katzengras-Set. Auf erhöhten Auflagen wird sie auf die Trägerbreite begrenzt; bei Auflagenverlust folgen Topf und Erde derselben Fallbewegung. Laufende Dreh-/Wackelbewegungen respektieren reduzierte Bewegung, Pause und Reset.
