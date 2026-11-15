# Kühlschrank

Eigene Pixel-Art für [#87](https://github.com/Skanky0815/pixels-world/issues/87), passend zu Creme, Bordeaux und warmem Walnussholz der Küche. Erzeugt und überarbeitet mit dem integrierten Bildwerkzeug (`image_gen`), mit echter Transparenz. Unveränderte ausgewählte Quellen liegen in `sources/`; vollständige [Prompts](generation-prompts.md).

`node tools/prepare-fridge-assets.mjs` exportiert `upright.png` (160×320), `ajar.png` (160×320) und `open.png` (208×320). Automatische Alpha-Bounds über 32, Nearest-Neighbour-Samples und 2×2-Cluster übernehmen die RGB-Werte; Alpha wird bei 128 binär gerastert. Nur die drei kleinen Export-PNGs werden im Spiel geladen.

Der Kühlschrank bleibt stehen. Ein gezielter Sprung an die linke Klinke lässt Pixel kurz sichtbar daran festhalten. Sprünge gegen die Seiten starten weder Vorwackeln noch Besuch. Die Tür steht zunächst einen Spalt offen (`ajar.png`), Pixel verschwindet dahinter, dann ist sie wieder geschlossen (`upright.png`) und der Kühlschrank wackelt während des Besuchs. Zum Ausstieg öffnet sich die Tür erneut und bleibt mit Innenchaos offen (`open.png`); erst dann steht Pixel wieder draußen. Kein Zustand staucht die Türgrafik, die provisorische Innenzeichnung entfällt. Die gezeichneten Lebensmittel bleiben Teil des Zustandsbildes und keine separat simulierten Weltobjekte. Auflage, lose Dekoration und Körper bleiben erhalten. Pause/Fokusverlust halten alle Phasen an, Reset und Rundenende geben Pixel zuverlässig frei; reduzierte Bewegung unterdrückt das Wackeln.

Die Quellen wurden zunächst für kleinere Zellen entworfen. Rico hat für den Maßstab zur Arbeitsplatte ausdrücklich die doppelte Größe gewählt; die Exporte tasten die unveränderten großen Quellen direkt mit den finalen Abmessungen ab.
