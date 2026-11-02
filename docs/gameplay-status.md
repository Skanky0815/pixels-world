# Phase 1: Issue-Abgleich und Reihenfolge

Geprüft gegen [Phase 1 – First Chaos (v0.1)](https://github.com/Skanky0815/pixels-world/milestone/1). GitHub bleibt die verbindliche Quelle für Status und Review.

| Issue | Gemergter Stand / aktueller Schritt |
| --- | --- |
| [#1 – Raum](https://github.com/Skanky0815/pixels-world/issues/1) | Abgeschlossen mit PR #12 |
| [#2 – Figur und Animationen](https://github.com/Skanky0815/pixels-world/issues/2) | Offen: Stand-, Lauf-, Sprung- und Kletteranimationen fehlen; #17 ergänzt nur eine Platzhalter-Kratzanimation |
| [#3 – Eingaben](https://github.com/Skanky0815/pixels-world/issues/3) | Abgeschlossen; Ducken war optional und ist weiterhin nicht implementiert |
| [#4 – Physik](https://github.com/Skanky0815/pixels-world/issues/4) | Abgeschlossen mit PR #16: Schwung, automatisches Greifen und aktive Kletterkollisionen |
| [#5 – Vase](https://github.com/Skanky0815/pixels-world/issues/5) | Abgeschlossen mit PR #16: Anschubsen, Fall und Bodenbruch |
| [#13 – E2E](https://github.com/Skanky0815/pixels-world/issues/13) | Abgeschlossen mit PR #15; bei Gameplay-Änderungen erweitert |
| [#17 – Sofa kratzen](https://github.com/Skanky0815/pixels-world/issues/17) | In diesem PR: verzögertes automatisches Kratzen, Animation, progressive Spuren, begrenzte Schadensereignisse und Reset |
| [#18 – Vorhang rutschen/reißen](https://github.com/Skanky0815/pixels-world/issues/18) | Offen; wird das bisherige Hängenbleiben bewusst ersetzen |
| [#19 – Pflanze anknabbern/umwerfen](https://github.com/Skanky0815/pixels-world/issues/19) | Offen; die Pflanze ist bislang Dekoration |

Reihenfolge nach Ricos Vorgabe: **#17 → #18 → #19 → #2**. Platzhalter reichen für die Interaktionen. Keine weiteren Phase-2-Funktionen im Sofa-Issue.

#7 (Vasenscoring und Ärger-Vorschau) ist bereits mit PR #16 umgesetzt, gehört jedoch zu Phase 2. #6 (Timer/Heimkehr), #8 (Saras Reaktion), #9 (Versöhnung), #10 (Rundenergebnis) und #11 (weitere Chaosobjekte) gehören ebenfalls zu Phase 2 und bleiben offen. Auf Ricos Wunsch werden neue Sofa-Schadensstufen an das bereits vorhandene Scoring angeschlossen: 3 Punkte je Stufe, maximal 18 pro Durchlauf. Es entsteht kein zusätzliches Punktesystem.

Die Release-Konfiguration aus #14 ist gemergt; der erste tatsächliche Versions-PR und Release-Durchlauf stehen noch aus.
