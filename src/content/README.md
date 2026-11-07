# Räume und Objektvorlagen pflegen

Das Standardzimmer steht in [rooms/living-room.ts](rooms/living-room.ts). [rooms/cozy-remix.ts](rooms/cozy-remix.ts) zeigt eine zweite handgebaute Variante mit verschobenen Objekten, zwei Instanzen derselben Sofavorlage und anderen Schadenswerten. Beide verwenden [objects/catalog.ts](objects/catalog.ts). Definitionen werden mit `satisfies` gegen die [reinen Datenverträge](../game/content/definitions.ts) geprüft.

## Vorlagen und Instanzen

Eine `ObjectDefinition` ist eine diskriminierte Vorlage (`couch`, `curtain`, `plant` oder `vase`). Sie beschreibt einen bekannten symbolischen Asset-Schlüssel, tatsächlich implementierte Fähigkeiten und Geometrie/Regelwerte. Mehrere Varianten desselben Typs können andere Werte haben. Eine Rauminstanz referenziert ihre Vorlage über `variant` und besitzt eine eigene eindeutige `id` sowie Platzierung. Keine Definition enthält Klassen-/Funktionsnamen zur Ausführung oder eine allgemeine Regelsprache.

- `placement.mode: 'surface'`: x-Position auf einer benannten Auflage. Unterstützt Boden, Raumplattformen und Sitzflächen anderer Sofas. Sofa-x bezeichnet die linke Sitzkante, Pflanzen-/Vasen-x die Mitte. Die Auflagehöhe wird aus der Referenz berechnet; sie wird nicht nochmals in die Instanz eingetragen.
- `placement.mode: 'area'`: linke obere Ecke eines Vorhangs. Breite und Höhe stammen aus der Vorlage.
- Sofa-Geometrie enthält Breite, Sitzdicke und Sitzhöhe über der Auflage. Rendering, Collider und Nähe verwenden daraus dieselbe Sitzfläche.
- Der Spawn referenziert ebenfalls eine Auflage. Pixel muss mit der 52×52-Kollisionsfläche darauf Platz haben.

`RoomDefinition` enthält logische Abmessungen, Boden, Spawn, Plattformen, Instanzen, HUD-Hinweisposition und statische Dekoration. Dekoration besteht nur aus Rechtecken und Texten. Kleine TypeScript-Helfer im Beispiel erzeugen daraus wiederholte statische Daten; es werden keine Gameplay-Callbacks gespeichert.

## Spawn-Profile für Slots

Jede Objektvorlage besitzt ein typisiertes `spawn`-Profil im bestehenden Katalog:
`size` (`small`, `medium`, `large`), `category` und `random`. Zufallskandidaten
nennen ihre zulässige Auflage (`support: 'floor' | 'any-surface'`). Feste
Raumausstattung verwendet `random: false` mit `reason: 'room-fixture'`.
`goal.spawn` schützt das separate Hauptziel ausdrücklich mit `reason: 'main-goal'`;
es wird nicht in den gewöhnlichen Objektkatalog verschoben. Figuren und
Plattformen sind ebenfalls keine Zufallskandidaten.

Die Größenklassen aus [spawn-profile.ts](../game/content/spawn-profile.ts) sind
konservative Auswahlklassen: bis 32×32 Spielpixel `small`, bis 96×96 `medium`,
darüber `large`. Die Prüfung nutzt vorhandene Asset-/Objektmaße; bei Sofas Breite
und Sitzhöhe. Diese Klassen verändern keine Grafik oder Kollisionsfläche und
ersetzen keine exakte Geometrie-/Überlappungsprüfung. Kategorie und vorhandene
`capabilities` bleiben unabhängig: benötigte Fähigkeiten eines Filters müssen
alle vorliegen, Kategorien sind erlaubte Alternativen.

`filterSpawnCandidates` liefert passende Katalogschlüssel in stabiler Reihenfolge;
`fitsSpawnSlot` prüft Größenkapazität, Kategorie, Auflage und optional
`requiredCapabilities`. Ein leerer Kategoriefilter erlaubt keine Kandidaten.
Profile, Größen und Filter werden vor Verwendung validiert. Die bestehende
Raumvalidierung erkennt fehlende Metadaten, unpassende Kategorien/Größen und
verbotene Zufallsplatzierung struktureller Objekte oder des Hauptziels.

Katzengras ist aktuell nur für Bodenplätze geeignet: seine stehende Interaktion,
Kippbewegung und Erde benötigen einen festen Bodenanker. Der Filter schließt es
auf erhöhten Möbelplätzen aus. Auch eine passende Größenklasse allein erlaubt
keine solche Platzierung. Weitere Auflagenunterstützung benötigt eine eigene
Mechanikänderung.

Die Metadaten dienen der unten beschriebenen Slotbelegung; ausdrücklich platzierte
Rauminstanzen bleiben unabhängig von ihrer Zufallseignung erhalten.

## Vor dem Engine-Start validieren

[resolveRoom](../game/content/resolve-room.ts) prüft alle Objektvorlagen und den gewählten Raum, bevor `Phaser.Game` erzeugt wird. Zusätzlich validiert die Vite-Konfiguration beim Build-/Dev-Start alle registrierten Räume, sodass Fehler schon dort scheitern. Geprüft werden Shape-Grundlagen, endliche Zahlen, sichere nicht negative Punktwerte, positive Intervalle, zulässige Geometrie/Farben, bekannte und passende Assets/Fähigkeiten, eindeutige IDs über Objekte und Flächen hinweg, Referenzen, Auflagegrenzen, Raumgrenzen, Spawn und zyklische Auflagen. Auch die insgesamt mögliche Punktzahl muss eine sichere Ganzzahl bleiben. Fehlermeldungen nennen den logischen Datenpfad, z. B. `rooms.living-room.objects.small-vase.placement.surfaceId`.

Die Auflösung ändert keine Quelldaten und erzeugt noch keine Phaser-Objekte. [buildObjects](../game/content/build-objects.ts) verbindet danach die aufgelösten Konfigurationen mit den bekannten Objektklassen. [drawRoom](../game/content/draw-room.ts) zeichnet Hintergrund und Plattformen aus denselben Daten. Neues Verhalten bleibt Spielcode; neue Platzierungen und Varianten werden Content. Vollständige JSON-Importvalidierung ist separat #43 und wird hier nicht vorweggenommen.

## Vorschau und Assets

Normaler Start verwendet das Standardzimmer mit der unten beschriebenen Slotbelegung. Im Dev-/E2E-Betrieb zeigt `/?room=cozy-remix` die zweite Variante; die Produktion ignoriert diese Vorschauwahl. Weitere handgebaute Räume werden im Raumindex registriert. Es gibt keinen Raumeditor; #29 kann später denselben `RoomDefinition`-Vertrag liefern und anschließend validieren. Zufall betrifft ausschließlich die ausdrücklich deklarierten Slots.

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

### Regale und Stabilität

Alle Plattformen mit `asset: 'wood-shelf'` verwenden dieselbe `Shelf`-Klasse.
`durability.stability` wählt pro Platzierung `fragile`, `normal` oder `stable`;
ohne Angabe bleibt ein Regal dauerhaft stabil. Fragil warnt ab der ersten,
beschädigt ab der zweiten und stürzt bei der dritten Landung ein. Normal nutzt
2/4/5 Landungen. Optional überschreibt `durability.rules` die Felder `warningAt`,
`damageAt`, `collapseAt`, `damageValue` und `collapseValue`. Die Schwellen müssen
positiv und streng aufsteigend, Punkte nichtnegativ ganzzahlig sein. Stabile
Regale akzeptieren keine Einsturzregeln; der Zielanker muss stabil bleiben.

Nur eine neue Flugphase nach dem ersten Bodenkontakt mit anschließender Landung
auf dem Regal zählt. Stehen, seitlicher Kontakt und das Einsetzen beim Start zählen
nicht mehrfach. Warnung ist sichtbar als kurzer, gedämpfter Wackelimpuls nach jeder belastenden
Landung (650 ms); anschließend steht das Regal wieder ruhig. Beschädigung bleibt
zusätzlich als Riss sichtbar.
Beschädigung und Einsturz vergeben ihre `ChaosEvent`s je einmal; Reset repariert
Bild, Körper und Historie. Beim Einsturz fällt das Brett ohne Kollisionsfläche
mit derselben Brettstärke und ausgefransten Bruchkanten auf den Boden. Direkt aufliegende Vasen wechseln in ihre bestehende Fallphysik.
Rechteckdekorationen können sich über `supportedBy` einem Regal zuordnen; die
Bücher bleiben dadurch beim Einsturz nicht in der Luft. Kettenreaktionen sind
kein eigener Teil dieses Ablaufs.

Spiel und Playground laden dieselben Regalmodule aus `assets/objects/shelves/`.
`node tools/prepare-shelf-assets.mjs` exportiert zwei 8×8-Endstücke, eine wiederholte
8×8-Mitte, einen 4×10-Träger und eine transparente 8×8-Bruchkante. Die Darstellung bei 2× hält Endstücke und Träger
fest und wiederholt die Mitte auch für nicht durch 16 teilbare Brettbreiten.
Die Brettoberkante und Colliderhöhe stammen weiterhin aus den Raumdaten.
Quellen, Imagegen-Prompts und Exportparameter liegen neben den PNGs.

### Zufällige Belegung fester Regalplätze

Plattformen können optional `slots` deklarieren. Jeder Eintrag besitzt eine lokale
`x`-Position (Objektmittelpunkt relativ zur linken Brettkante), eine eindeutige
`id`, `capacity`, `categories`, optionale `requiredCapabilities` und einen
Varianten-`pool`. Die Auflage ist die Oberkante des Regals; sein Filter verwendet
`support: 'raised'`. `count.easy/normal/hard` bestimmt die gewünschte Anzahl pro
Träger. Fehlende geeignete Kandidaten oder belegte Plätze bleiben leer. Unbekannte
Poolvarianten, doppelte IDs und ungültige Counts werden vor dem Aufbau abgewiesen.

Beide Wohnzimmer verwenden auf dem unteren Regal drei Plätze rechts neben den
Büchern: Leicht belegt einen, Normal zwei und Schwer drei. Die vorhandenen vier
Vasenvarianten liefern die Auswahl. Die anderen Möbel, festen Vasen und das Ziel
bleiben ausdrücklich platziert. Exakte Objektgrenzen werden zusätzlich zu den
Metadaten gegen Brettkanten, feste Objekte, Ziel, Plattformen und unterstützte
Dekoration geprüft; überlappende Kandidaten werden nicht erzeugt.

`populateSpawnSlots` materialisiert einmal beim Rundenaufbau gewöhnliche
`ObjectInstance`s. Danach steuern dieselben Vasen- und Regalmechaniken Anschubsen,
Fall, Bruch und Einsturz; während der Runde wird nichts nachgefüllt. Räume ohne
Slots behalten ihre feste Belegung. Die bestehende Schwierigkeit wird zuerst auf
den Raum angewendet, danach erfolgt die Slotbelegung.

Die Szene verwendet Phasers `RandomDataGenerator` mit einem eigenen Raumseed,
unabhängig vom Rundentimer. Ein Neustart behält diesen Seed, sodass dieselbe
Schwierigkeit dieselbe Belegung ergibt. Ein neuer Seitenaufruf erzeugt einen neuen
Seed. Für reproduzierbare DEV-/E2E-Spieltests kann `?room-seed=beispiel` gesetzt
werden; Produktionsbuilds ignorieren diesen Parameter. Gewichte und automatisches
Nachfüllen gehören nicht zum Slotvertrag.
