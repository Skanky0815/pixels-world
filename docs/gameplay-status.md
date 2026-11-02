# Phase 1: Issue-Abgleich und Reihenfolge

Geprüft gegen [Phase 1 – First Chaos (v0.1)](https://github.com/Skanky0815/pixels-world/milestone/1). GitHub bleibt die verbindliche Quelle für Status und Review.

| Issue | Gemergter Stand / aktueller Schritt |
| --- | --- |
| [#1 – Raum](https://github.com/Skanky0815/pixels-world/issues/1) | Abgeschlossen mit PR #12 |
| [#2 – Figur und Animationen](https://github.com/Skanky0815/pixels-world/issues/2) | In diesem PR: bestätigter 32×32-Master, Idle, seitlicher Lauf, Sprung/Fall/Landung und Klettern in Rückansicht; Kratzen und Knabbern ebenfalls im Sheet |
| [#3 – Eingaben](https://github.com/Skanky0815/pixels-world/issues/3) | Abgeschlossen; Ducken war optional und ist weiterhin nicht implementiert |
| [#4 – Physik](https://github.com/Skanky0815/pixels-world/issues/4) | Abgeschlossen mit PR #16: Schwung, automatisches Greifen und aktive Kletterkollisionen |
| [#5 – Vase](https://github.com/Skanky0815/pixels-world/issues/5) | Abgeschlossen mit PR #16: Anschubsen, Fall und Bodenbruch |
| [#13 – E2E](https://github.com/Skanky0815/pixels-world/issues/13) | Abgeschlossen mit PR #15; bei Gameplay-Änderungen erweitert |
| [#17 – Sofa kratzen](https://github.com/Skanky0815/pixels-world/issues/17) | Abgeschlossen mit PR #20: automatisches Kratzen, Animation, progressive Spuren, begrenzte Schadensereignisse und Punkte/Reset |
| [#18 – Vorhang rutschen/reißen](https://github.com/Skanky0815/pixels-world/issues/18) | Mit [PR #23](https://github.com/Skanky0815/pixels-world/pull/23) gemergt: Rutschen statt Hängenbleiben, progressive Risse, Punkte, Ablösen an Boden/Plattformen und Reset |
| [#19 – Pflanze anknabbern/umwerfen](https://github.com/Skanky0815/pixels-world/issues/19) | Mit PR #26 gemergt: automatisches Katzengras-Knabbern, Wackelwarnung, vorhersehbares Kippen, Punkte und Reset |

Reihenfolge nach Ricos Vorgabe: **#17 → #18 → #19 → #2**. Platzhalter reichen für die Interaktionen. Keine Heimkehr-, Runden- oder Versöhnungsfunktionen in diesen Phase-1-Interaktionen.

#7 (Vasenscoring und Ärger-Vorschau) ist bereits mit PR #16 umgesetzt, gehört jedoch zu Phase 2. #6 (Timer/Heimkehr), #8 (Saras Reaktion), #9 (Versöhnung), #10 (Rundenergebnis) und #11 (weitere Chaosobjekte) gehören ebenfalls zu Phase 2 und bleiben offen. Auf Ricos Wunsch sind die neuen Schadensstufen an das bereits vorhandene Scoring angeschlossen: Sofa maximal 18, Vorhang maximal 32 und Pflanze maximal 12 Punkte pro Durchlauf. Es entsteht kein zusätzliches Punktesystem.

Die Release-Konfiguration aus #14 ist gemergt; der erste tatsächliche Versions-PR und Release-Durchlauf stehen noch aus.

Die QA-Laufzeitoptimierung aus #24 ist mit PR #25 gemergt: lokal zwei Worker, CI mit zwei getrennten Teil-Suites und einem Worker je Runner. Die noch offene Phase-1-Grafik aus #2 wird in diesem PR umgesetzt; der Abschluss erfolgt nach Review und Merge.
