# ADR 0002: Lesbare mobile Texte und Canvas-Renderer

- Datum: 2026-11-06
- Status: Implementiert

## Anlass

Das vollständige Zimmer muss auf kleine Displays passen. Canvas-Schrift mit
12–16 logischen Pixeln würde dabei auf wenige CSS-Pixel schrumpfen. In der
Chromium-Touch-Prüfung zeigte der WebGL-Pfad mit darüberliegender scrollbarer
DOM-Textbox zudem unvollständig aktualisierte Raumteile und fehlende Figuren
im Ergebnis-Screenshot. Ein eigener Compositing-Layer per CSS behob das nicht;
der Canvas-2D-Pfad zeigte denselben Ablauf vollständig.

## Entscheidung

Die Spielregeln, Physik und Szene bleiben gemeinsam. `MobileReadout` übernimmt
Darstellungsdaten vorhandener Ansichten und zeigt HUD, Dialoge, Eingabezeit und
Ergebnis unabhängig von der Raumskalierung in CSS-Pixeln. Lange Texte scrollen
innerhalb ihrer Box. Canvas-Zielmarker und Figuren bleiben Teil des Zimmers.

Die DOM-Texte gelten für grobe Zeiger (`any-pointer: coarse`) sowie Fenster bis
1024 CSS-Pixel Breite, unabhängig von der Eingabemethode. Größere Mausfenster
zeigen weiterhin die Canvas-Texte; beide Ansichten wechseln gemeinsam.

Seit #259 verwendet das Spiel durchgehend Canvas 2D. Der zuvor nur auf Touch
vermiedene WebGL-Befund trat auch im schmalen Mausfenster mit DOM-Dialog auf.
Auch ein breit gestartetes Fenster kann während derselben Runde schmal werden;
eine Auswahl nur beim Start würde diesen Übergang nicht absichern. Deshalb
bleibt der Renderer über Größenwechsel hinweg gleich, ohne Szenenneustart.

## Alternativen und Grenzen

Alle Canvas-Texte vergrößern erfordert mehrere Layouts in logischen Raummaßen
und kann bei sehr kleinen Viewports das Zimmer verdecken. Rein proportionale
Skalierung löst die Lesbarkeit nicht. Ein CSS-Compositing-Layer allein löste
den beobachteten WebGL-Befund nicht. `preserveDrawingBuffer` wird nicht für
Screenshotzwecke im Produktionsspiel aktiviert.

Die vollständige Suite deckt Desktop und Touch ab. Der Befund ist in Chromium
beobachtet, keine Behauptung eines nachgewiesenen Safari-Fehlers. Reale Safari-
und Android-Darstellung, Browserleisten, Safe Areas und Leistung müssen weiter
auf Hardware geprüft werden. Canvas 2D vermeidet diesen beobachteten
Darstellungsfehler, bietet aber keine WebGL-Beschleunigung; für spätere komplexere
Räume ist diese Wahl anhand realer Leistung erneut zu bewerten.
