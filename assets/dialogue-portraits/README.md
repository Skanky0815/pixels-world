# Dialogporträts · v1

Master sind die unveränderten Landingpage-Bilder
`assets/team/sara-portrait-v1.png` und `assets/team/pixel-portrait-v3.png`.
Sie werden direkt für ruhige Sara und neutralen Pixel referenziert.
Ihre Quellen und bisherigen Prompts bleiben in `assets/team/portraits-v1.json`.

Die drei Sara-Ausdrücke unter `sources/` wurden mit dem eingebauten
`image_gen` als separate Bearbeitungen des Sara-Masters erzeugt. Identität,
Brille, Frisur, Hoodie, Ausschnitt und grobes Pixelraster dienen als feste Vorgaben;
geändert werden sollten nur Gesichtsausdruck und Blick. Die generierten Quellen
bleiben unverändert inklusive Alpha. Vollständige Prompts und Quellenzuordnung
stehen in [draft-v1.json](draft-v1.json).

`/portrait-preview.html` zeigt im Dev-Server den direkten Mastervergleich sowie
Dialoglayouts für Desktop und Handy, mehrere Größen, DE/EN, längere Texte und
den Fallback ohne Porträt. `node tools/prepare-dialogue-portraits.mjs` exportiert
die drei Ausdrucksquellen mit derselben Nearest-Neighbor-Abtastung wie die
Landingpage-Porträts auf 128×128 Pixel. Diese Exporte verwendet auch das Spiel;
die großen Generatorquellen werden nicht ausgeliefert.

Sara wird in Galerie und Dialogprobe per CSS horizontal gespiegelt, sodass sie
nach rechts zum Dialogtext schaut. Die Bildquellen bleiben dabei unverändert;
Pixel behält seine bereits nach rechts gerichtete Ansicht. Im Spiel übernimmt
Phaser dieselbe Spiegelung; auf Touch-Geräten die mobile DOM-Ansicht.

`game/domain/dialogue-portrait.ts` ordnet die Phasen zu: Sara kommt neutral herein,
reagiert bei höherem Chaos überrascht und spricht anschließend genervt. Pixel
begleitet die Charme-Eingaben, Sara antwortet auf Feedback und im Ergebnis.
Erfolgreiche Versöhnung zeigt ihre freundliche Ansicht. Der URL-Katalog liegt in
`game/assets/dialogue-portraits.ts`. Fehlende Phaser-Texturen geben die Textbreite
wieder frei; mobile Bildfehler blenden nur das dekorative Bild aus.
