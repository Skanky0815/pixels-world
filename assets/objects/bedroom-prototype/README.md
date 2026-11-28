# Vorläufige Schlafzimmergrafiken

Diese geometrischen Platzhalter dienen der lokalen Prüfung von #58. Sie sind
keine freigegebenen Produktionssprites. Bett, Nachttisch und Kleiderschrank zeichnet
`game/play/objects/bedroom-furniture-art.ts` an den tatsächlichen Auflagen;
`laundry-art.ts` zeigt die Zustände von Wäscheberg und Korb. Perspektive:
Seitenansicht und feste Bodenanker. Die Wand ist dunkelgrün mit warmweißen
Absetzungen an Decke, Fenster und Tür; Möbel und Stoffe ergänzen Bordeaux und Petrol. Warme Holzdielen und ein rostfarbener Läufer mit heller Bordüre ergänzen den Boden.

Die SVG-Originale in diesem Ordner sind von Hand beschriebene Blockgrafiken,
ohne externe Bildquellen oder generative Prompts. Der bestehende PNG-Vertrag
für Spiel und Album bleibt erhalten. Export mit installiertem Playwright/Chromium:

```sh
node tools/assets/prepare-bedroom-prototype.mjs
```

Der Export rendert jedes SVG unverändert in Originalgröße bei DPR 1 auf
transparenten Hintergrund: Katzenbett 96×30, Wäsche 96×48, Korb 96×56, Lampe 28×38 und Läufer 310×36; Grünlilie intakt/angeknabbert jeweils 40×60. Keine
nachträgliche Glättung oder Skalierung. Finale Möbel-, Stoff- und Schlafposen
werden gemeinsam mit Rico ausgewählt und ersetzen diese Platzhalter erst nach
visueller Abnahme; ihre Quellen und Exportverträge bleiben bei der Assetfamilie.

Ricos Vorgabe für die finale Türgrafik: weißes Türblatt und weiße Einfassung.
Die aktuelle Holz-Tür ist weiterhin der vorhandene Platzhalter. Lampe und Läufer
verwenden jetzt die gemeinsamen Bruch- bzw. Teppichmechaniken; ihre SVGs bleiben
bewusst vorläufige Darstellung.

Die [Rasterfassung](../../environment/bedroom/README.md) ersetzt diese Blockgrafiken im Spiel. Der Entwurfsstand bleibt erhalten.
