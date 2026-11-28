# Arbeitszimmergrafiken

Finale Rasterfassung zur lokalen Abnahme von #59: kompakter niedriger Schreibtisch mit heller Eichenplatte und anthrazitfarbenem Metallgestell, dunkelblauer Gamingstuhl mit türkisen Details, geschlossenes Regal mit eigenen Holzbrettern und ein Monitor mit Tastatur. Weiße Tür und Fenster, Bücher, Grünlilien und Lampe werden aus den vorhandenen Familien wiederverwendet.

Originale und freigegebene Layoutreferenz bleiben unverändert unter `sources/`. Die vollständigen [Prompts](generation-prompts.md) dokumentieren das integrierte Bildwerkzeug. Der Tisch verwendet v2 (moderner, schmaler; ursprünglicher Entwurf bleibt als Quelle erhalten). Das Regal verwendet v2, die ausschließlich eine unerwünschte transparente Stelle in v1 schließt. Stilreferenz: [Küchengrafiken](../kitchen/README.md), insbesondere `kitchen-table.png`.

Export: `node tools/assets/prepare-study-assets.mjs`. Alpha-Inhaltsrechteck ab 192, Nearest-Neighbour auf halbe logische Größe, dann identische 2×2-Cluster mit binärem Alpha. Tisch 280×148, Stuhl 80×156, Regal 136×318, Brett 116×14, Monitor 110×96. Die Sitzfläche liegt 88 Pixel unter der oberen Stuhlkante. Der Export verankert sie sowie die Regalbretter ausdrücklich an den genehmigten Spielauflagen (Welt-y400, y150/260/360). Die Quelldatei wird dafür nicht verändert; dokumentierte vertikale Segmente werden beim Export auf diese Anker abgebildet. Tischoberkante jetzt y320; Boden bleibt y468. Der Regalbretteinsatz stammt aus dem mittleren Quellbrett.

[Gegenstände und Poster](../../objects/study/README.md). Tür rechts, Lieblingsspielzeug auf der linken Fensterbank. Die Spielwiese übernimmt dieselben Möbel und Auflagen.
