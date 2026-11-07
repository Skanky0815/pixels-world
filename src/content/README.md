# Räume und Objektvorlagen pflegen

Das Standardzimmer steht in [rooms/living-room.ts](rooms/living-room.ts). [rooms/cozy-remix.ts](rooms/cozy-remix.ts) zeigt eine zweite handgebaute Variante mit verschobenen Objekten, zwei Instanzen derselben Sofavorlage und anderen Schadenswerten. Beide verwenden [objects/catalog.ts](objects/catalog.ts). Definitionen werden mit `satisfies` gegen die [reinen Datenverträge](../game/content/definitions.ts) geprüft.

## Vorlagen und Instanzen

Eine `ObjectDefinition` ist eine diskriminierte Vorlage (`couch`, `curtain`, `plant` oder `vase`). Sie beschreibt einen bekannten symbolischen Asset-Schlüssel, tatsächlich implementierte Fähigkeiten und Geometrie/Regelwerte. Mehrere Varianten desselben Typs können andere Werte haben. Eine Rauminstanz referenziert ihre Vorlage über `variant` und besitzt eine eigene eindeutige `id` sowie Platzierung. Keine Definition enthält Klassen-/Funktionsnamen zur Ausführung oder eine allgemeine Regelsprache.

- `placement.mode: 'surface'`: x-Position auf einer benannten Auflage. Unterstützt Boden, Raumplattformen und Sitzflächen anderer Sofas. Sofa-x bezeichnet die linke Sitzkante, Pflanzen-/Vasen-x die Mitte. Die Auflagehöhe wird aus der Referenz berechnet; sie wird nicht nochmals in die Instanz eingetragen.
- `placement.mode: 'area'`: linke obere Ecke eines Vorhangs. Breite und Höhe stammen aus der Vorlage.
- Sofa-Geometrie enthält Breite, Sitzdicke und Sitzhöhe über der Auflage. Rendering, Collider und Nähe verwenden daraus dieselbe Sitzfläche.
- Der Spawn referenziert ebenfalls eine Auflage. Pixel muss mit der 52×52-Kollisionsfläche darauf Platz haben.

`RoomDefinition` enthält logische Abmessungen, Boden, Spawn, Plattformen, Instanzen, HUD-Hinweisposition und statische Dekoration. Dekoration besteht nur aus Rechtecken und Texten. Kleine TypeScript-Helfer im Beispiel erzeugen daraus wiederholte statische Daten; es werden keine Gameplay-Callbacks gespeichert.

## Vor dem Engine-Start validieren

[resolveRoom](../game/content/resolve-room.ts) prüft alle Objektvorlagen und den gewählten Raum, bevor `Phaser.Game` erzeugt wird. Zusätzlich validiert die Vite-Konfiguration beim Build-/Dev-Start alle registrierten Räume, sodass Fehler schon dort scheitern. Geprüft werden Shape-Grundlagen, endliche Zahlen, sichere nicht negative Punktwerte, positive Intervalle, zulässige Geometrie/Farben, bekannte und passende Assets/Fähigkeiten, eindeutige IDs über Objekte und Flächen hinweg, Referenzen, Auflagegrenzen, Raumgrenzen, Spawn und zyklische Auflagen. Auch die insgesamt mögliche Punktzahl muss eine sichere Ganzzahl bleiben. Fehlermeldungen nennen den logischen Datenpfad, z. B. `rooms.living-room.objects.small-vase.placement.surfaceId`.

Die Auflösung ändert keine Quelldaten und erzeugt noch keine Phaser-Objekte. [buildObjects](../game/content/build-objects.ts) verbindet danach die aufgelösten Konfigurationen mit den bekannten Objektklassen. [drawRoom](../game/content/draw-room.ts) zeichnet Hintergrund und Plattformen aus denselben Daten. Neues Verhalten bleibt Spielcode; neue Platzierungen und Varianten werden Content. Vollständige JSON-Importvalidierung ist separat #43 und wird hier nicht vorweggenommen.

## Vorschau und Assets

Normaler Start bleibt das unveränderte Standardzimmer. Im Dev-/E2E-Betrieb zeigt `/?room=cozy-remix` die zweite Variante; die Produktion ignoriert diese Vorschauwahl. Weitere handgebaute Räume werden im Raumindex registriert. Es gibt keinen Editor und keine Zufallsgenerierung; #29 kann später denselben `RoomDefinition`-Vertrag liefern und anschließend validieren.

Content verwendet nur Schlüssel aus [dem Asset-Katalog](../game/assets/definitions.ts). Prozedurale Platzhalter sind ihrem tatsächlichen Objekttyp zugeordnet. Das Pixel-Sheet wird über einen Vite-Asset-Import aufgelöst, ohne fest codierten Host oder Repository-Präfix. Die Asset-Auflösung muss auch mit `--base=/pixels-world/` funktionieren; siehe [QA](../../docs/qa.md). Der öffentliche Spielstand ist über [GitHub Pages](https://skanky0815.github.io/pixels-world/) erreichbar.

Die Versionsangabe im normalen Seitenfooter stammt beim Build aus der zentralen `package.json`. Das Jahr wird zur Laufzeit ermittelt. Die Anzeige ist eine Build-Version, kein zusätzlicher Veröffentlichungsmechanismus; Release Please pflegt dieselbe Versionsquelle.

## Hauptziel pro Raum

`RoomDefinition.goal` enthält genau ein festes Ziel: ID, `kind: toy`,
Bezeichnung/Motivation, `surfaceId`, X-Position und `dwellMs`. Die bestehende
Auflagenauflösung prüft Position und eindeutige ID vor dem Szenenstart.
Das Ziel ist ein nicht zerstörbares Spielobjekt mit eigener reiner Kontaktlogik,
kein zusätzlicher Chaosobjekt-Typ oder Punktelieferant. Der erste akzeptierte
Rundenabschluss (Ziel oder Deadline) führt in den vorhandenen Heimkehrablauf.
Die aktuelle Platzierung am oberen Regal ist in beiden Räumen schadenfrei
per Tastatur erreichbar; neue Platzierungen benötigen denselben Spieltest.

## Vasen-Grafikvarianten

Das bekannte Asset `vase-default` behält seinen 18×28-Geometrie- und
Fähigkeitsvertrag. Die optionale `appearance` wählt `terracotta`, `blue`, `gold`
oder `mellow` aus dem festen Grafikregister; Mellow hat eine eigene Form.
Mit `appearance` stammen Farben und Scherben aus den PNGs. Ohne diese Angabe
bleibt die prozedurale, mit `color` eingefärbte Darstellung für bestehenden
Content erhalten. Punkte, Physik, Auflageanker und Instanz-IDs sind unabhängig
davon. Die gemeinsame Preload-Funktion lädt dieselben Texturen im Spiel und
im DEV-Playground; URLs werden für den Pages-Unterpfad von Vite aufgelöst.

`assets/objects/vases/generation-v1.json` dokumentiert Quellen und Prompts.
`node tools/prepare-vase-assets.mjs` erzeugt die kleinen Exporte reproduzierbar:
Alpha-Bounds ab 192 bestimmen den Ausschnitt, Nearest Neighbor erhält die
abgetasteten RGBA-Werte. Vasen stehen unten mittig in 18×28-Zellen, Scherben
zentriert in 8×8-Zellen. Die ursprünglichen Generierungsbilder bleiben erhalten
und werden nicht als Laufzeitdateien importiert.

### Sofa-Grafik

Sofas wählen mit optionalem `appearance: 'cozy' | 'worn'` ihre Stoffvariante;
ohne Angabe wird Cozy verwendet. Regeln und Sitzgeometrie bleiben davon unabhängig.
Die gemeinsame Vorladung in Spiel und Playground lädt nur die kleinen PNGs aus
`assets/objects/couch/`. Quellen und vollständige Imagegen-Prompts liegen dort
in `sources/` und `generation-v1.json`.

`node tools/prepare-couch-assets.mjs` exportiert die freigegebenen V3-Sofas in
136×80 und den transparenten Kratzpatch in 14×16 Pixel. Der Nearest-Neighbor-Export
erhält die ausgewählten RGBA-Werte; seine zweigeteilte Höhenabbildung setzt die
Sitzkante auf Quellzeile 30. Das Bild wird an den vorhandenen Sitz-/Bodenanker
angepasst, der Kollisionskörper bleibt unabhängig. Pro Schadensereignis entsteht
ein Patch am nächsten freien Platz beim Boden- oder Sitzkontakt. Die 14×16-Quellpatches
werden auf den normalen Sofas zweifach gezeichnet und halten vier Spielpixel
Abstand. Auf schmaleren eigenen Sofas bleiben sie einfach skaliert mit zwei
Pixeln Abstand, damit sechs Kratzstellen weiterhin Platz finden. Reset und Szenenende entfernen diese
Instanzen; Pixels Kratzpose benötigt keine zusätzlichen gezeichneten Pfoten.

### Vorhang-Grafik

Der bestehende `curtain-default` lädt im Spiel und Playground dieselbe rostrote
Basis und einen separaten Risspatch über `preloadCurtainArt`. Kletterfläche und
Schadensregeln bleiben im Content; Bild-Bounds ersetzen sie nicht. Neue Risse
suchen den nächsten freien Platz nahe Pixels tatsächlichem Kontakt. Die Patches
bleiben vollständig im Stoff, liegen hinter Pixel und werden beim Reset entfernt.

Quellen und Imagegen-Prompts liegen unter `assets/objects/curtain/`.
`node tools/prepare-curtain-assets.mjs` exportiert die freigegebene Basis in
56×178 und den Risspatch in 12×20 Pixel. Die Alpha-Bounds ab 192 werden
seitenverhältnistreu per Nearest Neighbor zentriert eingepasst; übernommene
RGBA-Werte bleiben erhalten. Nur die Export-PNGs gelangen ins Laufzeitbundle.

### Katzengras-Grafik

Spiel und Playground laden über `preloadCatgrassArt` dieselben PNGs für intaktes
und angebissenes Gras sowie die separate verschüttete Erde. Die Pflanze steht
unten mittig in einer 40×60-Zelle. Bissspur, Warnwackeln und Kippen verwenden die
bestehenden Domain-Zustände und Rotationen: −80° bei x+10/y−17 nach dem Umkippen.
Interaktionsbereich, Bodenanker, Punkte und Physik bleiben unabhängig vom Bild.
Die 80×10-Erde erscheint hinter Pixel und verschwindet beim Reset.

Quellen und vollständige Imagegen-Prompts liegen unter `assets/objects/catgrass/`.
`node tools/prepare-catgrass-assets.mjs` exportiert per Nearest Neighbor und
bewahrt abgetastete RGBA-Werte. Beide Pflanzenzustände verwenden die Alpha-Bounds
(ab 192) und Abbildung der intakten Quelle; Zeilen 39–59 des freigegebenen Topfs
werden identisch übernommen. So bleiben Topf und Drehpunkt beim Biss stabil.
Nur die kleinen Export-PNGs werden im Spiel geladen.

### Lieblingsball-Grafik

`favorite-ball` im Asset-Register beschreibt die 16×16-Zelle. `preloadFavoriteBallArt`
lädt das gemeinsame transparente PNG; `GoalView` setzt es mit dem unteren
Mittelpunkt auf den aufgelösten Ziel-/Regalanker. Stern und Halo sind getrennte
Hinweise für den aktiven Zustand. Nach erreicht/verpasst bleibt der Ball sichtbar;
der Marker verschwindet, die bisherigen Texte bleiben erhalten. Vor Spielstart
sind Ball und Marker ausgeblendet. Zielbereich, Aufenthaltszeit, Heimkehrtrigger,
Physik und friedliche Erreichbarkeit ändern sich durch die Grafik nicht.

Quelle und Imagegen-Prompt liegen unter `assets/objects/favorite-ball/`.
`node tools/prepare-favorite-ball-assets.mjs` passt die Alpha-Bounds ab 192
seitenverhältnistreu in maximal 14×14 Pixel ein und zentriert sie in 16×16.
Nearest Neighbor bewahrt die abgetasteten RGBA-Werte; nur das kleine Export-PNG
wird im Spiel geladen.
