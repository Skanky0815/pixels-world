# Schlafzimmerobjekte

Rastergrafiken zur lokalen Abnahme von #58, erzeugt mit dem integrierten Bildwerkzeug. Unveränderte Originale liegen unter `sources/`; vollständige [Prompts und Referenzen](../../environment/bedroom/generation-prompts.md) sind mit den Möbeln dokumentiert.

Export: `node tools/assets/prepare-bedroom-assets.mjs`. [Gemeinsamer Exportvertrag](../../environment/bedroom/README.md): Nearest-Neighbour, Alpha-Schwelle 192, binäres Alpha und identische 2×2-Cluster. Keine Emoji-Randregel.

| Grafik | Zellmaß | Anker und Zustand |
| --- | --- | --- |
| Kurzer Khaki-Vorhang | 40×120 | oben links, zwei Instanzen am Fenster |
| Khaki-Riss | 18×26 | acht getrennte Stellen pro Vorhang |
| Katzenbett | 96×30 | unten mittig, unter dem Bett |
| Lampe | 28×38 | bestehende Bruchphysik und Vasenpartikel |
| Läufer | 310×36 | bestehende Teppichaktion |
| Wäsche gefaltet/zerwühlt | 96×48 | unten mittig |
| Wäsche verteilt | 152×48 | gleicher Bodenkontakt |
| Korb aufrecht | 80×48 | unten mittig |
| Korb geleert | 152×48 | bereits seitlich gezeichnet; keine zweite Drehung |
| Grünlilie ganz/angeknabbert | 40×60 | gleicher Topfanker, vorhandene Kipplogik |

Physik und Slots bleiben unabhängig von der Grafik. Das Album verwendet dieselben finalen PNGs. Pixel nutzt beim Ruhen die vorhandenen Hinlege- und Rückenframes aus `assets/pixel/charm-v1/`; der Fußanker und die Physik bleiben unverändert.
