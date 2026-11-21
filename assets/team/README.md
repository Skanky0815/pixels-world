# Team-Porträts der Landingpage

Die Landingpage verwendet eigene Porträts unter `assets/team/`; die Spiel-Sprites
bleiben unverändert. `portraits-v1.json` enthält Referenzen, finale Prompts und
Exportparameter. `node tools/prepare-team-portraits.mjs` erzeugt die kleinen
128×128-Laufzeitdateien per Nearest Neighbor aus den erhaltenen Imagegen-Quellen.
Der Alpha-Kanal bleibt erhalten. Nur die kleinen Exporte werden von der Seite
geladen; Pixel wird dort per CSS zu Sara gespiegelt. Ricos Vorlage ist sein
öffentlicher GitHub-Avatar; die abgestimmte Haarfarbe steht im Asset-Briefing.
