# Futterbeutel – Bildquellen und Prompts

Erzeugt mit dem integrierten Bildwerkzeug, jeweils mit transparentem Hintergrund.
`intact` v1 ist eine neue Grafik ohne Bildreferenz. `spilled` v1 referenziert die
aufrechte Quelle; v2 bearbeitet v1, v3 bearbeitet v2. V3 ist der gewählte
Streuzustand: Pfote und gedruckte Futterstücke drehen sich mit der Verpackung.
Alle Quellen liegen unverändert unter `sources/`.

## Aufrecht

```text
Use case: stylized-concept
Asset type: one transparent pixel-art object sprite for Pixel’s World, a warm cozy 2D side-view cat game.
Primary request: a single upright paper bag of dry cat food, a squat rectangular kraft-paper sack with folded crimped openable top, warm cream and honey-brown paper, a broad muted bordeaux-red label band with one tiny cream paw emblem, no writing. A few dark brown kibble shapes pictured subtly on the lower bag. It should read as a cat-food packet even at 32 by 44 game pixels.
Style: crisp low-resolution pixel art, square clusters, restrained warm walnut/bordeaux/cream palette, dark brown outlines, no smooth shading or antialiasing. Matches a warm old-fashioned kitchen with dark walnut tables and burgundy cabinets.
Composition: exactly ONE whole upright packet centered with transparent space around it, straight-on side/front view, flat horizontal base, width-to-height about 0.73. Keep the silhouette compact and stable, folded paper corners readable.
Backdrop: genuinely transparent alpha, no floor or external shadow.
Avoid: text, letters, numbers, brand marks, watermark, cat character, bowl, additional packets, loose pellets outside the packet, kitchen scenery, collage, sprite sheet.
```

## Ausgelaufen v1

```text
Use case: precise-object-edit
Asset type: transparent spilled-state pixel-art game sprite, paired with the provided upright cat-food packet.
Primary request: show this SAME warm cream kraft paper cat-food packet toppled onto its side and opened at its right-hand end, with a small bounded fan of dry brown kibble spilling out onto the invisible horizontal ground to its right. Keep the same bordeaux-red label band and cream paw emblem, paper palette, dark brown outline, and square pixel clusters. The packet itself is mostly on the left, the loose kibble on the right, forming one compact low horizontal sprite. The empty lower background between pellets must remain genuinely transparent.
Composition: entire toppled packet plus its own modest scatter, no cropped parts, intended output 96 by 28 pixels, about 3.4:1 overall width/height. Side view, ground contact along one horizontal base. Exactly one packet and its spilled contents.
Constraints: preserve the original packet identity, warm cozy game palette and pixel-art style. Change only pose, opened mouth and spilled contents. Transparent alpha background, no floor, no cast shadow outside the object, no scenery, no cat, no bowl, no extra packet, no text, no letters, no watermark, no gradients or antialiasing.
```

## Pfote mitdrehen v2

```text
Use case: precise-object-edit
Change ONLY the cream paw emblem printed on the red label band of this toppled cat-food packet. Rotate that paw emblem exactly 90 degrees CLOCKWISE so that its small toe pads point to the RIGHT and its large heel pad is on the LEFT, matching the packet's clockwise fall from upright to lying on its side. Keep the emblem centered within the same red label band.
Preserve EVERYTHING else exactly: the packet silhouette and horizontal pose, red band position, cream label borders, paper folds and torn opening, printed brown kibble shapes on the left, all loose spilled kibble on the right, palette, pixel clusters, image framing, dimensions and transparent alpha background. No other additions or removals, no writing, no watermark.
```

## Futteraufdruck mitdrehen v3

```text
Use case: precise-object-edit
Change ONLY the THREE BROWN PRINTED KIBBLE ILLUSTRATIONS on the cream paper panel at the LEFT side of this lying cat-food packet. Rotate that entire printed three-kibble motif exactly 90 degrees CLOCKWISE in place, including the individual kibble shapes and their highlights: the motif currently forms a roughly upward-pointing triangle, and after rotation it should form a rightward-pointing triangle. Keep the complete motif inside the same cream paper panel with the same scale, colors, and pixel-art treatment. It is PRINTED artwork that rotated with the packet.
Preserve everything else exactly: the already-correct clockwise-rotated cream paw emblem in the red center band (toes pointing RIGHT), all paper folds, packet silhouette and horizontal pose, torn mouth at the right, and all ACTUAL loose spilled kibble lying outside on the right. Preserve framing, dimensions and genuine transparent alpha. No new objects, no text, no watermark.
```

