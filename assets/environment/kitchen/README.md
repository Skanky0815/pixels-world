# Küchengrafiken

Eigenständige Pixel-Art für den Küchen-Grundraum aus [#57](https://github.com/Skanky0815/pixels-world/issues/57).
Hocker und Tisch aus dunklem Walnussholz, warme bordeauxrote Küchenfronten mit Messinggriffen,
warmen Wandputz, cremefarbene Fliesen hinter der Arbeitsplatte und braune Bodenfliesen verwenden den Stil des bestehenden Wohnzimmers.
Die Tür und das Fenster stammen weiterhin aus dessen gemeinsamem Grafikset.

| Export | Spielmaß | Verwendung |
| --- | --- | --- |
| `kitchen-stool.png` | 80×70 | Hocker; Sitzfläche kollidiert, Beine sind Kulisse |
| `kitchen-table.png` | 220×140 | Tisch; Platte kollidiert, Beine sind Kulisse |
| `kitchen-counter.png` | 340×210 | Feste Küchenzeile mit geschlossenem Kollisionskörper |
| `kitchen-wall-cabinet.png` | 340×78 | Hängeschränke als statische Kulisse |
| `kitchen-plaster.png` | 256×256 | Warmer, wiederholter Wandputz |
| `kitchen-wall-tiles.png` | 256×256 | Wiederholter Fliesenspiegel |
| `kitchen-floor-tiles.png` | 512×512 | Wiederholte Bodenfliesen ohne zusätzliche Skalierung |

## Quellen und Export

Die unveränderten Bildwerkzeug-Quellen, exakten Stil-/Layoutreferenzen und
[Prompts](generation-prompts.md) liegen hier unter `sources/` beziehungsweise in der
verlinkten Promptdatei. Erzeugt mit dem integrierten Bildwerkzeug, nicht mit der CLI.
Der Fliesenspiegel reicht zwischen Ober- und Unterschränken über die Breite der
Küchenzeile; alle anderen Wandbereiche zeigen Putz. Die Deckenleiste stammt aus dem
gemeinsamen Wohnzimmer-Set.

Der Export verwendet die warmen Quellen: Hocker/Tisch/Boden v2 und Unter-/Hängeschränke
v3. Frühere Quellen bleiben als Eingaben der dokumentierten Farb- und Alpha-Edits
erhalten; versehentliche Alpha-Löcher sind in den gewählten Fronten korrigiert.

```sh
node tools/prepare-kitchen-assets.mjs
```

Der Export verwendet `pngjs`. Möbel werden anhand der Alpha-Grenzen ab 192 auf die
vorgegebenen Frontalmaße gebracht. Texturen verwenden die komplette Quellfläche.
Zuerst werden per Nearest-Neighbour logische Pixel in halber Exportgröße abgetastet,
dann unverändert als 2×2-Cluster ausgegeben. Die übernommenen RGB-Werte bleiben erhalten;
Alpha wird binär, Zwischenräume und Hintergründe der Möbel bleiben transparent.
Die obere Bildkante liegt jeweils auf der Plattformoberfläche, die Füße am Raumboden.
Grafik, Auflagehöhe und Kollisionsmaße sind gemeinsam zu pflegen; keine nachträgliche
Änderung der Sprungroute allein zur Bildanpassung.

`src/game/assets/kitchen-art.ts` lädt das Set für den Küchenraum. Der Grundraum bleibt
zunächst eine DEV-Vorschau; die öffentliche Raumfreigabe und das echte Napfziel
sind davon getrennt.
