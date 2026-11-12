# Pixel-Slack-Emojis

![Approval-Pixel](pixel_approved.png) ![Chaos-Pixel](pixel_chaos.png) ![Unschulds-Pixel](pixel_war_nicht_ich.png) ![Herz-Pixel](pixel_love.png) ![Pixel bei der Arbeit](pixel_in_progress.png) ![Fragender Pixel](pixel_question.png) ![Pixel hat eine Idee](pixel_idee.png) ![Urlaubs-Pixel](pixel_urlaub.png)

Acht statische Reaktionen im Stil von Pixels freigegebenem Porträt und Idle-Master:

| Datei | Slack-Name | Motiv |
| --- | --- | --- |
| `pixel_approved.png` | `:pixel_approved:` | Approval-Pfote mit grünem Haken |
| `pixel_chaos.png` | `:pixel_chaos:` | Zufriedener Pixel mit kaputter Vase |
| `pixel_war_nicht_ich.png` | `:pixel_war_nicht_ich:` | Unschuldsblick mit Heiligenschein |
| `pixel_love.png` | `:pixel_love:` | Pixel hält ein großes rotes Herz |
| `pixel_in_progress.png` | `:pixel_in_progress:` | Konzentrierter Pixel mit Zahnrädern |
| `pixel_urlaub.png` | `:pixel_urlaub:` | Entspannter Pixel mit Sonnenbrille |
| `pixel_idee.png` | `:pixel_idee:` | Begeisterter Pixel mit Glühbirne |
| `pixel_question.png` | `:pixel_question:` | Schiefes Köpfchen mit Fragezeichen |

`pixel-slack-emojis.zip` enthält die acht Upload-PNGs und `Namen.txt`.
Entpacken, in Slack das Emoji-Menü öffnen, „Emoji hinzufügen“ wählen und die PNGs
mit den Namen aus der Tabelle einzeln hinzufügen. Die lokale `preview.html` zeigt
128-, 32- und 22-Pixel-Proben auf hellen und dunklen Hintergründen.

Die PNGs sind 128×128 Pixel groß, transparent und jeweils kleiner als 128 KB,
entsprechend [Slacks Empfehlung](https://slack.com/help/articles/206870177-Add-custom-emoji-and-aliases-to-your-workspace).
Die tatsächliche Darstellung hängt von Slack, Zoom und Gerät ab. Die Dateien
werden als eigenständiges Zusatzset gepflegt und nicht ins Spiel importiert.

## Quellen und Export

Die unveränderten, mit dem integrierten Bildwerkzeug erzeugten Originale liegen in
`sources/`; die vollständigen [Prompts](generation-prompts.md) enthalten die Rollen
der Referenzen. Grundlage sind `assets/team/pixel-portrait-v3.png` und
`assets/pixel/pixel-idle-master.png` aus demselben Repository.

`node tools/prepare-slack-emojis.mjs` exportiert das Set mit `pngjs` und dem
Systemwerkzeug `zip`. Die Motivgrenzen berücksichtigen Alpha ab 192. Ein
56-Pixel-Motivbereich im logischen 64×64-Raster erhält einen kleinen transparenten
Rand; anschließend wird ohne Glättung zweifach auf 128×128 vergrößert. Übernommene
RGB-Werte bleiben erhalten, Alpha wird binär. Die Quellen werden nicht geändert.
Der Export prüft die Dateigröße und erzeugt Namensliste, Vorschau und ZIP erneut.

## Landingpage-Download

Der Export kopiert die acht Vorschaubilder nach
`public/downloads/pixel-slack-emojis/` und das ZIP nach
`public/downloads/pixel-slack-emojis.zip`. Die Landingpage zeigt die Motive auf
Desktop in zwei Reihen, auf dem Handy in vier Reihen und bietet einen direkten
Download ohne Anmeldung. Texte und Bildbeschreibungen sind DE/EN vorhanden.
Die kleinen PNG-Vorschauen sind für die Offline-Landingpage im Workbox-Cache enthalten; das ZIP bleibt ausgeschlossen. Die großen Quellen bleiben ausschließlich hier im Asset-Verzeichnis.
