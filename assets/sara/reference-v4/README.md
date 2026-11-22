# Sara v4: Stil- und Größenreferenz

Dieser Ordner enthält die bestätigte Chibi-Referenz, aus der das
[Produktionssheet](../README.md) abgeleitet wird. Brille, Pferdeschwanz, dunkler
Ansatz, Hoodie und die beiden abstehenden Strähnen bestimmen Saras Identität.

- `sara-idle-left-source-v4.png`: unveränderte Imagegen-Quelle.
- `sara-idle-left-v4.png`: transparente 64×96-Zelle, sichtbare Figur 60 Pixel hoch;
  Maßstabs- und Silhouettenvorlage für den Export mit [prepare-sara-sheet.mjs](../../../tools/prepare-sara-sheet.mjs).
- `sara-pixel-detail-v4.png` und `sara-pixel-room-scale-v4.png`: statische
  Größenvergleiche mit Pixel, keine Spielaufnahmen.
- `metadata-v4.json`: Messwerte dieses Referenzexports.
- [Originalprompts](generation-prompts-v4.md): Erzeugung und gezielte Bearbeitungen.

Bounds: x=14–49, y=30–89 (nullbasiert), Fußanker `(0.5, 90/96)`.
Der Referenzexport enthält binäres Alpha und 709 RGB-Werte. Das Produktionssheet
übernimmt seine Idle-Silhouette und verwendet die gemeinsame 24-Farben-Palette.
Animationen, Spielskalierung und reproduzierbarer Export werden ausschließlich
in der [Produktionsanleitung](../README.md) gepflegt.
