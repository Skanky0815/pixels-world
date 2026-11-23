---
name: pixels-world-art
description: Spielgrafiken für Pixel’s World erzeugen oder überarbeiten, passend zu vorhandenen Figuren, Räumen und Objektzuständen. Für Rastergrafiken und deren reproduzierbaren Export; Auswahlbilder aus echten Spielabläufen aufnehmen.
---

# Grafiken für Pixel’s World

Erhalte den warmen, wohnlichen Pixel-Art-Stil und die Lesbarkeit in tatsächlicher
Spielgröße. Lies die Repository-Arbeitsregeln und die Quellenanleitung der
betroffenen Asset-Familie; dort liegen die verbindlichen Maße und Exportregeln.
Dieser Skill ergänzt das verfügbare Bildwerkzeug, ohne einen API-Schlüssel oder
weitere Installation vorauszusetzen.

## Referenz und Spielvertrag

- Bestehende Bilder vor der Bearbeitung ansehen. Den aktuellen Pixel-Master unter
  `assets/pixel/` sowie passende Möbel, Figuren oder Raumgrafiken als konkrete
  Stil- und Maßstabsreferenz verwenden. Die jeweiligen README-Dateien erklären
  Figur, Palette, Raster und Anker; Werte nicht aus ähnlichen Familien übernehmen.
- Spielmaß, Seitenansicht, Auflagefläche, Bildanker und benötigte Zustände vor der
  Erzeugung aus Content und Loader ermitteln. Offene Türen oder verstreute Inhalte
  können größere Exportzellen brauchen, während der Körper unverändert bleibt.
  Keine Sprungroute oder Kollisionsmaße beiläufig an ein neues Bild anpassen.
- Für Kücheninhalte sind dunkles Walnussholz, warme Bordeauxfronten, Messing,
  cremefarbene Keramik und warmer Putz die Referenz. Diese Palette gilt für die
  Küche; andere Räume behalten ihre eigene Identität.
- Bei räumlichen Layoutänderungen Rico zuerst eine kleine Skizze zeigen.

## Erzeugung und Quellen

Für neue Rastergrafiken und Bildbearbeitungen das integrierte Bildwerkzeug nutzen.
Falls der allgemeine `imagegen`-Skill verfügbar ist, seine Werkzeuganleitung lesen.
Ein fehlendes Werkzeug offen benennen; nicht stillschweigend auf einen kostenpflichtigen
API-/CLI-Weg wechseln. Bestehende native Vektor- oder Codegrafiken bei passenden
kleinen Änderungen direkt bearbeiten.

Im Prompt Zielobjekt, exakte Referenzrollen, Front-/Seitenansicht, Maßstab, Palette,
Zustand und unveränderliche Merkmale nennen. Zusammengehörige Zustände behalten
Perspektive, Licht, Körperproportionen und festen Bildanker. Bei einer Korrektur
klar benennen, was sich ändern soll und was erhalten bleibt. Transparente Sprites
mit echter Transparenz erzeugen; keinen aufgemalten Schachbretthintergrund verwenden.
Kleine Beschriftungen und Details müssen auch im endgültigen Spielmaß lesbar sein.

Ausgewählte Originale unverändert unter `assets/<Familie>/sources/` ablegen,
Überarbeitungen versionieren. Vollständige Prompts und verwendete Referenzen in der
vorhandenen `generation-prompts.md` dokumentieren; Herkunft, Ausgabegrößen und
Exportbefehl in der zugehörigen README pflegen. Keine privaten absoluten Pfade als
notwendige Eingaben hinterlassen. Projektgrafiken dürfen nicht ausschließlich im
privaten Ausgabeordner eines Bildwerkzeugs liegen.

## Export und Sichtprüfung

Bestehende `tools/assets/prepare-*-assets.mjs` bevorzugen und den jeweiligen Exportvertrag
beachten: Alpha-Grenzen, Nearest-Neighbour, binäres Alpha und gegebenenfalls
2×2-Cluster sind pro Familie dokumentiert. Keine generelle Glättung oder neue
Rasterregel über alle Quellen legen. Dünne Außenkonturen und Henkel nach dem
Export prüfen; eine gute große Quelle garantiert keine lesbare kleine Grafik.
Pixel-Emoji-Bilder nutzen die verfügbare Fläche mit zwei Pixeln Abstand an jeder
Seite; diese Regel nicht auf Möbel oder Animationszellen übertragen.

Quelle und Export ansehen, danach das echte Spiel in normaler Größe und auf
Handy prüfen. Maßstab zu Pixel und Nachbarobjekten, Zustandswechsel, Transparenz,
Spiegelung von Pfote/Motiven/Beschriftung und feste Kontaktanker kontrollieren.
Bei einer gezielten Änderung eine kleine Gegenüberstellung zeigen. Mechanik und
Animation aus tatsächlich erreichten Spielzuständen prüfen.

Raum-Auswahl- und Landingbilder aus dem Produktionsspiel aufnehmen, ohne Figuren,
UI oder Objektzustände nachträglich hineinzumalen. Aufnahmewege stehen unter
`assets/landing/README.md` im Abschnitt „Spielaufnahmen erneuern“. Wenn eine Grafik im Code
integriert wird, gelten die normalen Repository-Prüfungen vor dem PR.
