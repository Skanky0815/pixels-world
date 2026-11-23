# Warme karierte Tischdecke

Eigene Pixel-Art für [#27](https://github.com/Skanky0815/pixels-world/issues/27), passend zur Bordeaux-/Creme-Küche. Erzeugt mit dem integrierten Bildwerkzeug; unveränderte Quellen unter `sources/`, vollständige [Prompts](generation-prompts.md). Das Muster ist deckend, die abgelegte Decke besitzt echte Transparenz.

`node tools/assets/prepare-tablecloth-assets.mjs` exportiert `pattern.png` (32×32) und `pile.png` (112×36). Nearest-Neighbour übernimmt unveränderte RGB-Samples als 2×2-Cluster; beim transparenten Stoffhaufen bestimmen Alpha-Bounds ab 192 den Ausschnitt und binäres Alpha die Außenkante. Nur die beiden kleinen Export-PNGs gelangen ins Laufzeitbundle.

`TableclothArt` kachelt das Muster als zwölf Pixel hohe Tischkante und als zwei je 24 Pixel breite, zunächst 60 Pixel lange Überhänge. Beide Enden bleiben über dem Boden. Pixel kann sie mit ↑ gezielt greifen und wirklich hochklettern; sein Gewicht zieht die Decke dabei nach links oder rechts. Die Stofffläche auf dem Tisch wird entsprechend kürzer, das belastete Ende länger und das andere kürzer. Auch beim Ziehen bleibt mindestens 24 Pixel Abstand zum Boden. Nach vollständigem Abziehen liegt der begrenzte Stoffhaufen auf der gezogenen Seite; die Tischplattform bleibt stehen.

Die vorhandene Vorhang-Kletterbewegung wird mit bewusster Greifabsicht und geringerer Aufstiegsgeschwindigkeit unter Last wiederverwendet. Warnung und Pendelbewegung geben Zeit zum Abspringen; bei reduzierter Bewegung bleiben beide Enden gerade. Darstellung und tatsächlicher Oberflächenzug verwenden dieselbe aktive Zeit. Pause hält beides an, Reset stellt beide kurzen Überhänge wieder her. Nach dem Abreißen ist die Decke nicht mehr bekletterbar und Pixel fällt mit seiner normalen Schwerkraft.

Der Stoffhaufen hat keine eigenständige Physik. Verschobene Gegenstände verwenden ihre bestehenden Körper, Kontakte, Fall- und Schadenszustände. Richtungswechsel schieben nur noch aufliegende Gegenstände real zurück; bereits gefallene Inhalte werden nicht zurückgelegt. Die Decke zählt bei vollständigem Abziehen oder tatsächlichem Auflagenverlust einmalig. Ein Teilzug ist kein bestätigter Albumfund.
