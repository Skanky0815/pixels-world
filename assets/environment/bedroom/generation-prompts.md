# Schlafzimmer – Erzeugungsprompts

Erzeugt mit dem integrierten Bildwerkzeug (November 2026), zur lokalen Abnahme. Originale bleiben unverändert in `sources/`. Export: `node tools/assets/prepare-bedroom-assets.mjs`.

Referenzrollen: Küche = Pixel-Art-Stil, freigegebene Raumaufnahme = Aufteilung; Tür und Fenster = ursprüngliche Sprites. Wäschevarianten bearbeiten die gefaltete Quelle, Korbzustände den aufrechten Korb, die angeknabberte Pflanze die intakte Grünlilie. Katzenbett, Lampe und Läufer verwenden Küche/Bett als Stil- und Palettenreferenzen.

## door

Quelle: `assets/environment/bedroom/sources/door-source-v1.png`

```text
Use case: precise-object-edit. Asset type: ONE production pixel-art bedroom door sprite for Pixel's World. Image 1 is the EDIT TARGET, the original brown door. Repaint the wooden door leaf AND wooden outer frame in warm chalk WHITE (#f1eee5), with restrained warm gray-white shaded inset panels. Keep the EXACT same frontal elevation, tall narrow proportions, rectangular silhouette, two recessed panels, brass handle on the RIGHT, bottom anchor and pixel-art structure. No redesign, no opening, no diagonal/isometric perspective. Image 2 is MATERIAL/PIXEL-STYLE reference only (the existing kitchen); do not reproduce its room. Use opaque coarse crisp pixel clusters, a small palette and subtle hand-painted highlights, no blur, no photorealism, no lettering. Genuine transparent background outside the isolated door; the entire door and its panels remain solid opaque with no holes. Only ONE complete door, with a small clear margin, filling the frame. Target game dimensions 112x216, logical 56x108, nearest-neighbor export into 2x2 clusters. Absolutely WHITE door, not brown, beige, yellow or gray.
```

## bed

Quelle: `assets/environment/bedroom/sources/bed-source-v1.png`

```text
Use case: stylized-concept. ONE isolated production furniture sprite for Pixel's World. Image 1 is PIXEL-ART MATERIAL/SHADING reference only, the existing kitchen. Image 2 is the APPROVED BEDROOM palette and arrangement reference only; replace its crude furniture, do not draw the room. Cozy Berlin apartment game, crisp coarse pixel clusters, restrained warm highlights, dark clean outline, NO photorealism, no blur, no isometric or 3D camera, no text or extra objects. Exact FLAT FRONT ELEVATION, horizontal top support, genuine transparent background and transparent negative spaces. Entire furniture material fully opaque. Intended for nearest-neighbor 2x2 cluster export. Create the BED ONLY, long horizontal side elevation, burgundy plum duvet with soft folded texture, one warm ivory pillow on the left, dark warm walnut bedframe. Target game silhouette 264 wide x128 high (logical132x64). Critical geometry: mattress top is at the TOP of the sprite, with NO headboard or tall pillows above that support line. Mattress and frame occupy only the TOP 56/128 of the total height. TWO slender walnut legs near left and right extend down to the common floor line at y128. The entire central region BELOW y56 down to y128 is empty transparent air, so Pixel and a small cat bed can fit UNDER the bed. No footboard across that space, no drawers, no bottom crossbar, no rug, no lamp, no cat, no catbed, no room. Very wide flat side-on bed, not an angled top-down view.
```

## nightstand

Quelle: `assets/environment/bedroom/sources/nightstand-source-v1.png`

```text
Use case: stylized-concept. ONE isolated production furniture sprite for Pixel's World. Image 1 is PIXEL-ART MATERIAL/SHADING reference only, the existing kitchen. Image 2 is the APPROVED BEDROOM palette and arrangement reference only; replace its crude furniture, do not draw the room. Cozy Berlin apartment game, crisp coarse pixel clusters, restrained warm highlights, dark clean outline, NO photorealism, no blur, no isometric or 3D camera, no text or extra objects. Exact FLAT FRONT ELEVATION, horizontal top support, genuine transparent background and transparent negative spaces. Entire furniture material fully opaque. Intended for nearest-neighbor 2x2 cluster export. Create the NIGHTSTAND ONLY. Compact closed two-drawer bedside cabinet of warm medium walnut, subtle pixel wood grain, small aged brass handles, simple flat slightly overhanging top. Target game silhouette width72 height64 (logical36x32), nearly square. Its TOP is a usable horizontal support; its closed solid body extends down to the floor with a short plinth. No lamp, nothing on top, no open drawers, no separate legs or surrounding furniture. Warm walnut harmonizes with the floor and burgundy bedding.
```

## wardrobe

Quelle: `assets/environment/bedroom/sources/wardrobe-source-v1.png`

```text
Use case: stylized-concept. ONE isolated production furniture sprite for Pixel's World. Image 1 is PIXEL-ART MATERIAL/SHADING reference only, the existing kitchen. Image 2 is the APPROVED BEDROOM palette and arrangement reference only; replace its crude furniture, do not draw the room. Cozy Berlin apartment game, crisp coarse pixel clusters, restrained warm highlights, dark clean outline, NO photorealism, no blur, no isometric or 3D camera, no text or extra objects. Exact FLAT FRONT ELEVATION, horizontal top support, genuine transparent background and transparent negative spaces. Entire furniture material fully opaque. Intended for nearest-neighbor 2x2 cluster export. Create the WARDROBE ONLY, tall slender TWO CLOSED PANEL DOORS, muted deep smoky plum/charcoal painted wood (#514953), slightly lighter plum inset framing, restrained old brass paired handles, simple warm walnut plinth. Target silhouette width120 height278 (logical60x139), very tall narrow proportion. Completely flat front elevation, flat horizontal top that will support a plant, no crown sticking out above the top or sides. Solid body reaches the floor. No open doors, no contents, no plant, no wall or furniture. Preserve the quiet modern lived-in alternative Berlin style rather than ornate antique carving.
```

## catbed

Quelle: `assets/objects/bedroom/sources/catbed-source-v1.png`

```text
Use case: stylized-concept. Asset type: ONE isolated production pixel-art game sprite for Pixel's World. Image 1 is COARSE PIXEL STYLE reference (existing kitchen); Image 2 is COORDINATED BEDDING/WOOD palette reference only (final burgundy bed). Do not reproduce either scene. Crisp pixel clusters, limited cozy warm palette, subtle hand-painted material texture, dark clean silhouette. No blur, no photorealism, no text, no characters, no surrounding objects or floor. Genuine transparent background, opaque object interior. Subject: ONE EMPTY low soft cat bed that fits under the large bed. Warm terracotta/rust fabric bolster around an ivory beige cushion, softly rounded horizontal rectangular nest. Flat frontal side elevation with a shallow visible inner cushion opening, no isometric perspective. WIDE AND VERY LOW, target game silhouette96x30 (logical48x15), ratio3.2:1. Comfy raised padded side rim, slight stitched folds. Do not put a cat in it. No legs, no basket weave, no high hood, no tall backrest. Low bottom edge resting flat on floor anchor.
```

## lamp

Quelle: `assets/objects/bedroom/sources/lamp-source-v1.png`

```text
Use case: stylized-concept. Asset type: ONE isolated production pixel-art game sprite for Pixel's World. Image 1 is COARSE PIXEL STYLE reference (existing kitchen); Image 2 is COORDINATED BEDDING/WOOD palette reference only (final burgundy bed). Do not reproduce either scene. Crisp pixel clusters, limited cozy warm palette, subtle hand-painted material texture, dark clean silhouette. No blur, no photorealism, no text, no characters, no surrounding objects or floor. Genuine transparent background, opaque object interior. Subject: ONE small elegant bedside table lamp, flat front elevation. Warm ivory fabric lampshade, slender aged brass stem, compact dark walnut/brass pedestal foot, gentle warm opaque shading only, no halo or cast shadow outside the silhouette. Target game28 wide x38 high, logical14x19 pixels; lamp is slightly taller than wide. Broad shade at upper half, narrow stem and low broad stable base. Base sits on a horizontal tabletop anchor; do not draw the table. No cable, no plug, no glow cloud, no room.
```

## runner

Quelle: `assets/objects/bedroom/sources/runner-source-v1.png`

```text
Use case: stylized-concept. Asset type: ONE isolated production pixel-art game sprite for Pixel's World. Image 1 is COARSE PIXEL STYLE reference (existing kitchen); Image 2 is COORDINATED BEDDING/WOOD palette reference only (final burgundy bed). Do not reproduce either scene. Crisp pixel clusters, limited cozy warm palette, subtle hand-painted material texture, dark clean silhouette. No blur, no photorealism, no text, no characters, no surrounding objects or floor. Genuine transparent background, opaque object interior. Subject: ONE extremely long narrow woven bedside RUNNER RUG, flat top-down rectangular sprite intended for the game's narrow foreground floor strip. Warm muted rust-red center, warm ivory/tan narrow border, a restrained small repeating geometric diamond motif and short ivory fringes on the TWO SHORT ENDS ONLY. Target game310x36, logical155x18 pixels, very long aspect ratio8.6:1. The rug itself must be a long horizontal strip centered on a wide transparent canvas, not a square carpet. No perspective tilt, no rolled edges, no additional rugs, no floor, no objects, no shadow, no gradients. Simple crisp weave details stay readable at tiny height.
```

## window

Quelle: `assets/environment/bedroom/sources/window-source-v1.png`

```text
Use case: precise-object-edit. Edit this existing Pixel's World window sprite: change ONLY all brown wooden framing, central mullion and sill to warm painted white/ivory with subtle grey pixel shadows. Preserve exactly the original frontal outline, aspect ratio, two panes, outside landscape and alpha silhouette. Crisp coarse retro pixel art, no antialiasing. Transparent background. Export intended 112x184 pixels, logical56x92.
```

## laundry-folded

Quelle: `assets/objects/bedroom/sources/laundry-folded-source-v1.png`

```text
Use case: stylized-concept. Single game sprite: three neatly folded items of laundry stacked, muted petrol, warm tan and dusty burgundy. Straight front view, low broad silhouette exactly2:1 width:height, solid cloth with stepped folded edges. Intended96x48 pixels logical48x24. Cozy coarse retro pixel art with dark warm outlines, few flat shades, no smooth gradients. True transparent background, no ground, no furniture, no text. Centered object completely visible.
```

## basket-upright

Quelle: `assets/objects/bedroom/sources/basket-upright-source-v1.png`

```text
Use case: stylized-concept. Single cozy pixel game sprite: upright warm tan woven laundry basket, muted petrol and dusty burgundy clothes peeking over rim. Straight front view, compact broad silhouette5:3. Intended80x48pixels logical40x24. Coarse chunky retro pixel art, limited warm palette, dark warm outlines, tiny readable wicker pattern. Flat base rests at image bottom; no ground, no shadow outside, no text. True transparent background.
```

## spiderplant-intact

Quelle: `assets/objects/bedroom/sources/spiderplant-intact-source-v1.png`

```text
Use case: stylized-concept. Single game sprite of a lush spider plant, long gently arching pointed green leaves with pale cream stripes, in a small warm ivory/taupe ceramic pot. Straight front view, tall2:3 silhouette, pot occupies bottom third. Intended40x60pixels logical20x30 so very coarse chunky readable pixel art, limited shades, dark warm outline. No fine smooth detail, no ground, no external shadow, no text. Transparent background, entire plant visible.
```

## laundry-rumpled

Quelle: `assets/objects/bedroom/sources/laundry-rumpled-source-v1.png`

```text
Use case: precise-object-edit. Same three garments in petrol, tan and burgundy, same sprite palette, frontal view, widths and transparent background. Change neat stack into a slightly disturbed messy stack, garments shifted sideways with a loose sleeve. Preserve total2:1 silhouette and bottom contact, intended96x48pixel coarse game sprite. No other objects.
```

## laundry-spilled

Quelle: `assets/objects/bedroom/sources/laundry-spilled-source-v1.png`

```text
Use case: precise-object-edit. Same three garments petrol, tan and burgundy, now completely unfolded and scattered in a low broad messy heap on the floor. No floor drawn. Width:height19:6 intended152x48 pixels, logical76x24. Same coarse pixel art, outlines and material. All garments visible, opaque interiors, transparent outside, fixed flat bottom contact. No basket or extra objects.
```

## basket-spilled

Quelle: `assets/objects/bedroom/sources/basket-spilled-source-v1.png`

```text
Use case: precise-object-edit. This exact woven laundry basket and same petrol/burgundy garments, now basket tipped on its side at left, laundry spilling out to right in a low broad heap. Entire silhouette19:6 intended152x48pixel coarse game sprite. Preserve basket identity, wicker, palette, coarse pixel style. Transparent background, opaque object interiors. Bottom contact on same baseline, no floor, no shadow outside.
```

## spiderplant-bitten

Quelle: `assets/objects/bedroom/sources/spiderplant-bitten-source-v1.png`

```text
Use case: precise-object-edit. Same spider plant in same pot, same placement silhouette and front view. Change ONLY leaf ends: several jagged cat bite notches and shortened tips make nibbling clearly readable at40x60pixels. Keep ceramic pot shape, size, exact base contact and pixel style unchanged. Fully transparent background including all empty gaps between leaves. Remove any glow or shadow outside object, opaque leaf and pot interiors.
```

## plaster

Quelle: `assets/environment/bedroom/sources/plaster-source-v1.png`

```text
Use case: stylized-concept. Seamless repeating pixel-art plaster wall texture tile, opaque full square, dark forest green main color #24483b, only very subtle sparse blocky mottling using3 nearby dark green tones. Uniform flat lighting. Cozy bedroom game background, extremely low contrast so objects read clearly. Coarse pixel clusters, no gradients, no vignette, no objects, no border, no text. Edges must tile seamlessly.
```

## floor

Quelle: `assets/environment/bedroom/sources/floor-source-v1.png`

```text
Use case: stylized-concept. Seamless repeating opaque pixel-art texture of warm honey walnut wooden floorboards, flat orthographic top down, horizontal long planks, subtle restrained grain in chunky pixels and staggered dark narrow seams. Main warm wood color #98704e, shadows #775237, warm muted highlights. Full rectangular texture, width4timesheight, no perspective, no objects, no border, no text, no vignette. Both edges must tile seamlessly. Intended512x128 gamepixels logical256x64.
```

## window-v2

Bearbeitet `sources/window-source-v1.png`; gewählt: `sources/window-source-v2.png`.

```text
Use case: precise-object-edit. Fix ONLY the unnatural dark blurry floating blotch in the upper left window pane: replace that blotch with matching clean pale blue sky. Preserve the entire white window frame, sill, crossbar, clouds and landscape, proportions and image bounds. Keep pane interiors fully opaque. Preserve transparent exterior. Pixel art, no blur, no dark smudges or added objects.
```

## curtain (helles Khaki)

Quelle: `assets/objects/bedroom/sources/curtain-source-v1.png`. Bearbeitungsreferenz: `assets/objects/curtain/curtain-rust.png`.

```text
Use case: precise-object-edit. Edit this existing Pixel's World curtain sprite into ONE short narrow bedroom window curtain panel. Change the rust-red cloth to LIGHT KHAKI linen: pale muted beige with a soft olive undertone, base #c8c3a0, highlights #dfdcc1, shade #aaa581. Definitely light khaki, not white, orange or dark green. Preserve the coarse crisp pixel-art look, vertical pleats, straight front elevation, small gathered heading and softly uneven hem. No tieback, no surrounding room, no pole, no text. Entire isolated panel opaque, outside genuinely transparent. Intended game size40x160 pixels logical20x80; visible fabric should be readable in only20 logicalpixels width. Same simple hanging drape identity, small palette, no smoothing or gradients.
```

## curtain-tear (helles Khaki)

Quelle: `assets/objects/bedroom/sources/curtain-tear-source-v1.png`. Bearbeitungsreferenz: `assets/objects/curtain/curtain-tear.png`.

```text
Use case: precise-object-edit. Edit this existing small curtain rip overlay sprite to suit pale LIGHT KHAKI linen, base #c8c3a0 with soft olive beige highlights #dfdcc1 and shade #aaa581. Keep one vertical jagged torn slit, a dark narrow interior opening and frayed torn khaki cloth edges. Same coarse pixel art and small readable silhouette. Transparent exterior, no fabric rectangle, no background, no objects or text. Intended small game overlay24x40pixels logical12x20, crisp blocky clusters, no blur.
```

Die endgültige Stoffzelle ist 40×120 statt des ursprünglichen Erzeugungsbriefings 40×160: Der Saum bei Welt-y=220 hält den bisherigen Sprung vom Nachttisch frei. Acht Risse werden in getrennten 18×26-Zellen auf dem kurzen Stoff verteilt; Regeln, Schadensschwellen und Punkte bleiben identisch zum Wohnzimmer.
