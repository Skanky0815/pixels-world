# Sara: Abschlussentwürfe v1

Mit dem eingebauten Bildwerkzeug erzeugte Quellen für #274. Die Posen wurden lokal neben Pixel im Sitzen und in Rückenlage abgestimmt. Spiel und Dev-Vorschau verwenden den gemeinsamen Rasterexport.

## Streicheln

Quelle: `sara-pet-source-v1.png`

```text
Use case: illustration-story. Asset type: production pixel-art game animation source sheet. Generate a NEW six-frame Sara kneeling and petting animation sheet using the attached approved Sara images solely as identity/style references. Reference 1 is her approved large idle identity; reference 2 is the approved production palette and pixel density. Preserve her large chibi head, angular black glasses, blonde ponytail with dark brown roots and two loose strands, charcoal hoodie with light drawstrings, ripped grey jeans and dark shoes. Facing LEFT throughout, side/three-quarter view. Genuine transparent background, no glow, no shadows, no ground, no text, no labels, no grid lines, no cat and no additional people. Layout exactly 3 equal columns by 2 equal rows, six separated full-body cels in reading order, on a 1536x1024 canvas (each cell512x512). Every cel has the SAME body/head scale and the SAME ground baseline at cell y450; body/feet anchor near cell x280. Standing reference height about330 pixels; kneeling must become naturally shorter, NEVER rescale the head or whole character to fill the cell. Frame0: approved standing relaxed pose, looks down left. Frame1: bends knees and begins lowering torso toward a seated cat just outside the left side. Frame2: kneels/crouches, friendly face, one hand extends down-left toward the invisible cat's head. Frame3: crouched, open hand gently touches an invisible cat's head near cell x150,y330. Frame4: same crouch, same stable torso and feet, hand moves about20 pixels left across that same invisible head in a short stroking motion. Frame5: same crouch, relaxed friendly resting hand near the same contact point. Her other hand rests on her knee. Do not draw the cat; it is a separate existing sprite. Make anatomy coherent, tiny motion between contact frames, clearly visible arm and palm, keep glasses fully legible, consistent pixel edges and restrained flat palette. All outlines and limbs fit inside each cell with ample transparent margins.
```

## Sauer bleiben

Quelle: `sara-sulk-source-v1.png`

```text
Use case: illustration-story. Asset type: pixel-art game character animation source sheet, FOUR full-body frames in a strict 2-column x2-row grid on a1024x1024 transparent canvas, cells512x512. Image1 is the new petting-sheet STYLE/SCALE REFERENCE (not a target); image2 is the approved Sara identity reference. Generate Sara staying visibly annoyed after a failed reconciliation. SAME character, head size, blonde ponytail with dark roots and loose strands, thick angular black glasses ALWAYS visible, charcoal hoodie/light drawstrings, ripped grey jeans, dark shoes. Match the standing character size from the top-left cel of Image1, about400px tall in each512px cel. Same feet baseline at local y460 and body center at local x280 in EVERY cel, fixed scale, full body visible with transparent margins. Frame0 relaxed standing looking down LEFT as in identity reference. Frame1 slightly frowns, elbows bend and hands move inward. Frame2 firmly crosses arms in front of the hoodie, mouth a tiny dissatisfied line, looks down-left toward invisible cat. Frame3 keeps arms crossed and feet/torso still, turns gaze and head slightly away to the right in a demonstrative sulk, still show glasses, same face identity. Motions modest, readable silhouette, coherent arms and hands, no extra limbs. No yelling, aggression, head-grabbing or sadness; dry affectionate annoyance. NO CAT, NO PROPS, NO LABELS, NO GRID, NO TEXT, NO floor, NO drop shadow, NO glow and NO background pixels. True alpha background, all pixels outside silhouette fully transparent. Preserve consistent coarse pixel clusters and flat limited colors.
```

## Höhere Hand für den sitzenden Pixel

Quelle: `sara-head-source-v1.png`; gezielte Variante der Bauch-Quelle mit höherem Arm.

```text
Use case: precise-object-edit. EDIT TARGET: attached six-cel Sara sheet. Preserve the exact3columns x2rows composition, transparent background, pixel-art style, Sara identity, glasses, hair, head size, hoodie, legs, feet, fixed pose anchors and every cell's body position. CHANGE ONLY her reaching arm and hand in frames2,3,4,5 (reading order, zero-based). Keep frames0 and1 unchanged. This variant is for stroking the TOP of a SITTING cat's head: raise the reaching hand approximately75 source pixels upward within each cell compared with the existing low hand, with a natural bent elbow. The palm should be horizontal and face down, about75 pixels higher than now, to the LEFT of Sara's chin. The crouched body and planted knee/feet MUST stay exactly where they are; DO NOT move the entire person or scale her. Keep the other hand resting on her knee. Frames3and4 should be nearly identical except for a short20-25px horizontal stroke of the newly raised hand. Frame5 holds the raised hand gently at the same contact height. No cat, no extra objects, no text, no grids, no glow or shadows. Keep all background genuinely transparent, preserve alpha and all silhouettes apart from the specified arm change.
```
