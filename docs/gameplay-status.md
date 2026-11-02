# Issue-Abgleich und Gameplay-Reihenfolge

Abgleich vom 2. November 2026 gegen den gemergten Stand nach PR #15. Die GitHub-Issues bleiben die verbindliche Quelle für Status und Review.

| Issue | Gemergter Stand vor dieser Änderung | Nächster Schritt |
| --- | --- | --- |
| [#1](https://github.com/Skanky0815/pixels-world/issues/1) Raum | Fertig, mit PR #12 gemergt | Abgeschlossen |
| [#2](https://github.com/Skanky0815/pixels-world/issues/2) Figur/Animation | Steuerbarer Platzhalter und Blickrichtung; keine Animationen | Nach Gameplay-Kern |
| [#3](https://github.com/Skanky0815/pixels-world/issues/3) Eingaben | Pfeile, Sprung, Klettern und Absprung vorhanden und seit PR #15 getestet; Ducken war optional | Beim Abgleich als erledigt geschlossen |
| [#4](https://github.com/Skanky0815/pixels-world/issues/4) Physik | Grundbewegung vorhanden; Sprungschwung, automatisches Greifen und durchgehende Kletterkollisionen fehlten | Im aktuellen Gameplay-PR ergänzt |
| [#5](https://github.com/Skanky0815/pixels-world/issues/5) Vase | Fehlte; Bücher waren Dekoration | Im aktuellen Gameplay-PR ergänzt |
| [#6](https://github.com/Skanky0815/pixels-world/issues/6) Heimkehr | Raumstart/Pixel-Reset, aber kein Rundenzustand oder Timer | Nach Physik und Scoring |
| [#7](https://github.com/Skanky0815/pixels-world/issues/7) Punkte | Fehlte | Im aktuellen Gameplay-PR ergänzt, einschließlich Ärgergrundlage |
| [#8](https://github.com/Skanky0815/pixels-world/issues/8) Saras Reaktion | Fehlte | Nach #6; HUD-Vorschau allein erfüllt dieses Issue nicht |
| [#9](https://github.com/Skanky0815/pixels-world/issues/9) Versöhnung | Fehlte | Nach Heimkehr und Reaktion |
| [#10](https://github.com/Skanky0815/pixels-world/issues/10) Ergebnis/Neustart | Nur Pixel-Reset; kein Rundenergebnis | Vollständiger Ablauf folgt; Objekt-/Punktereset jetzt in #5/#7 |
| [#11](https://github.com/Skanky0815/pixels-world/issues/11) Weitere Objektarten | Fehlten | Nach erster Zerstörungs-/Punkteinteraktion |
| [#13](https://github.com/Skanky0815/pixels-world/issues/13) E2E | PR #15 gemergt, CI grün | Mit Gameplay erweitern |
| [#14](https://github.com/Skanky0815/pixels-world/issues/14) Versionierung | Konfiguration gemergt, Versionsregeln lokal geprüft | Erster Versions-PR/Release-Durchlauf noch ausstehend |

Ricos Priorität: erst Physik → zerstörbare Objekte → Chaospunkte/Ärgergrundlage → spielbarer Rundenablauf. Stil und Animationen folgen danach. Der aktuelle Gameplay-PR setzt #4, #5 und #7 um; #6 und #8 werden dadurch nicht vorzeitig geschlossen.
