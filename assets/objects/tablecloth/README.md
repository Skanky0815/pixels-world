# Warme karierte Tischdecke

Eigene Pixel-Art für [#27](https://github.com/Skanky0815/pixels-world/issues/27), passend zur Bordeaux-/Creme-Küche. Erzeugt mit dem integrierten Bildwerkzeug; unveränderte Quellen unter `sources/`, vollständige [Prompts](generation-prompts.md). Das Muster ist deckend, die abgelegte Decke besitzt echte Transparenz.

`node tools/prepare-tablecloth-assets.mjs` exportiert `pattern.png` (32×32) und `pile.png` (112×36). Nearest-Neighbour übernimmt unveränderte RGB-Samples als 2×2-Cluster; beim transparenten Stoffhaufen bestimmen Alpha-Bounds ab 192 den Ausschnitt und binäres Alpha die Außenkante. Nur die beiden kleinen Export-PNGs gelangen ins Laufzeitbundle.

`TableclothArt` kachelt das Stoffmuster als zwölf Pixel hohe Tischkante und als 24 Pixel breites hängendes Ende. Beim Ziehen wird die verbleibende Auflage kürzer, das Ende wächst bis zum Boden und der begrenzte Stoffhaufen wird eingeblendet. Die Tischplattform bleibt stehen. Warnung und kleine Pendelbewegung geben Zeit zum Loslassen; bei reduzierter Bewegung bleibt das Ende gerade. Die Darstellung folgt derselben aktiven Zeit wie der tatsächliche Oberflächenzug. Pause hält beides an, Reset stellt die vollständige Decke wieder her.

Der Stoffhaufen hat keine eigenständige Physik. Verschobene Tischgegenstände nutzen ihre vorhandenen Körper, Kontakte, Fall- und Schadenszustände. Die Decke zählt erst beim vollständigen Abziehen oder tatsächlichem Auflagenverlust einmalig als ausgelaufenes Stoffobjekt; Teilzüge werden nicht als Albumfund bestätigt.
