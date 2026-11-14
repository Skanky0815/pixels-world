# Räume und Objektvorlagen pflegen

Das Standardzimmer steht in [rooms/living-room.ts](rooms/living-room.ts). [rooms/cozy-remix.ts](rooms/cozy-remix.ts) zeigt eine zweite handgebaute Variante mit verschobenen Objekten, zwei Instanzen derselben Sofavorlage und anderen Schadenswerten. Beide verwenden [objects/catalog.ts](objects/catalog.ts). Definitionen werden mit `satisfies` gegen die [reinen Datenverträge](../game/content/definitions.ts) geprüft.

## Öffentliche Zimmerauswahl

Die DEV-Vorschau `play.html?room=kitchen-preview` zeigt den Küchen-Grundraum aus
[#57](https://github.com/Skanky0815/pixels-world/issues/57): Spawn links, Hocker,
Tisch und Arbeitsplatte rechts. Alle drei Auflagen sind standfest und verwenden
dieselbe Plattform-/Kontaktlogik wie die Regale. Die [Küchengrafiken](../../assets/environment/kitchen/README.md) werden an
denselben Auflagen und Bodenankern ausgerichtet; Tisch-/Hockerbeine sind reine Dekoration
und bleiben durchlässig, die Küchenzeile besitzt einen geschlossenen Körper bis
zum Boden. `appearance` erlaubt dafür `stool`, `table` oder `counter` ausschließlich
mit stabiler Auflage. Oberhalb hängende Schränke sind vorerst reine Kulisse.
`homecomingSide: 'left'` legt hier Tür und Saras Auftritt nach links; Pixel kehrt
auf den freien Boden vor dem Hocker zurück. Blickrichtungen, Charmeposen,
Abschlussannäherung und das gegenüberliegende Versöhnungspanel folgen derselben
Seite. Ohne Angabe bleibt der bisherige Auftritt von rechts erhalten.
Der vorhandene Ball markiert lediglich den späteren Napfplatz als DEV-Testziel;
der echte Futternapf folgt in #230. Die Vorschau verwendet eine eigene Raum-ID,
zählt nicht für Küchen-/Raumerfolge und bleibt in der öffentlichen Auswahl
deaktiviert. Produktions-URLs ignorieren die DEV-Raumauswahl weiterhin.

[rooms/selection.ts](rooms/selection.ts) verbindet stabile Raum-IDs und Namen mit den tatsächlich verfügbaren Raumdefinitionen. Nur Einträge mit Definition sind spielbar; Küche, Schlafzimmer und Arbeitszimmer bleiben bis zu ihrer Umsetzung deaktiviert. DEV-Varianten stehen unabhängig davon weiterhin im Diagnosebereich bereit. Die Auswahl startet einen eigenständigen Raumdurchlauf über die bestehende Einführung. „Zimmer wechseln“ in Optionen, Einführung und Ergebnis setzt den Durchlauf zurück; gespeicherte Albumfunde und Einstellungen bleiben erhalten.

Die Spielhülle verwendet dieselben Header-/Footer-Bausteine aus `src/ui/game-shell/` für Auswahl, Einführung und Runde. Vite setzt das native HTML bereits beim Ausliefern zusammen; Rechtslinks bleiben ohne zusätzliches Browser-JavaScript vorhanden. Die bestehenden Album-/Optionsbuttons bleiben im Header, statt je Ansicht neu angelegt zu werden.

## Vorlagen und Instanzen

Eine `ObjectDefinition` ist eine diskriminierte Vorlage (`couch`, `curtain`, `plant`, `vase`, `books`, `picture` oder `carpet`). Sie beschreibt einen bekannten symbolischen Asset-Schlüssel, tatsächlich implementierte Fähigkeiten und Geometrie/Regelwerte. Mehrere Varianten desselben Typs können andere Werte haben. Eine Rauminstanz referenziert ihre Vorlage über `variant` und besitzt eine eigene eindeutige `id` sowie Platzierung. Keine Definition enthält Klassen-/Funktionsnamen zur Ausführung oder eine allgemeine Regelsprache.

- `placement.mode: 'surface'`: x-Position auf einer benannten Auflage. Unterstützt Boden, Raumplattformen und Sitzflächen anderer Sofas. Sofa-x bezeichnet die linke Sitzkante, Teppich-x die linke Kante, Pflanzen-/Vasen-x die Mitte. Die Auflagehöhe wird aus der Referenz berechnet; sie wird nicht nochmals in die Instanz eingetragen.
- `placement.mode: 'area'`: linke obere Ecke eines Vorhangs oder Wandbildes. Breite und Höhe stammen aus der Vorlage beziehungsweise dem bekannten Bild-Asset.
- Sofa-Geometrie enthält Breite, Sitzdicke und Sitzhöhe über der Auflage. Rendering, Collider und Nähe verwenden daraus dieselbe Sitzfläche.
- `reading-books` (liegend) und `upright-books` (stehende Buchrücken) teilen Typ, Maße und Regeln. Beide sind zufällig platzierbare Dekoration für passende mittelgroße Slots auf Boden oder Regal. Die Raumdaten enthalten keine festen Bücherinstanzen. `objectSlots` gruppiert Slots über mehrere Auflagen hinweg: jede Gruppe hat eigene IDs und Dichten je Schwierigkeit; jeder Eintrag nennt seine `surfaceId` und einen lokalen x-Mittelpunkt. In den Wohnzimmern wählt eine Gruppe einen Bodenplatz, eine weitere einen Platz links auf dem unteren oder mittleren Regal. Die bestehende Pool-/Geometrie-/Kollisionsprüfung und derselbe Runden-RNG gelten für alle Gruppen. Neustart erhält dieselbe Auswahl. `warningMs`, `fallMs` und `points` steuern Wackeln und einmaligen Schaden. `supportY` und `floorY` trennen Auflage und Raumboden; Auflagenverlust zählt auch bei schon verstreuten Büchern nicht doppelt. Die Buchgrafiken liegen als transparente PNGs samt Imagegen-Quellen und vollständigen Prompts unter `assets/objects/books/`. `node tools/prepare-book-assets.mjs` exportiert liegende/stehende Bücher auf 48×36 und den Streuzustand auf 96×24 Pixel, per Alpha-Bounds und Nearest-Neighbour mit unveränderten RGBA-Samples. `BookArt` animiert diese Bilder; der kurze synthetische Aufprall bleibt in `game/assets/book-impact.ts`.
- Der Spawn referenziert ebenfalls eine Auflage. Pixel muss mit der 52×52-Kollisionsfläche darauf Platz haben.

`RoomDefinition` enthält logische Abmessungen, Boden, Spawn, Plattformen, Instanzen, HUD-Hinweisposition und statische Dekoration. Dekoration besteht aus Rechtecken, Texten und bekannten Bildmodulen (`kind: 'image'`, `asset`, `bounds`). Kleine TypeScript-Helfer im Beispiel erzeugen daraus wiederholte statische Daten; es werden keine Gameplay-Callbacks gespeichert.

## Neue Objekte: gegenseitige Einwirkungen planen

**Entwicklungsregel und Soll-Verhalten:** Jedes Spielobjekt ist als mögliche Quelle
und als Ziel von Einwirkungen anderer Objekte zu berücksichtigen. Das gilt auch
für zwei Instanzen desselben Typs, etwa Vase gegen Vase. Direkter Kontakt mit Pixel
ist dafür keine Voraussetzung. Der allgemeine Ausbau wird in
[#135](https://github.com/Skanky0815/pixels-world/issues/135) verfolgt; dieser Vertrag
wird von den vorhandenen Wohnzimmerobjekten gemeinsam verwendet; weitere Typen
werden über dieselben Adaptermethoden angeschlossen.

Im Issue eines neuen Objekts oder einer neuen Variante festhalten:

- **Ausgehende Wirkung:** Welche Kontakte beim Schieben, Rollen, Fallen oder
  Umkippen können andere Spielobjekte beeinflussen?
- **Eingehende Wirkung:** Wie reagiert es auf andere vorhandene Objekttypen und
  weitere Instanzen seines eigenen Typs? Auch aufliegende Gegenstände berücksichtigen.
- **Passende Reaktion:** Kontaktart/-stärke, Eigenschaften und Zustand bestimmen
  Wackeln, Verschieben, Rollen, Kippen oder Bruch. Standfestigkeit oder eine bewusst
  ausbleibende Wirkung begründen. Nicht jede Berührung bedeutet Schaden.
- **Gemeinsame Regeln:** Keine dauerhafte Liste einzeln erlaubter Objektpaare
  aufbauen. Bestehende Kontakt-, Zustands-, Schadens- und Auflagenmechaniken
  wiederverwenden; neue Typen über gemeinsame Regeln anschließen. Eine vollständige
  Physiksimulation ist dafür keine Voraussetzung.
- **Nachweis:** Eingehende und ausgehende Wirkungen, gleichartige Paare sowie leichte
  und starke Kontakte prüfen. Rückwirkungen und wiederholte Kontakte dürfen keine
  endlosen Ketten oder doppelten Schadensereignisse erzeugen. Pause, Neustart mitten
  in einer Kette und Szenenwechsel räumen alle betroffenen Zustände korrekt auf.

Ein tatsächlicher neuer Schadenszustand verwendet das vorhandene Punkte- und
Album-System; bloßer Kontakt erzeugt keine zusätzliche Wertung. Physische Reaktionen
lösen nicht automatisch besondere Pixel-Aktionen wie Schreck, Panik, Hauptziel oder
Easter Egg aus. Friedliche Zielerreichung und erreichbare Laufwege bleiben erhalten.

Die Objekt-Issues verweisen auf #135 und konkretisieren diesen Vertrag für ihren
Gegenstand. Die Feature-Vorlage fragt die Wechselwirkungen bereits bei der Planung ab.

## Spawn-Profile für Slots

Jede Objektvorlage besitzt ein typisiertes `spawn`-Profil im bestehenden Katalog:
`size` (`small`, `medium`, `large`), `category` und `random`. Zufallskandidaten
nennen ihre zulässige Auflage (`support: 'floor' | 'any-surface'`). Feste
Raumausstattung verwendet `random: false` mit `reason: 'room-fixture'`.
`goal.spawn` schützt das separate Hauptziel ausdrücklich mit `reason: 'main-goal'`;
es wird nicht in den gewöhnlichen Objektkatalog verschoben. Figuren bleiben ausgeschlossen; optionale Wandregale verwenden die unten beschriebenen Wandvorlagen.

Die Größenklassen aus [spawn-profile.ts](../game/content/spawn-profile.ts) sind
konservative Auswahlklassen: bis 32×32 Spielpixel `small`, bis 96×96 `medium`,
darüber `large`. Die Prüfung nutzt vorhandene Asset-/Objektmaße; bei Sofas die vollständige Grafikbreite und -höhe einschließlich Rücken und Armlehnen. Diese Klassen verändern keine Grafik oder Kollisionsfläche und
ersetzen keine exakte Geometrie-/Überlappungsprüfung. Kategorie und vorhandene
`capabilities` bleiben unabhängig: benötigte Fähigkeiten eines Filters müssen
alle vorliegen, Kategorien sind erlaubte Alternativen.

`filterSpawnCandidates` liefert passende Katalogschlüssel in stabiler Reihenfolge;
`fitsSpawnSlot` prüft Größenkapazität, Kategorie, Auflage und optional
`requiredCapabilities`. Ein leerer Kategoriefilter erlaubt keine Kandidaten.
Profile, Größen und Filter werden vor Verwendung validiert. Die bestehende
Raumvalidierung erkennt fehlende Metadaten, unpassende Kategorien/Größen und
verbotene Zufallsplatzierung des Vorhangs oder Hauptziels.

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

## Saras Dialogvarianten

`sara-reactions.ts` hält `SARA_DIALOGUE` für allgemeine Sätze je Ärgerstufe und
`SARA_ROOM_DIALOGUE` für Ergänzungen pro `RoomDefinition.id`. Zur Auswahl stehen
die allgemeinen und die raumspezifischen Zeilen gemeinsam. Eine unbekannte Raum-ID
nutzt nur den allgemeinen Pool; fehlende Stufen und leere Pools haben einen sicheren
Fallback. Raumtexte passen zur fest definierten Einrichtung und setzen keine
konkrete Schadensaktion voraus.

`SARA_DAMAGE_RULES` verbindet tatsächliche Objekt-/Ereignispaare mit einem
Dialogthema und dessen Priorität. `SARA_DAMAGE_DIALOGUE` enthält die zugehörigen
Zeilen je Gesamtärgerstufe. Ein erkannter Vorfall verwendet diesen Pool bevorzugt;
ohne passenden Pool bleiben die allgemeinen/raumbezogenen Varianten erhalten.
Einsturz steht vor Vasenbruch, gekippter Pflanze, Vorhangriss und Sofakratzen.
Weitere Themen benötigen einen passenden Eintrag in Regeln und Textkatalog,
keine Abhängigkeit der Objektadapter von der Dialoglogik. Auch bei hohem Gesamtscore
darf ein Satz nur den tatsächlich gemeldeten Schaden behaupten.

Neue Sätze in `src/i18n/de.ts` und `src/i18n/en.ts` unter demselben Schlüssel
ergänzen, dann im passenden Pool über `copy('schluessel')` referenzieren. Die
kanonische deutsche Fassung bleibt unabhängig von der Anzeigesprache. Keine
Szenenänderung ist für zusätzliche Sätze nötig. Doppelte und leere Zeilen werden
bei der Auswahl bereinigt; bei mehreren Varianten wird die letzte Zeile derselben
Raum-/Ärgerstufe während der laufenden Spielsitzung vermieden.

Im Dev-Spiel `/play.html?room=cozy-remix` für die Leseecke wählen. Mit **F2** lassen
sich Chaoswerte und Heimkehrphasen reproduzierbar prüfen. Ein explizites
DEV-Szenario setzt dafür die Dialogerinnerung zurück; normale Rundenneustarts
behalten sie. Die Raumvorschau bleibt auf DEV/E2E beschränkt.

Ein synthetischer F2-Chaoswert erzeugt keinen konkreten Schaden. Für die
Schadensdialoge erst regulär ein Objekt beschädigen und anschließend über
**Rundentimer +10 Sekunden** die echte Heimkehr auslösen.

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

Beide Wohnzimmer verwenden auf dem unteren Regal drei lokale Plätze: Leicht belegt einen, Normal zwei und Schwer drei. Die vorhandenen vier
Vasenvarianten liefern die Auswahl. Das mittlere Regal nutzt einen weiteren lokalen
Slot mit demselben Pool: auf Leicht leer, auf Normal/Schwer belegt. Die Vase folgt
beim Aufbau der Regalposition. Die Bücherdekoration entfällt zugunsten späterer
eigenständiger Buchobjekte. Die anderen Möbel, festen Vasen und das Ziel
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

### Modulare Wohnzimmergrafik

`environment: 'cozy-room'` zeichnet wiederholbare Module für Putzwand, Holzverkleidung,
Dielen und Deckenleiste. Fenster, Bild, Teppich und geschlossene Tür sind getrennte
Bilddekorationen mit eigenen `bounds`. Räume ohne Umgebungsthema behalten den
bisherigen geometrischen Renderer. Spiel und DEV-Playground laden dasselbe Set.
Eine vorhandene Türdekoration unterdrückt die alte Rechtecktür in Saras Heimkehr;
Figurenmaßstab und Heimkehrbewegung bleiben erhalten.

Die abgestimmten Hauptregale stehen bei x=502/584/840; der Vorhang beginnt bei x=728.
Das Fenster bei x=682/y=126 (112×184) bleibt links sichtbar. Die Tür nutzt 112×216
Spielpixel bei x=848/y=252 und endet am Boden y=468. Die mittlere Vase entsteht aus
einem Slot bei lokal x=62; Ball und obere feste Vase behalten ihre getrennten Anker.
Bücher werden weder in den Hintergrund noch als statische Dekoration eingebrannt.

Quellen, vollständige Imagegen-Prompts und Rasterparameter stehen unter
`assets/environment/living-room/`. `node tools/prepare-room-assets.mjs` exportiert
Wand-/Bodenmodule und das Bild aus dem abgestimmten Quellenraster; Fenster, Tür und
Teppich werden anhand ihrer Alpha-Bounds ab 192 eingepasst. Nearest Neighbor bewahrt
abgetastete RGBA-Werte. Alle Laufzeitbilder verwenden den 2×-Maßstab; nur die kleinen
Export-PNGs werden gebündelt. Die Bodenmodule respektieren das konfigurierte Dielenraster.

Die vier Zusatzregale auf Schwer deklarieren ihre `slots` direkt in
`difficulty.json` unter `livingRoom.hardPlatforms`. Jedes erhält genau eine Vase
und wählt zwischen drei lokalen Positionen und dem bekannten Vasenpool. Die
bisherigen festen `difficulty-vase-*`-Instanzen entfallen; neue IDs haben die Form
`difficulty-shelf-N:extra-slot-M`. Die Anflugseite bleibt frei und die gemeinsame
Phaser-RNG-Folge bestimmt auch diese Wahl. Feste Regale, Stabilität und Ballroute
werden dadurch nicht verschoben. `hardAdd` ist für bewusst feste Zusatzobjekte
weiterhin Teil des Raumvertrags, enthält hier aber keine Vasen mehr.

## Boden- und Wandplätze

`objectSlots` verwenden für Bodenplätze `surfaceId: 'floor'`. Ein Slot nennt
seinen lokalen Mittelpunkt, Kapazität, Kategorien und einen expliziten Pool.
Neben kleinen Gegenständen sind auch Sofavorlagen mit `random: true` und
`support: 'floor'` möglich. Die exakte Prüfung berücksichtigt deren vollständige
Grafik (Sitzbreite + 18, Sitzhöhe + 60), übersetzt den Mittelpunkt in die linke
Sitzkante und schützt feste Objekte, Spawn, Ball und Auflagen. Zusätzliche
kollidierende Bodenobjekte respektieren Tür/Fenster und `navigationClearances`.
Nicht kollidierende Bücher dürfen weiterhin vor einer Tür liegen. Die Sofas und
der Vorhang der beiden Wohnzimmer bleiben feste Anker des Zielwegs.
Katzengras nutzt ebenfalls `objectSlots`: pro Schwierigkeit wird ein freier
Bodenplatz aus dem Catgrass-Pool gewählt. Das Standardzimmer besitzt zusätzlich
einen Platz rechts neben dem Sofa; Cozy Remix verwendet wegen des zweiten Sofas
nur die beiden linken Plätze. Spawn und andere Slotobjekte bleiben geschützt.
Knabbern, Kippen, Erde und Punkte verwenden unverändert dieselbe Pflanzenklasse.

`wallSlots` enthält eigene stabile Slot-IDs, rechteckige Bereiche, Kapazitäten,
Kategorien (`picture`, `shelf`), Vorlagenpools und Dichten je Schwierigkeit.
[wall-slots.ts](rooms/wall-slots.ts) zeigt die gemeinsame Konfiguration beider
Wohnzimmer. Vorlagen referenzieren bekannte PNG-Assets und feste Maße; Regale
nennen zusätzlich ihre Stabilität. Die Auswahl sitzt horizontal mittig und unten
im Slot. Sie darf keine belegten Flächen, Bilder, Fenster, Türen, Spawn oder das
Ziel überdecken; zusätzliche Regale halten außerdem die Sprungkorridore frei.
Unpassende Kandidaten werden übersprungen, nicht verkleinert oder erzwungen.
Alle Vorlagen und Slotreferenzen werden vor der Auswahl geprüft, auch bei Dichte null.

Die Wandbelegung läuft nach den Gegenstandsslots mit derselben Phaser-RNG-Folge.
Damit bleiben bestehende Gegenstands-Seeds stabil. Neustart mit gleicher
Schwierigkeit behält die Auswahl; eine neue Runde nach Neuladen würfelt neu,
außer im DEV-/E2E-Test mit explizitem `room-seed`. Gewählte Regale werden echte
Plattformen mit normaler Stabilitätslogik. Bildvorlagen mit `objectVariant`
erzeugen echte `picture`-Instanzen aus dem Objektkatalog; alte Bildvorlagen ohne
diese Referenz bleiben statische Dekoration. `wallPlacements`
enthält die ausgewählten IDs, Varianten und Bounds; der E2E-Beobachter gibt sie
als unveränderlichen Snapshot aus. Feste Zielregale bleiben unabhängig davon erhalten.

## Interaktive Wandbilder

`pixel-portrait`, `berlin-tower` und `cozy-nook` wählen drei echte transparente
PNGs mit gemeinsamem Holzrahmen. `objectVariant` einer Wandvorlage referenziert
einen dieser geprüften Katalogschlüssel; Maße müssen zum Asset passen. Die
Wand-Slots würfeln das Motiv mit demselben Runden-RNG. Bilder sind als Bodenpool
unzulässig. Ihre Plätze über dem Sofa und links davon liegen in Sprungreichweite.

Ein separater Sprungkontakt hängt den Rahmen schief, ein zweiter löst den Fall
aus. Aufwärtsbewegung armiert einen Flug; Boden- oder Kletterkontakt beendet ihn.
Kontaktflattern innerhalb eines Flugs zählt nicht erneut, bloßes Vorbeilaufen oder
Herabfallen ohne Sprung nicht als Treffer. Das Wackeln endet nach `wobbleMs`,
der schiefe Winkel bleibt. Erst der Aufprall nach `fallMs` erzeugt einmalig
`picture-fall` mit `points`. Die vorhandene kurze synthetische Aufprallwiedergabe
nutzt denselben Lautstärke-/Pausekanal wie die Bücher. Gefallene Bilder bleiben
sichtbar und haben keine Collider. Reduzierte Bewegung unterdrückt das Wackeln;
Zeit-, Treffer- und Punktevertrag bleiben gleich. Neustart setzt das Bild zurück.

`assets/objects/pictures/generation-v1.json` enthält Imagegen-Prompts und Quellen.
`node tools/prepare-picture-assets.mjs` exportiert 54×56-PNGs proportional mit
Alpha-Bounds und Nearest-Neighbour unter Erhalt der ursprünglichen RGBA-Samples.
Die drei hochauflösenden Quellen gehören nicht zum Laufzeitbundle.

[album/pictures.ts](album/pictures.ts) bereitet stabile Album-IDs, Asset,
DE-/EN-Fluff, Saras Kommentar und die Erfolgsbedingung vor. Erst ein vom
Chaossystem akzeptiertes Aufprallereignis sendet `album-discovered` mit
`entryId`, `objectId` und `eventId`; Spawn und Reset entdecken nichts.
Der nur lesbare E2E-Snapshot zeigt das letzte Ereignis als `albumDiscovery`.
`album-discovered` beschreibt zunächst nur einen vorläufigen Fund. Die Szene
bestätigt die nach stabiler Album-ID deduplizierten Funde erst nach erfolgreicher
Versöhnung bei Erreichen der Rundenauswertung. Gescheitertes Minispiel, vorherige
Neustarts oder Reloads speichern sie nicht.
Die einzelnen Objektmechaniken speichern keinen eigenen Fortschritt.

## Teppich und Haarballen

`living-room-rug` ist ein festes `carpet`-Objekt in beiden Wohnzimmern. Seine
`geometry` beschreibt die sichtbare Teppichfläche; `placement.mode: 'surface'`
referenziert ausschließlich den Raumboden. Die Grafik wird zwei Pixel über dessen
Oberkante verankert und ersetzt die frühere Vordergrunddekoration. Teppiche sind
keine festen Hindernisse: andere Bodenobjekte dürfen darauf stehen, weshalb ihre
Grafik nicht als belegte Spawn-Fläche reserviert wird. Die Punkteberechnung und
Objektlebensdauer laufen durch dieselbe Objektfabrik wie bei Sofa und Pflanze.

Nur Stillstehen innerhalb der Teppichbreite mit den Füßen auf dem Raumboden
startet die Aktion. `delayMs` und `retchMs` steuern Warte- und Würgezeit. Bewegung,
Springen oder Klettern brechen vor Abschluss vollständig ohne Schaden ab.
Die eigene `retch`-Animation nutzt die vorhandene geduckte Pixel-Pose mit
unregelmäßiger Bildfolge und leichtem, am Fuß verankertem Pulsieren; der
52×52-Physikkörper bleibt unverändert. Reduzierte Bewegung schaltet den Puls ab.

Am Boden hat der Teppich Vorrang vor überlappenden Sofaaktionen, auch nachdem er
bereits benutzt wurde. Auf den erhöhten Sitzflächen und außerhalb der Matte
bleibt das Kratzen erreichbar. Ein erfolgreicher Abschluss zeigt genau einen
harmlosen PNG-Haarballen innerhalb des Teppichs und erzeugt einmalig `hairball`.
Wiederbetreten verändert weder Position noch Punkte; Neustart entfernt die Spur.
Pause und Heimkehr verwenden die bestehenden Simulationsgrenzen.

`assets/objects/carpet/generation-v1.json` hält Quelle und Imagegen-Prompt fest.
`node tools/prepare-hairball-asset.mjs` exportiert das transparente 32×16-PNG
proportional per Nearest-Neighbour mit unveränderten RGBA-Samples. Der vorhandene
Teppich-PNG wird wiederverwendet, die große Haarballenquelle nicht gebündelt.

`album/discovery.ts` definiert den gemeinsamen Daten-/Ereignisvertrag für Bilder
und Teppich. `album/carpet.ts` enthält Asset, stabile ID, DE-/EN-Fluff und Saras
Kommentar. Nur akzeptierter tatsächlicher Schaden sendet `album-discovered`;
Spawn, Abbruch und Runden-Reset erzeugen keinen Fund. Die gemeinsame Sammlung
übernimmt Persistenz und Deduplication erst bei erreichter Rundenauswertung nach
erfolgreicher Versöhnung.

## Album der Schandtaten

`objects/catalog.ts` hält die Album-Metadaten direkt als `album` an der jeweiligen
Objektvariante. `album/index.ts` leitet daraus den gemeinsamen Katalog ab. Jeder Eintrag enthält
stabile ID, Asset-Schlüssel, DE-/EN-Name, Flufftext, Saras Kommentar, Erfolgsbedingung
und Raumzuordnungen. Vasen, Sofas, Vorhang, Katzengras, Bücher, Bilder und Teppich
werden an derselben Quelle gepflegt. Einträge entstehen nur nach vom Chaossystem akzeptiertem Schaden; es gibt
keine zusätzliche Punktevergabe. Neue Varianten benötigen einen eindeutigen Eintrag
und eine PNG-Zuordnung in `album-art.ts`.

Neue Objekte und Varianten pflegen zugleich die versionierten Kategorieziele in
`achievement-categories.ts`, passende Schadensendzustände und die gemeinsame
Album-/Erfolgsbannerfolge. Neue veröffentlichte Räume pflegen die Ziele in
`achievement-rooms.ts` für Leicht/Normal/Schwer und ihren friedlichen Schwer-Erfolg.
Dabei den Gesamterfolg „Pixels Meisterwerk“ berücksichtigen: Er setzt alle anderen
Ziele seiner Version voraus. Bereits freigespielte Ziele bleiben erhalten; DEV-Inhalte
und Platzhalter erweitern keine veröffentlichten Erfolgsziele.

Die beiden Wohnzimmer-Varianten teilen das Kapitel `living-room`. Weitere Räume
können dieselbe ID verwenden, ohne den Gesamtzähler zu erhöhen. Noch nicht mit
Einträgen belegte Raum-Tabs zeigen einen Leerzustand und zählen keine Platzhalter.
Unentdeckte Plätze zeigen ausschließlich `?` und neutrale zugängliche Beschriftungen;
Name, Bild und Texte werden erst nach erfolgreicher Versöhnung am Rundenende in den Dialog eingefügt.
`previewOnly` kennzeichnet Varianten, die ausschließlich in DEV-/E2E-Räumen
erreichbar sind. Sie fehlen im veröffentlichten Album und dessen Zählern, bleiben
aber mit ihren stabilen IDs in Entwicklungsvorschauen sammelbar.

Das Album verwendet echte PNG-Papiertextur unter `assets/ui/album/paper.png`.
Original, vollständiger Imagegen-Prompt und Herkunft sind in
[`generation-v1.json`](../../assets/ui/album/generation-v1.json) dokumentiert.
`node tools/prepare-album-paper.mjs` exportiert die Originalquelle reproduzierbar
per Nearest-Neighbour auf 256×256; nur die kleine Textur wird im Spiel gebündelt.
Raum-Icons bleiben schlanke SVG-Bediensymbole, die ausgefransten Stoff-Lesezeichen
und der Bucheinband verwenden CSS. Raumfarben für noch nicht gestaltete Zimmer
sind vorläufig; die Beschriftungen bleiben als Tooltip und für Screenreader erhalten.

Die Objektübersicht zeigt neun Plätze pro Seite im 3×3-Raster mit Vor-/Zurück-Navigation.
Das Album bleibt in der Bildschirmhöhe begrenzt und nutzt auf breiten Displays
beide Buchhälften für ein Kapitel. Auf schmalen oder niedrigen Displays wechselt
es zwischen Übersicht und ausgewähltem Eintrag; „Zur Übersicht“ führt zurück.
Beim Raumwechsel wandern ausschließlich die Lesezeichen bereits besuchter
Kapitel auf die rechte Buchhälfte. Inaktive Enden liegen hinter den Seiten.

Ein Buchsymbol neben dem Menü im Spielkopf öffnet das Album direkt und pausiert
die laufende Runde. Leere Raumkapitel zeigen auf breiten Displays ebenfalls
einen mittleren Buchfalz mit Raumname links und Leerhinweis rechts.

Album und Optionen nutzen in Einführung, Spielkopf und Pause-Menü dieselben
Icon-Buttons aus `game-action.ts`/`game-action.css`, einschließlich zugänglicher
DE-/EN-Namen. Die Popup-Flächen teilen `--popup-background` ohne Stoffraster;
Papiertextur und darunterliegender Bucheinband gehören nur zu den Buchseiten.

Normale UI-Buttons teilen `src/ui/button.ts` und `button.css`: 44 Pixel Höhe,
eine quadratische Icon-Variante und gemeinsame Fokus-/Disabled-Zustände.
`game-action.ts` ordnet Buch und Zahnrad samt lokalisierter Beschriftung zu.
Die Sammlungskacheln und stoffförmigen Raum-Lesezeichen behalten ihre Buchform.

Öffentliche Popups (Optionen, Album, Installationshilfe) teilen dieselbe
`popup-heading` mit einem 44×44-X oben rechts. Der zugängliche Name und Tooltip
bleiben lokalisiert; das Schließen der Optionen setzt eine laufende Runde fort.
