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

Content verwendet nur Schlüssel aus [dem Asset-Katalog](../game/assets/definitions.ts). Prozedurale Platzhalter sind ihrem tatsächlichen Objekttyp zugeordnet. Das Pixel-Sheet wird über einen Vite-Asset-Import aufgelöst, ohne fest codierten Host oder Repository-Präfix. Ein Produktionsbuild mit `--base=/pixels-world/` wurde dafür im Browser geprüft; der öffentliche Spielstand ist über [GitHub Pages](https://skanky0815.github.io/pixels-world/) erreichbar.

Die Versionsangabe im normalen Seitenfooter stammt beim Build aus der zentralen `package.json`. Das Jahr wird zur Laufzeit ermittelt. Die Anzeige ist eine Build-Version, kein zusätzlicher Veröffentlichungsmechanismus; Release Please pflegt dieselbe Versionsquelle.
