# Trockenfutterbeutel

Pixel-Art für den optionalen Küchengegenstand aus [#230](https://github.com/Skanky0815/pixels-world/issues/230), passend zum cremefarbenen Papier und Bordeaux des Küchen-Sets.

| Export | Maße | Zustand |
| --- | --- | --- |
| `food-bag-intact.png` | 32×44 | Aufrechter Papierbeutel mit Pfote und Futteraufdruck |
| `food-bag-spilled.png` | 96×28 | Aufgeklappter liegender Beutel mit begrenzter Futterstreufläche |

Erzeugt mit dem integrierten Bildwerkzeug. Unveränderte Quellen, verwendete
Bildreferenzen und vollständige [Prompts](generation-prompts.md) sind gespeichert.
Der aufrechte Export verwendet v1, der ausgelaufene v3. In den aufeinander
aufbauenden Edits drehen sich Pfote und gedruckte Futterstücke mit der Verpackung.
Die außerhalb liegenden Futterstücke bleiben auf dem Boden.

```sh
node tools/prepare-food-bag.mjs
```

Der Export mit `pngjs` schneidet auf Alpha-Grenzen ab 192 zu, sampelt mit
Nearest-Neighbour auf die halben Zielmaße und schreibt unveränderte RGB-Samples als
2×2-Cluster mit binärem Alpha. Transparenz stammt aus dem Bildwerkzeug.

Beide Grafiken verwenden den gleichen mittigen Bodenanker. Der Streuzustand zeigt
die Kippbewegung nach rechts; für einen Stoß von rechts spiegelt die Darstellung
die Fallrichtung. Bei reduzierter Bewegung entfallen zusätzliches Wackeln und
Rotation, aktive Zeit, reale Lage und Schadensgrenzen bleiben gleich.
Die gemeinsamen Aufprall-Samples der Bücher begleiten das Umkippen.

Der Beutel bleibt bis zur Küchenfreigabe `previewOnly`. Sein Albumfund verlangt
den vollständig ausgelaufenen Zustand (`spill`, Stufe 1); Auflage, Napfkontakt und
veröffentlichte Erfolgsziele werden davon getrennt behandelt.
