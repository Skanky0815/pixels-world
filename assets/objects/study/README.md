# Arbeitszimmer-Gegenstände und Poster

Mit dem integrierten Bildwerkzeug erzeugte Rastergrafiken zur lokalen Abnahme von #59. [Vollständige Prompts und Referenzrollen](generation-prompts.md); unveränderte Originale unter `sources/`. Die verstreuten Zustände wurden jeweils aus der intakten Quelle erzeugt. Die Motive gehören zum abgestimmten nerdigen Arbeitszimmer; Lampe und Bücher verwenden weiterhin ihre bestehenden Quellen.

Export: `node tools/assets/prepare-study-assets.mjs`. Alpha-Inhaltsrechteck, Nearest-Neighbour, binäres Alpha ab 192 und identische 2×2-Cluster. Papierstapel 48×36, verstreute Papiere 96×24, Stiftebecher 28×42, gekippter Becher mit Stiften 88×26, Poster jeweils 108×112.

Poster zeigen eine Weltraumkatze und ein Retro-Spielmotiv auf Papier mit Klebestreifen, ohne Holzrahmen. Sie nutzen den bestehenden Bildkontakt, Wackeln, Fall, einmalige Wertung und Reset. Eigene Albumkennungen und ein neuer Poster-Erfolg ergänzen die Sammlung; veröffentlichte Erfolgsfassungen bleiben erhalten. Weitere Poster werden im Katalog mit Raumbezug `study` eingetragen und stehen dann automatisch für beide vorhandenen Wand-Slots zur Verfügung.

Papier verwendet das bestehende Bücher-Umkippmodell, der Stiftebecher das bestehende Behältermodell. Beide nehmen Körperkontakte entgegen und können andere Gegenstände anstoßen. Die gemeinsame Kontaktbegrenzung, einmalige Schadenshistorie, Pause und Reset bleiben zuständig. [Möbel und feste Bildanker](../../environment/study/README.md).
