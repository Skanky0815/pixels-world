# Website-Bilder und Metadaten

## Spielaufnahmen erneuern

Die lokalen PNG-Aufnahmen in
`assets/landing/` stammen aus dem bestehenden Spiel und benötigen keine externen Dienste.
`album.png` zeigt den Album-Dialog des Produktionsbuilds nach echtem Kratzen am
Sofa: eine bestätigte Entdeckung, übrige Plätze geheim. Für eine neue Aufnahme ein frisches
Browserprofil verwenden, die Runde starten und neben das Sofa laufen. Nach der
ersten Schandtat die Runde einschließlich Heimkehr und erfolgreicher Versöhnung
bis zur Auswertung abschließen; erst dann das Buchsymbol im Spielkopf öffnen. Die Aufnahme zeigt ohne Speicherwahl nur eine Sammlung für diesen Besuch. Bei 1280×800 nur den
Album-Dialog aufnehmen; der Screenshot wird unverändert eingebunden.

`living-room.png` zeigt den gestarteten Produktionsbuild bei 1280×800 mit folgender Kamera; den Spielbereich `#game` aufnehmen.

`kitchen.png` ist das echte Küchenbild für die Levelauswahl. Im frischen Produktionsbuild bei 1280×800 über das Menü die Küche wählen (`?camera=room`, Normal), die Runde starten und mit einem Sprung nach rechts auf den Hocker gelangen. Nach dem Landen und Ausblenden des Startbanners nur `#game` aufnehmen; Tisch, Kühlschrank und Napf bleiben sichtbar. Die Produktionsbelegung bleibt zufällig; im Bild verwendete Varianten dürfen daher wechseln. Das Bild wird unverändert eingebunden, die Bildbeschreibung ist auf Deutsch und Englisch verfügbar.

`bedroom.png` zeigt das gestartete Schlafzimmer des Produktionsbuilds bei 1280×800 mit Raumkamera (`?camera=room`, Normal). Über das Menü Schlafzimmer wählen, die Runde starten, das Startbanner ausblenden lassen und nur `#game` aufnehmen. Pixel bleibt am Einstieg vor der weißen Tür; Bett, Katzenbett, Nachttischlampe, Regale und Kleiderschrank bleiben sichtbar. Das Bild wird unverändert in der Zimmerauswahl verwendet, mit deutscher und englischer Bildbeschreibung. Die Slot-Belegung bleibt zufällig.

`study.png` zeigt das gestartete Arbeitszimmer des Produktionsbuilds bei 1280×800 mit Raumkamera (`?camera=room`, Normal). Über das Menü Arbeitszimmer wählen, die Runde starten und das Startbanner ausblenden lassen; nur `#game` aufnehmen. Pixel bleibt rechts vor der weißen Tür. Gamingstuhl, abgesenkter Schreibtisch, Regal und Fensterbankziel sind sichtbar. Zufällige Bücher- und Posterbelegung wird unverändert aufgenommen. Die Zimmerauswahl verwendet das Bild mit DE/EN-Bildbeschreibung.

`pixel-and-sara.png` zeigt den Produktionsbuild nach Sofa-Kratzen und Saras
Heimkehr, mit ihrem gespiegelten Dialogporträt und Pixel neben ihr. Für eine neue
Aufnahme bei 1280×800 die Runde starten, kurz nach rechts zum Sofa laufen und
auf eine Kratzaktion warten. Danach bis zur Heimkehr und Pixels Ankunft warten,
den Dialog noch nicht bestätigen und den Spielbereich `#game` samt aktuellem HTML-Dialog aufnehmen. Browser-Uhr und
ein Start-Seed dürfen die Aufnahme reproduzierbar machen; Spielzustand oder
Bildinhalt werden nicht nachträglich verändert.

## Linkvorschau und Suchmaschinen

`node tools/assets/prepare-social-card.mjs` rendert die Linkkarte aus dem vorhandenen
`assets/banner.png` und einer lokalen HTML-/CSS-Beschriftung mit Chromium.
Voraussetzung ist die normale Playwright-Installation. Ausgabe:
`public/social/pixels-world.png` (1200 × 630). Das vollständige Banner bleibt sichtbar;
es werden weder externe Bilder noch Webfonts geladen. Die Karte wird nicht für
Offline-Spiele vorab geladen.

Open Graph, Social Card, Canonical und `VideoGame`-Daten stehen direkt im initialen
Landingpage-HTML. Die feste öffentliche Adresse ist
`https://skanky0815.github.io/pixels-world/`; bei einem Domainwechsel auch HTML und
`public/sitemap.xml` anpassen. DE/EN wird weiterhin im Browser umgeschaltet;
es gibt keine getrennten Sprach-URLs und deshalb keine erfundenen `hreflang`-Ziele.

Die Sitemap enthält Landingpage und Spiel unter dem tatsächlichen Pages-Unterpfad.
Eine `robots.txt` unter `/pixels-world/` gilt nicht als Host-Datei; dafür wäre
`https://skanky0815.github.io/robots.txt` nötig. Dieses Repository kann dort keine
Datei ausliefern. Ohne Host-Sperre können die verlinkten Seiten gecrawlt werden;
Sitemap bei vorhandenem autorisiertem Search-Console-Zugriff separat einreichen.
Es werden weder Konten eingerichtet noch Indexierung, Rankings oder eine sofortige
Aktualisierung fremder Vorschau-Caches zugesichert.

Quellen: [Open Graph](https://ogp.me/),
[Canonical-URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls),
[Sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap),
[robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro)
und [Schema.org VideoGame](https://schema.org/VideoGame).
