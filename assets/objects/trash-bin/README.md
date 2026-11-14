# Küchenmülleimer

Eigene Pixel-Art für [#228](https://github.com/Skanky0815/pixels-world/issues/228), passend zur warmen Bordeaux-/Creme-Küche. Erzeugt mit dem integrierten Bildwerkzeug, echte Transparenz; unveränderte Quellen unter `sources/`, vollständige [Prompts](generation-prompts.md).

`node tools/prepare-trash-bin-assets.mjs` exportiert den geschlossenen Eimer als `intact.png` (40×48) und den umgekippten Eimer samt Deckel und begrenztem Küchenmüll als `spilled.png` (110×38). Alpha-Bounds ab 192 und Nearest-Neighbour übernehmen RGB-Samples unverändert in 2×2-Clustern mit binärem Alpha. Nur diese beiden kleinen Export-PNGs gelangen ins Laufzeitbundle.

Der gemeinsame `TopplingContainer`-Adapter verwendet aktive Spielzeit für Warnung, Abbruch, Kippen und einmaliges Ausleeren. Die intakte Grafik kippt in die tatsächliche Stoßrichtung, während der begrenzte Endzustand eingeblendet wird. Bei reduzierter Bewegung entfällt die Drehung. Der Deckel und der verstreute Müll haben keine eigene Partikelphysik und erzeugen keinen zusätzlichen Schaden. Beim Kippen kann der tatsächliche Eimerkörper weitere Gegenstände über das gemeinsame Kontaktsystem anstoßen. Pause hält den Fortschritt an; Reset stellt den geschlossenen Eimer wieder her.
