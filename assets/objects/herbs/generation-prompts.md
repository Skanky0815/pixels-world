# Küchenkräuter: vollständige Erzeugungsprompts

Modus: integriertes Bildwerkzeug (`image_gen`) mit echtem transparentem Hintergrund. Basilikum wurde neu erzeugt; Petersilie und Minze wurden daraus mit unverändertem Topf und Aufbau abgeleitet. Jede Quelle enthält zwei nebeneinanderliegende Zustände derselben Variante: links intakt, rechts angeknabbert.

## basil

```text
Use case: stylized-concept
Asset type: a transparent TWO-FRAME sprite strip for one herb variant in Pixel’s World, a cozy tiny 2D side-view pixel-art cat game.
Composition: Exactly TWO separate upright versions of the SAME small potted herb, side by side, centered in equal left and right halves, same base line, same size, generous transparent gap and outer margin. Left frame intact lush plant; right frame the same plant after a cat has nibbled it, several upper leaves and shoot tips missing, shorter irregular clipped silhouette, same intact pot and remaining stems. No labels or separator lines. Each frame will be exported to 40x60 pixels. Simple chunky readable silhouettes with crisp square pixel clusters, few colors, no antialiasing, no soft gradients. A small warm terracotta flowerpot with a muted bordeaux rim and dark brown outline. Leaves natural warm greens, warm walnut outlines. Pot occupies bottom third, entire plant fully visible. True transparent alpha background including leaf gaps, no floor, no outside cast shadow, no scene, no cat, no text, no logo, no watermark.
Herb identity: BASIL: broad smooth rounded oval leaves in opposite pairs, a compact full bush with a few larger clear leaves, fresh medium warm green, easily recognizable as basil. Both frames use exactly the same terracotta pot.
```

## parsley

```text
Use case: precise-object-edit
Edit target: the attached two-frame BASIL game sprite strip. Create the PARSLEY variant. Change ONLY the foliage: replace basil’s broad leaves with unmistakable flat-leaf parsley, many small deeply lobed fan-shaped leaves in clusters, darker warm green. Preserve the exact terracotta pot with bordeaux rim in each frame, the two equal side-by-side cells, common base line, margins, perspective, crisp chunky square pixel art and transparent background. Left plant lush intact; right plant visibly nibbled with missing upper foliage and exposed remaining stems. Right pot and base position exactly match the left frame; both pots unchanged from the reference. It must still read at 40x60 pixels per frame, simple distinct parsley silhouette, no fine noisy texture. No text, labels, logo, shadows outside objects, scene or additional objects. Keep genuine transparent alpha gaps among leaves and around the sprites.
```

## mint

```text
Use case: precise-object-edit
Edit target: attached two-frame BASIL game sprite strip. Create the MINT variant. Change ONLY the foliage: replace basil with upright mint stems carrying opposite pairs of elongated pointed oval leaves, clearly serrated sawtooth margins and simple visible center veins. Use a slightly deeper fresh warm green than basil, no flowers. Preserve the EXACT terracotta pot and bordeaux rim, both equal side-by-side cells, shared base line and generous transparent margins. Left frame full intact plant; right frame the same mint visibly nibbled, missing upper shoot tips and some leaves, with clipped stems and remaining lower leaf pairs; same unchanged pot. Crisp chunky pixel-art clusters, no antialiasing, no smooth gradients, clear silhouette readable at 40x60 pixels. True transparent alpha background and transparent leaf gaps. No labels, text, logo, floor, external cast shadow, scene or other objects.
```

