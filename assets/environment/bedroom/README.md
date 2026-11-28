# Schlafzimmergrafiken

Finale Rasterfassung zur lokalen Abnahme von #58: dunkelgrüner Putz, warmes Holz, weiße Tür und Fenster, Walnussmöbel und Bordeaux-Bettdecke. Die freigegebene Aufteilung und ihre Kollisionsmaße bleiben erhalten. Bilder und Regale verwenden vorhandene Grafiken und Slots; neue Bilder werden über den Raumbezug im Katalog aufgenommen.

Originale und Referenzen bleiben unverändert in `sources/`. Die vollständigen [Prompts](generation-prompts.md) dokumentieren das integrierte Bildwerkzeug. Referenzen stammen aus dem Repository; deren bestehende Quellenangaben bleiben gültig. Fenster-v2 entfernt ausschließlich den dunklen Fleck in v1.

Export: `node tools/assets/prepare-bedroom-assets.mjs`. PNG, Nearest-Neighbour vom Alpha-Inhaltsrechteck, Alpha-Schwelle 192, binäres Alpha und identische 2×2-Pixelcluster. Opake Kacheln verwenden die gesamte Quelle. Keine Glättung.

Bett 264×128, Nachttisch 72×64, Schrank 120×278, Tür 112×216, Fenster 112×184, Putz 256×256, Boden 512×128. Möbeloberkante und Bodenkontakt bleiben an den bestehenden Spielauflagen; der Bettdurchgang bleibt transparent. Deckenleisten und zusätzliche weiße Fassungen sind native Rechtecke.

[Gegenstände und Zustände](../../objects/bedroom/README.md).
