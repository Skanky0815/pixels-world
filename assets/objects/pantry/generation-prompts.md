# Vorratsbehälter: vollständige Erzeugungsprompts

Die ursprüngliche Dosen-Vorgabe im Prompt lautet 36×28; der aktuelle Export verwendet 32×28 Pixel. Maßgeblich sind [README](README.md) und [prepare-pantry-assets.mjs](../../../tools/prepare-pantry-assets.mjs).

Modus: integriertes Bildwerkzeug (`image_gen`) mit transparentem Hintergrund. Intaktes Glas und Dose sowie der Glassplitter wurden neu erzeugt; die Endzustände verwenden das jeweilige intakte Objekt als Referenz. Die v2-Bearbeitung der offenen Dose dreht ausschließlich ihr aufgedrucktes Herz passend zur Lage.

## jar

```text
Use case: stylized-concept
Asset type: ONE transparent pixel-art game sprite for Pixel’s World, a cozy 2D side-view cat game in a warm walnut/bordeaux/cream old-fashioned kitchen. Crisp square pixel clusters and limited warm palette, dark warm-brown outline, no antialiasing or smooth gradients. Complete isolated object centered, flat horizontal bottom, true transparent alpha background and generous transparent margin. No floor, no outside cast shadow, no text, no labels, no brands, no watermark, no cat, no scene, no other objects.
Primary request: a small upright sealed glass pantry jar filled about halfway with a few golden dry spiral pasta pieces, with a plain warm walnut wooden lid and a slim brass-colored rim. Rounded rectangle jar silhouette, very simple pale cream and muted pale sage glass highlights, some true transparency through the glass around the pasta. Compact readable shape intended final size 28 pixels wide by 34 pixels high. One closed unbroken jar, front/side view. No writing or decoration.
```

## tin

```text
Use case: stylized-concept
Asset type: ONE transparent pixel-art game sprite for Pixel’s World, a cozy 2D side-view cat game in a warm walnut/bordeaux/cream old-fashioned kitchen. Crisp square pixel clusters and limited warm palette, dark warm-brown outline, no antialiasing or smooth gradients. Complete isolated object centered, flat horizontal bottom, true transparent alpha background and generous transparent margin. No floor, no outside cast shadow, no text, no labels, no brands, no watermark, no cat, no scene, no other objects.
Primary request: a small closed biscuit tin made of warm muted bordeaux metal, with a pale cream lid rim and a tiny simple cream heart on the front. Slightly rounded rectangular box with short curved corners and a plain removable lid. No feet or handle. Intended final size 36 pixels wide by 28 pixels high. One closed intact tin, front/side view, easy to distinguish from glass. No lettering.
```

## jar-broken

```text
Use case: precise-object-edit
Reference: the attached closed pasta jar establishes glass, walnut lid, pasta and warm pixel-art style. Create ONE finished broken state sprite: a small low heap of pale sage/cream glass shards, the detached walnut lid lying flat near the left, and a FEW scattered golden dry spiral pasta pieces in a bounded horizontal cluster. No upright intact jar remains. Intended final footprint 76 pixels wide by 24 pixels high, readable chunky shapes, a flat common baseline, front/side view. Crisp tiny square pixel art, warm brown outlines, no antialiasing or gradients. Isolated complete cluster centered with generous true transparent alpha margin, transparent gaps between pieces. No floor, no cast shadow outside the pieces, no labels, no text, no logos, no scene. Keep the same materials and palette as the reference.
```

## tin-opened

```text
Use case: precise-object-edit
Reference: attached closed bordeaux biscuit tin. Create ONE opened spilled final state: the SAME recognizable small bordeaux metal tin with cream rim and cream heart on its side, tipped onto its side with its open mouth facing right, its detached matching lid lying on the left, and a few warm golden round biscuits with dark chocolate dots scattered to the right. The heart and all printed decoration must rotate coherently with the tipped tin. No upright closed tin, no duplicate tin. Low compact bounded horizontal cluster intended final size 84 pixels wide by 32 pixels tall, common baseline, front/side view, generous true transparent alpha margin and gaps. Same simple crisp chunky pixel-art style and warm brown outline, no gradients, no antialiasing, no scene, floor, outside cast shadow, text, logo or label.
```

## glass-shard

```text
Use case: stylized-concept
Create ONE tiny transparent low-resolution pixel-art glass shard for a cozy side-view cat game. A single small irregular triangular pale sage and warm cream translucent glass fragment, dark muted olive-brown outline, one short cream highlight. No blood or danger emphasis. Designed to read at 8 by 8 pixels with chunky square pixel clusters, very few colors, no antialiasing or gradients. Exactly one isolated complete shard centered with true transparent alpha background and ample clear margin. No intact jar, no multiple pieces, no pasta, no floor, no cast shadow, no text, labels or watermark.
```

## tin-opened-fix

```text
Use case: precise-object-edit
Edit the attached opened biscuit-tin sprite. Change ONLY the cream heart printed on the body of the tipped tin: rotate that heart exactly 90 degrees clockwise so the pointed bottom of the heart points LEFT, matching the tipped container. Keep its center, cream color, size and pixel clusters. Preserve EVERYTHING else exactly: tin shape and open mouth facing right, detached lid on left, cookies on right, palette, outline, layout, true transparent background and margins. No added elements, text or shadows.
```
