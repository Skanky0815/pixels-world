# Kühlschrank

Eigene Pixel-Art für [#87](https://github.com/Skanky0815/pixels-world/issues/87), passend zu Creme, Bordeaux und warmem Walnussholz der Küche. Erzeugt und überarbeitet mit dem integrierten Bildwerkzeug (`image_gen`), mit echter Transparenz. Unveränderte ausgewählte Quellen liegen in `sources/`; vollständige [Prompts](generation-prompts.md).

`node tools/prepare-fridge-assets.mjs` exportiert `upright.png` (160×320) und `open.png` (208×320). Automatische Alpha-Bounds über 32, Nearest-Neighbour-Samples und 2×2-Cluster übernehmen die RGB-Werte; Alpha wird bei 128 binär gerastert. Nur die beiden kleinen Export-PNGs werden im Spiel geladen.

Der Kühlschrank bleibt stehen. Der erste getrennte Ansprung lässt den geschlossenen Kühlschrank wackeln. Beim zweiten Ansprung muss Pixel die linke Klinke erreichen: Er hängt erst sichtbar daran, zieht die Tür auf und verschwindet dann für einen begrenzten Besuch. Eine aus Pixelrechtecken gezeichnete saubere Innenansicht und die horizontal aufgezogene Tür bilden die Öffnungsphase ohne zusätzliches Bitmap ab; danach zeigt die offene Tür schiefe Ablagen und durcheinandergebrachte Lebensmittel. Die gezeichneten Lebensmittel sind Teil des Zustandsbildes und keine separat simulierten Weltobjekte. Die obere Auflage und ihre lose Dekoration bleiben bestehen. Reduzierte Bewegung unterdrückt das Wackeln, Pause hält den Ablauf an und Reset stellt den geschlossenen Zustand wieder her.

Die Quellen wurden zunächst für kleinere Zellen entworfen. Rico hat für den Maßstab zur Arbeitsplatte ausdrücklich die doppelte Größe gewählt; die Exporte tasten die unveränderten großen Quellen direkt mit den finalen Abmessungen ab.
