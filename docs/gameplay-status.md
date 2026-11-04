# Phase 1: Issue-Abgleich und Reihenfolge

Geprüft gegen [Phase 1 – First Chaos (v0.1)](https://github.com/Skanky0815/pixels-world/milestone/1). GitHub bleibt die verbindliche Quelle für Status und Review.

| Issue | Gemergter Stand / aktueller Schritt |
| --- | --- |
| [#1 – Raum](https://github.com/Skanky0815/pixels-world/issues/1) | Abgeschlossen mit PR #12 |
| [#2 – Figur und Animationen](https://github.com/Skanky0815/pixels-world/issues/2) | Mit PR #36 abgeschlossen: bestätigter Master, Grundanimationen, abgeglichene Posen und reine Dev-Vergleichsansicht |
| [#3 – Eingaben](https://github.com/Skanky0815/pixels-world/issues/3) | Abgeschlossen; Ducken war optional und ist weiterhin nicht implementiert |
| [#4 – Physik](https://github.com/Skanky0815/pixels-world/issues/4) | Abgeschlossen mit PR #16: Schwung, automatisches Greifen und aktive Kletterkollisionen |
| [#5 – Vase](https://github.com/Skanky0815/pixels-world/issues/5) | Abgeschlossen mit PR #16: Anschubsen, Fall und Bodenbruch |
| [#13 – E2E](https://github.com/Skanky0815/pixels-world/issues/13) | Abgeschlossen mit PR #15; bei Gameplay-Änderungen erweitert |
| [#17 – Sofa kratzen](https://github.com/Skanky0815/pixels-world/issues/17) | Abgeschlossen mit PR #20: automatisches Kratzen, Animation, progressive Spuren, begrenzte Schadensereignisse und Punkte/Reset |
| [#18 – Vorhang rutschen/reißen](https://github.com/Skanky0815/pixels-world/issues/18) | Mit [PR #23](https://github.com/Skanky0815/pixels-world/pull/23) gemergt: Rutschen statt Hängenbleiben, progressive Risse, Punkte, Ablösen an Boden/Plattformen und Reset |
| [#19 – Pflanze anknabbern/umwerfen](https://github.com/Skanky0815/pixels-world/issues/19) | Mit PR #26 gemergt: automatisches Katzengras-Knabbern, Wackelwarnung, vorhersehbares Kippen, Punkte und Reset |

Reihenfolge nach Ricos Vorgabe: **#17 → #18 → #19 → #2**. Platzhalter reichen für die Interaktionen. Keine Heimkehr-, Runden- oder Versöhnungsfunktionen in diesen Phase-1-Interaktionen.

#7 (Vasenscoring und Ärger-Vorschau) ist mit PR #16 umgesetzt und wird aktuell in GitHub unter Phase 1 geführt. #6 (Timer/Heimkehr), #8 (Saras Reaktion), #9 (Versöhnung), #10 (Rundenergebnis) und #11 (weitere Chaosobjekte) gehören ebenfalls zu Phase 2 und bleiben offen. Auf Ricos Wunsch sind die neuen Schadensstufen an das bereits vorhandene Scoring angeschlossen: Sofa maximal 18, Vorhang maximal 32 und Pflanze maximal 12 Punkte pro Durchlauf. Es entsteht kein zusätzliches Punktesystem.

#14 (Versionierung/Release-Ablauf) ist in GitHub geschlossen. Veröffentlichte Versionen sind unter [GitHub Releases](https://github.com/Skanky0815/pixels-world/releases) nachzusehen; ein Versionsfeld allein ist kein veröffentlichter Release.

Die QA-Laufzeitoptimierung aus #24 ist mit PR #25 gemergt: lokal zwei Worker, CI mit zwei getrennten Teil-Suites und einem Worker je Runner. #2 ist mit PR #36 gemergt.

## Verbleibender Meilenstein-Abschluss

Das Architekturreview #22 ist mit PR #41 abgeschlossen; der Sofakonfigurationsfehler #40 mit PR #45 und die pfadgefilterte Game-QA #44 mit PR #46. Rico hat #37–#40, #42 und #44 dem Phase-1-Meilenstein für eine solide 0.1.0 zugeordnet. #43 (späterer JSON-Import) bleibt außerhalb.

Die HUD-Extraktion #39 ist mit PR #48 und die Test-Summary #49 mit PR #50 gemergt. Die Szenen-/Pixel-/Controls-Trennung #37 ist mit PR #51 gemergt. Objektgrenzen #38 sind mit PR #60 gemergt. Die typisierten Inhalte und der ergänzte Versionsfooter #42 sind in diesem Stand implementiert und werden separat reviewt. Zusätzlich offen sind GitHub Pages #32 sowie die inzwischen Phase 1 zugeordneten QA-Aufgaben #52 (Browserdurchläufe), #53 (Typprüfungen), #55 (Testaufteilung) und #61 (npm audit). GitHub bleibt für Review und Merge maßgeblich.
