# Küchen-Grundraum: Bildquellen und Prompts

## plaster – warmer Wandputz

Referenzen: `sources/reference-warm-layout.png` und `sources/reference-living-room.png`. Neue deckende Textur, Quelle v1.

```text
Use case: stylized-concept. Asset type: ONE opaque seamless pixel-art PLASTER WALL TEXTURE for Pixel's World. Image 1 is COLOR/ROOM STYLE REFERENCE ONLY: the warm bordeaux and walnut kitchen. Image 2 is PIXEL-ART MATERIAL STYLE REFERENCE ONLY: the existing living room. Create only the repeatable painted plaster texture, NOT the room or screenshot. Warm soft ivory, sand beige and a very gentle pale apricot undertone, cozy old Berlin apartment wall, matte hand-painted lime plaster. Quiet low-contrast uneven plaster surface using a restrained palette of 3–5 warm tones, small crisp coarse pixel clusters and a few subtle mottled patches. Completely flat front view with uniform lighting; no lighting gradient, no vignette, no frame or border. Entire square filled, opaque alpha 255. All four edges tile seamlessly with no obvious bands or seams. Intended for nearest-neighbor export on a logical 128×128 pixel grid, then 2× game display. No furniture, no tile grid, no wooden panels, no bricks, no cracks, no dirt stains, no objects, no text, no figures, no wallpaper motif, no photorealism, no smooth blur.
```

## counter – Alpha-Korrektur der warmen Quelle v3

Edit-Ziel: `sources/counter-source-v2.png`, transparenter Hintergrund.

```text
Use case: precise-object-edit. Image 1 is the EDIT TARGET: one frontal pixel-art run of warm bordeaux lower kitchen cabinets with a dark walnut countertop and brass handles. Repair ONLY the three accidental transparent holes in the centers of the cabinet doors. Fill each hole with solid fully OPAQUE warm bordeaux painted wood matching the existing surrounding door color and simple subtle pixel texture. The WHOLE interior of each inset cabinet door must have alpha 255 with no black spot, no missing paint, no depression, no transparency and no scribble. The exterior background outside the cabinet outline stays genuine transparent alpha 0. Preserve every existing structural pixel position, all three inset frames, brass handles, walnut countertop, base plinth, colors outside the repaired areas, flat front elevation and exact silhouette. Do not add new objects. Keep crisp pixel clusters; no blur, no added gradients. ONE isolated sprite, not a room.
```

## Warme Bordeaux-/Walnussvariante

Gewählte Farbgestaltung: dunkles warmes Walnussholz, bordeauxrote Fronten, Messinggriffe und wärmerer brauner Fliesenboden. Ausschließlich Materialfarben ändern; Raummaße und Route erhalten.

### stool – Quelle v2

Edit-Ziel: `sources/stool-source-v1.png`.

```text
Use case: precise-object-edit. Image 1 is the EDIT TARGET, a production pixel-art sprite for Pixel's World. Recolor material surfaces only; preserve the exact object silhouette, proportions, pixel grid, all structural positions, highlights and dark outline, front elevation, and genuine alpha background. Match a cozy lived-in Berlin kitchen under warm light: DARK WARM WALNUT wood (deep chestnut brown #70422c, highlights #9b6646, edges #38241f), WARM BORDEAUX red-brown painted fronts (#783e3a, highlights #a56957, shadow #46272a), aged golden brass handles. Keep coarse crisp pixel clusters and flat restrained shading; no blur or new gradient. No text, no new objects, no room background. Every solid painted or wood surface must be fully opaque alpha 255, no holes or translucency; keep alpha 0 outside the object and in existing gaps. Recolor ALL wooden parts of this ONE STOOL to the dark warm walnut palette. Keep the flat seat, two legs, lower stretcher and transparent gaps exactly as they are. No red paint on the stool.
```

### table – Quelle v2

Edit-Ziel: `sources/table-source-v1.png`.

```text
Use case: precise-object-edit. Image 1 is the EDIT TARGET, a production pixel-art sprite for Pixel's World. Recolor material surfaces only; preserve the exact object silhouette, proportions, pixel grid, all structural positions, highlights and dark outline, front elevation, and genuine alpha background. Match a cozy lived-in Berlin kitchen under warm light: DARK WARM WALNUT wood (deep chestnut brown #70422c, highlights #9b6646, edges #38241f), WARM BORDEAUX red-brown painted fronts (#783e3a, highlights #a56957, shadow #46272a), aged golden brass handles. Keep coarse crisp pixel clusters and flat restrained shading; no blur or new gradient. No text, no new objects, no room background. Every solid painted or wood surface must be fully opaque alpha 255, no holes or translucency; keep alpha 0 outside the object and in existing gaps. Recolor ALL wooden parts of this ONE TABLE to the dark warm walnut palette. Keep the flat tabletop, two legs, lower stretcher and transparent gaps exactly as they are. No red paint on the table.
```

### counter – Quelle v2

Edit-Ziel: `sources/counter-source-v1.png`.

```text
Use case: precise-object-edit. Image 1 is the EDIT TARGET, a production pixel-art sprite for Pixel's World. Recolor material surfaces only; preserve the exact object silhouette, proportions, pixel grid, all structural positions, highlights and dark outline, front elevation, and genuine alpha background. Match a cozy lived-in Berlin kitchen under warm light: DARK WARM WALNUT wood (deep chestnut brown #70422c, highlights #9b6646, edges #38241f), WARM BORDEAUX red-brown painted fronts (#783e3a, highlights #a56957, shadow #46272a), aged golden brass handles. Keep coarse crisp pixel clusters and flat restrained shading; no blur or new gradient. No text, no new objects, no room background. Every solid painted or wood surface must be fully opaque alpha 255, no holes or translucency; keep alpha 0 outside the object and in existing gaps. Recolor this ONE run of LOWER CABINETS: all three door fronts become WARM BORDEAUX red-brown, retaining inset frames and subtle worn paint texture. The continuous flat countertop and outer frame become dark warm walnut. Keep the existing aged brass handles. Keep the same three doors, countertop, plinth, silhouette and proportions. Do not add any extra props, sink or stove. Interior cabinet faces fully opaque.
```

### wall-cabinet – Quelle v3

Edit-Ziel: `sources/wall-cabinet-source-v2.png`.

```text
Use case: precise-object-edit. Image 1 is the EDIT TARGET, a production pixel-art sprite for Pixel's World. Recolor material surfaces only; preserve the exact object silhouette, proportions, pixel grid, all structural positions, highlights and dark outline, front elevation, and genuine alpha background. Match a cozy lived-in Berlin kitchen under warm light: DARK WARM WALNUT wood (deep chestnut brown #70422c, highlights #9b6646, edges #38241f), WARM BORDEAUX red-brown painted fronts (#783e3a, highlights #a56957, shadow #46272a), aged golden brass handles. Keep coarse crisp pixel clusters and flat restrained shading; no blur or new gradient. No text, no new objects, no room background. Every solid painted or wood surface must be fully opaque alpha 255, no holes or translucency; keep alpha 0 outside the object and in existing gaps. Recolor this ONE pair of WALL CABINETS: both broad door fronts become WARM BORDEAUX red-brown with restrained lighter warm red-brown details; outer frame becomes dark warm walnut. Preserve the two inset door frames, two aged brass handles, flat rectangular silhouette, positions and proportions. Completely solid opaque door faces with no accidental holes. Background alpha 0.
```

### floor-tiles – Quelle v2

Edit-Ziel: `sources/floor-tiles-source-v1.png`.

```text
Use case: precise-object-edit. Image 1 is the EDIT TARGET, a repeating pixel-art kitchen floor texture. Recolor only the material palette: change the cool gray stone squares into warm muted honey/cocoa brown stone squares under warm light, with subtle soft amber and clay-brown undertones and warm dark brown grout. Keep the exact square tile grid, layout, flat orthographic view, seamless pattern edges, speckles and crisp coarse pixel-art clusters. Restrained low contrast so the floor supports a room with dark walnut furniture and warm bordeaux painted cabinet fronts. Opaque texture covering the whole image. No lighting gradient, no shadows, no border, no furniture, no text, no photorealism, no blur. Preserve all geometry; warm palette only.
```


Die exakten Referenzen liegen unter `sources/reference-living-room.png` und `sources/reference-layout.png`. Die Hängeschrank-Korrektur v2 behebt ein Alpha-Loch; die warme Endfassung v3 baut darauf auf. Die gewählten Versionen stehen im Exportskript. Frühere Quellen bleiben als Edit-Eingaben erhalten.

## wall-cabinet – Korrektur v2

Edit-Ziel: `sources/wall-cabinet-source-v1.png`, transparenter Hintergrund.

```text
Use case: precise-object-edit. Asset type: one transparent Pixel's World wall-cabinet sprite. Image 1 is the EDIT TARGET. Correct ONLY the accidental transparent dark hole/smear in the center of the LEFT cabinet door. Make BOTH cabinet door interiors completely solid opaque charcoal-sage painted wood, alpha 255 everywhere inside the whole cabinet rectangular silhouette, with the same restrained coarse pixel texture as the surrounding door panels. No hole, no missing paint, no scribble, no soft blur, no translucency inside the doors. Preserve the existing exact two-door proportions, straight cabinet rectangular outer silhouette, colors, inset frames, brass handles, pixel-art style, and positions of every structural part. Keep the background outside the cabinet genuinely transparent alpha 0. ONE isolated cabinet sprite, no wall, no floor, no cast shadow, no extra objects, no text. Change only the damaged patch; keep all other parts unchanged.
```

Erzeugung mit dem integrierten Bildwerkzeug. Stilreferenz: Screenshot des veröffentlichten Wohnzimmers; Layoutreferenz: die bestätigte DEV-Küchenvorschau. Die Quellen bleiben unverändert unter `sources/`. Spielmaße und Export stehen in der README dieses Verzeichnisses.

## stool

Transparenter Hintergrund: ja.

```text
Use case: stylized-concept. Asset type: one production 2D pixel-art asset for Pixel's World, a side-view browser cat game. Image 1 is STYLE REFERENCE ONLY (existing living room); image 2, when present, is LAYOUT/PROPORTIONS REFERENCE ONLY (kitchen blockout). Do not redraw screenshots, UI, text, cats or humans. Match the living room's warm restrained game palette, crisp hand-placed coarse pixel clusters, dark brown outlines, subtle 3-tone material texture. Cozy lived-in Berlin apartment, dark charcoal/sage kitchen with warm walnut surfaces and muted brass details. No photorealism, no smooth gradients, no anti-alias blur, no 3D rendering, no isometric perspective. No text, no labels, no watermark. Create ONE isolated small wooden kitchen STOOL, strict frontal side elevation, natural wood with warm walnut seat and dark sturdy wooden legs, one lower crossbar. The finished object bounding box has ratio 80:70 (width:height); its perfectly straight horizontal seat spans the full object width at the very top and takes 14/70 of the height. Two legs end on the same flat baseline. The entire stool must be visible, no crop. Its top is a traversable platform: no protruding ornament, no cushion. Keep the center gap between legs genuinely transparent. Work as if the sprite had a logical 40×35 pixel canvas, later displayed at 80×70. True alpha transparency everywhere outside the silhouette; no floor, wall or cast shadow.
```

## table

Transparenter Hintergrund: ja.

```text
Use case: stylized-concept. Asset type: one production 2D pixel-art asset for Pixel's World, a side-view browser cat game. Image 1 is STYLE REFERENCE ONLY (existing living room); image 2, when present, is LAYOUT/PROPORTIONS REFERENCE ONLY (kitchen blockout). Do not redraw screenshots, UI, text, cats or humans. Match the living room's warm restrained game palette, crisp hand-placed coarse pixel clusters, dark brown outlines, subtle 3-tone material texture. Cozy lived-in Berlin apartment, dark charcoal/sage kitchen with warm walnut surfaces and muted brass details. No photorealism, no smooth gradients, no anti-alias blur, no 3D rendering, no isometric perspective. No text, no labels, no watermark. Create ONE isolated kitchen TABLE, strict frontal elevation with NO top-down view and no perspective depth. A warm worn walnut tabletop, two dark brown wooden legs with restrained woodgrain and a low horizontal stretcher. Finished bounding box ratio 220:140. The straight horizontal tabletop spans the complete width at the very top, thickness 14/140 of object height. Both feet end on one flat baseline. Object fills the frame with a safe exterior transparent margin. Logical sprite grid 110×70, later displayed 220×140. No tablecloth, no dishes, no drawers, no objects on top, no decorative protrusions. Genuine transparency outside silhouette and between legs; no background, no floor, no cast shadow.
```

## counter

Transparenter Hintergrund: ja.

```text
Use case: stylized-concept. Asset type: one production 2D pixel-art asset for Pixel's World, a side-view browser cat game. Image 1 is STYLE REFERENCE ONLY (existing living room); image 2, when present, is LAYOUT/PROPORTIONS REFERENCE ONLY (kitchen blockout). Do not redraw screenshots, UI, text, cats or humans. Match the living room's warm restrained game palette, crisp hand-placed coarse pixel clusters, dark brown outlines, subtle 3-tone material texture. Cozy lived-in Berlin apartment, dark charcoal/sage kitchen with warm walnut surfaces and muted brass details. No photorealism, no smooth gradients, no anti-alias blur, no 3D rendering, no isometric perspective. No text, no labels, no watermark. Create ONE isolated straight run of LOWER KITCHEN CABINETS with a single perfectly flat walnut countertop, strict frontal elevation, no top-down view, no perspective. Finished bounding box ratio 340:210. Countertop spans full width at the very top, thickness 14/210 of total object height. Three charcoal-sage painted cabinet doors below, subtle worn pixel texture, inset frame detailing and muted small brass handles. Dark recessed plinth ends on one straight baseline. Coherent chunky pixel art at logical 170×105 resolution, later 340×210. No sink, no tap, no stove, no food, no dishes, no upper cupboards, no side extensions. All external pixels true transparent alpha. No floor, no wall, no cast shadow, no glow.
```

## wall-cabinet

Transparenter Hintergrund: ja.

```text
Use case: stylized-concept. Asset type: one production 2D pixel-art asset for Pixel's World, a side-view browser cat game. Image 1 is STYLE REFERENCE ONLY (existing living room); image 2, when present, is LAYOUT/PROPORTIONS REFERENCE ONLY (kitchen blockout). Do not redraw screenshots, UI, text, cats or humans. Match the living room's warm restrained game palette, crisp hand-placed coarse pixel clusters, dark brown outlines, subtle 3-tone material texture. Cozy lived-in Berlin apartment, dark charcoal/sage kitchen with warm walnut surfaces and muted brass details. No photorealism, no smooth gradients, no anti-alias blur, no 3D rendering, no isometric perspective. No text, no labels, no watermark. Create ONE isolated pair of WALL-MOUNTED KITCHEN CUPBOARDS, one continuous horizontally rectangular sprite, strict frontal elevation without perspective. Bounding-box ratio 340:78. Two wide charcoal-sage painted cabinet doors, simple inset wood frame, matching muted brass handles near their inner edges, subtle restrained pixel texture, dark edge outline. Straight horizontal top and bottom, no protruding handles outside bounding box. Fits logical 170×39 grid, later displayed 340×78. Match lower cabinets in the style reference/blockout. No countertop, no legs, no objects, no dishes, no decorations. True transparency outside the silhouette, no wall, no cast shadow.
```

## wall-tiles

Transparenter Hintergrund: nein.

```text
Use case: stylized-concept. Asset type: one production 2D pixel-art asset for Pixel's World, a side-view browser cat game. Image 1 is STYLE REFERENCE ONLY (existing living room); image 2, when present, is LAYOUT/PROPORTIONS REFERENCE ONLY (kitchen blockout). Do not redraw screenshots, UI, text, cats or humans. Match the living room's warm restrained game palette, crisp hand-placed coarse pixel clusters, dark brown outlines, subtle 3-tone material texture. Cozy lived-in Berlin apartment, dark charcoal/sage kitchen with warm walnut surfaces and muted brass details. No photorealism, no smooth gradients, no anti-alias blur, no 3D rendering, no isometric perspective. No text, no labels, no watermark. Create ONE square seamless repeating WALL TILE TEXTURE for the kitchen backsplash. Fill the ENTIRE image with small warm ivory/cream ceramic subway rectangles, offset brick bond, muted sage-gray thin grout, slight hand-glazed 3-tone pixel variation and occasional tiny warm speckles. Flat front elevation, identical scale everywhere, no lighting gradient, no border, no shadows at image edges. Left/right and top/bottom edges must tile seamlessly. Restrained contrast so Pixel and the cabinets remain readable. Logical 64×64 pixel-art tile, intended for nearest-neighbor display; no giant grid outlines, no furniture, no room, no plants or figures. Opaque texture.
```

## floor-tiles

Transparenter Hintergrund: nein.

```text
Use case: stylized-concept. Asset type: one production 2D pixel-art asset for Pixel's World, a side-view browser cat game. Image 1 is STYLE REFERENCE ONLY (existing living room); image 2, when present, is LAYOUT/PROPORTIONS REFERENCE ONLY (kitchen blockout). Do not redraw screenshots, UI, text, cats or humans. Match the living room's warm restrained game palette, crisp hand-placed coarse pixel clusters, dark brown outlines, subtle 3-tone material texture. Cozy lived-in Berlin apartment, dark charcoal/sage kitchen with warm walnut surfaces and muted brass details. No photorealism, no smooth gradients, no anti-alias blur, no 3D rendering, no isometric perspective. No text, no labels, no watermark. Create ONE square seamless repeating FLOOR TILE TEXTURE for a cozy charcoal-and-walnut kitchen. Muted warm gray stone squares, thin darker gray grout, restrained 3-tone pixel texture and a few tiny speckles; slightly lived-in but clean. Completely flat orthographic view, no perspective, no lighting gradient, no shadows, no border. Continuous seamless pattern at all four edges. Pixel-art logical 48×48 resolution, no fine photoreal noise, no furniture, no room, no figures. Medium brightness, lower contrast than Pixel's outline. Opaque texture.
```

