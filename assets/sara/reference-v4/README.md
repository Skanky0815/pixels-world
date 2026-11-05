# Sara v4: kompakter Chibi-Referenzentwurf

Aktueller visueller Entwurf für #88 nach Ricos Feedback: kleiner/Chibi, etwas ausgeprägteres Kinn und zwei leicht abstehende Strähnen. Brille, Pferdeschwanz, dunkler Ansatz und Hoodie bleiben erhalten. Keine vollständigen Animationen oder Phaser-Integration.

- `sara-idle-left-source-v4.png`: unveränderte Imagegen-Quelle.
- `sara-idle-left-v4.png`: transparente 64×96-Pixel-Zelle; sichtbare Figur genau 60 Pixel hoch, im Spiel bei Faktor 2 entsprechend 120 Pixel. Silhouette einmal gemeinsam auf diese Referenzhöhe normalisiert, Nearest Neighbor, Alpha ab 128 deckend; ursprüngliche Alpha-Daten bleiben in der Quelle erhalten.
- `sara-pixel-detail-v4.png`: vierfach vergrößerter Vergleich mit dem tatsächlichen unveränderten Pixel-Master, gemeinsame Fußlinie.
- `sara-pixel-room-scale-v4.png`: statische Maßstabsprobe auf der vorhandenen 960×540-Raumgeometrie, beide Figuren mit Spielskalierung 2; noch kein Phaser-Screenshot und keine Integration.
- `metadata-v4.json`: gemessene Bounds und vorläufiger Origin.
- `generation-prompts-v4.md`: vollständige Prompts.

Gemessene Bounds x=14–49, y=30–89 (nullbasiert). Fußanker `(0.5, 90/96)`. Für spätere Animationen muss dieser Maßstab und Anker gemeinsam gelten; einzelne Posen nicht unabhängig skalieren. Noch keine Kollisionsgröße festgelegt.

Alpha im Rasterexport ist binär. Die erzeugte Vorlage enthält weiterhin mehr Farbabstufungen als die angestrebte feste Palette (Rasterexport: 709 RGB-Werte). Paletten- und Animationskonsistenz sind weitere Produktionsschritte; dies ist die Stil-/Größenreferenz. v1 bleibt ausschließlich als überholte Vergleichsrichtung erhalten.
