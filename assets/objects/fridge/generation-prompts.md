# Kühlschrank: Erzeugungsprompts

## Türspalt für den Eintritt

Integriertes Bildwerkzeug (`image_gen`), Bearbeitung von `upright.png`. Unverändertes Ergebnis: `sources/ajar.png`, regulärer Export: `ajar.png` (160×320).

```text
Use case: precise-object-edit
Asset type: ONE transparent intermediate door-state sprite for the exact warm retro refrigerator in the reference, in Pixel's World.
Input image: EDIT TARGET, the existing cream fridge, brass handle on left, burgundy thin plinth, dark walnut pixel contour. Keep its identity, scale, front-facing camera, body geometry and palette.
Primary request: change ONLY the door to be open a tiny crack, about 5 degrees, hinged on the right. The left edge with the brass handle moves slightly toward the viewer. Show only a thin dark vertical slit along the left edge behind the door, and a narrow dark wedge at the top. At least 92 percent of the front is still covered by the same solid cream door. The fridge interior and food must NOT be visible. The full outer cabinet stays upright, the same height and width, on the same floor anchor. This is a nearly closed entry frame, not a fully open fridge. No cat.
Style: crisp low-resolution warm pixel art, chunky square pixels, no perspective change to the cabinet, no new decorations, no new background, no floor, no external shadow. Preserve genuine transparent alpha background; entire fridge must be visible with transparent margins. Intended game export 160 by 320 pixels, upright tall silhouette exactly as reference. The door must not be horizontally squashed.
```

Modus: integriertes Bildwerkzeug (`image_gen`). Echte Transparenz; ausgewählte unveränderte Quellen in `sources/`. Die erste geschlossene Erzeugung hatte einen fehlerhaften Farbfleck auf der Tür; die gezielte Korrektur ist die gespeicherte Quelle. Ein zwischenzeitlich erzeugter liegender Kühlschrank wurde nach Ricos Ablaufänderung verworfen. Die Promptmaße dokumentieren die ursprünglichen Entwürfe; für den bestätigten Möbelmaßstab werden dieselben Quellen direkt auf 160×320 beziehungsweise 208×320 exportiert.

## Geschlossen

Use case: stylized-concept. Asset type: production sprite for a warm cozy 2D pixel-art cat platform game. Create ONE freestanding vintage compact refrigerator, upright, door CLOSED, orthographic front view with only a very narrow right edge, tall rectangular silhouette aspect ratio 1:2. Warm aged cream enamel, brass vertical handle on the left of the door, dark walnut-brown chunky pixel outlines, small muted bordeaux horizontal detail at bottom, tiny warm highlights. Rounded corners only by stepped square pixels. No labels, text, brand, magnets, food, props, floor, ground shadow or environment. Genuinely transparent background, whole refrigerator centered with modest empty padding. Intended final asset 80x160 game pixels, large crisp 2x2 pixel clusters, simple limited 10-color palette, no antialiasing, no gradients, no fine realistic texture. Fits a kitchen with bordeaux-red cabinets and warm walnut furniture. Fridge facing directly toward viewer, two small dark feet flush to the bottom.

## Gezielte Korrektur der geschlossenen Quelle

Edit target: the FIRST of the two reference images, the UPRIGHT CLOSED refrigerator. Preserve its exact cream/brass/bordeaux design, vertical shape, handle, closed door and feet. Fix ONLY the green/yellow/black glitch-like stain in the middle of the closed door: replace this stain with clean flat warm cream enamel matching the surrounding door, no colored mark or noise. Make all shading crisp flat pixel color blocks rather than smooth gradients or noise. The second image (lying open refrigerator) is only a warm palette and clean pixel-art style reference, do not use its orientation. Return ONE upright closed refrigerator with truly transparent background, whole object with padding, no floor or shadow, strict 2D game sprite at intended 80x160 pixels with chunky square pixel clusters. No text, no logos, no props.

## Stehend geöffnet, Innenchaos

Edit the previous upright warm cream vintage refrigerator game sprite. Keep its upright position, tall cabinet dimensions and warm cream/brass/bordeaux palette. Now its door is OPEN to the RIGHT at a narrow angle, revealing the refrigerator interior in a straight-on view. Inside: three crooked shelf lines, a toppled milk carton lying sideways, tipped little food containers, a few scattered vegetable pieces and one cracked egg. A readable comically rummaged interior, no liquids escaping, no new objects outside fridge. Door remains attached at right with brass handle visible, open door adds only one third of cabinet width. Entire upright appliance including open door centered with transparent background and padding. Strict 2D orthographic game pixel art, final sprite104x160 game pixels, chunky square2x2 pixel blocks, walnut outlines, 12 flat warm colors maximum. NO cat, people, room, floor, text, brand, labels, colored glitches, noise, gradients, shadow. Refrigerator stays standing and closed reference body scale stays the same.
