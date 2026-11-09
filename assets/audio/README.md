# Wohnzimmer- und Aktionsgeräusche

Alle Laufzeitdateien liegen als kurze Mono-WAVs (PCM 16 Bit, 22.050 Hz) direkt
in diesem Ordner. Je zwei Varianten werden über Phasers Effektkanal mit
Gesamtlautstärke × Effektlautstärke abgespielt. Es gibt keine externen
Audioabrufe zur Laufzeit. Nicht für das Spiel benötigte vollständige
Quellaufnahmen liegen unter `reference-sources/` und werden nicht gebündelt.

## Aufnahmen und Rechte

| Quelle                                                                                          | Urheber    | Lizenz                                                        | Abgeleitete Dateien               |
| ----------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------- | --------------------------------- |
| [Nails on sofa (SoundAction 270), 863248](https://freesound.org/people/alexarje/sounds/863248/) | alexarje   | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)     | `scratch-*`, `climb-*`, `slide-*` |
| [Cat Eating.WAV, 407177](https://freesound.org/people/Spyboticer/sounds/407177/)                | Spyboticer | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | `nibble-*`                        |
| [Animal Footsteps, 658429](https://freesound.org/people/IENBA/sounds/658429/)                   | IENBA      | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | `walk-*`                          |
| [Cat Coughing.wav, 561726](https://freesound.org/people/har2h/sounds/561726/)                   | har2h      | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | `retch-*`                         |

Die Kratzaufnahme und ihre Bearbeitungen bleiben **CC BY 4.0**. Sie werden nicht
als eigene CC0-Synthese ausgegeben. Namensnennung, Quelle, Lizenz und
Bearbeitungshinweis stehen auch im ausgelieferten [Impressum](../../impressum.html#audio-credits).
Die Knabber-, Schritt- und Würgeaufnahmen behalten CC0; ihre Urheber werden freiwillig genannt.

Als Eingang dient jeweils die auf der Quellseite öffentlich angebotene
**HQ-MP3-Vorschau**, nicht die nur nach Anmeldung erhältliche Original-WAV.
Diese wurde am 9. November 2026 mit `afconvert` in Mono-PCM umgewandelt und als
kanonische WAV unter `reference-sources/` abgelegt. Die Quellen sind weiterhin
komplette Aufnahmen; die Spiel-WAVs enthalten ausschließlich kurze Ausschnitte.
Die Schrittausgangsaufnahme ist Tier-Foley auf Sand/Gras/Kies; sie wird für das
Wohnzimmer durch Filterung und einen zurückhaltenden Spielpegel weicher gestaltet.

Bearbeitungen: Mono-/Abtastratenwandlung, Zuschnitt, Hoch-/Tiefpass, Normalisierung
mit Spitzengrenze und 12-ms-Randblenden. Die zwei Varianten nutzen verschiedene
Ausschnitte. Quelle, Vorschau-URL, SHA-256 und sämtliche Schnitt-/Filterparameter
stehen in [sources.json](reference-sources/sources.json).
Reproduktion nur mit Python-Standardbibliothek:

```sh
python3 tools/prepare-recorded-audio.py
```

## Eigene Synthesen

`vase-*`, `picture-*`, `books-*`, `creak-*`, `collapse-*`, `jump-*` und `hairball-*`
sind eigene deterministische Synthesen ohne fremde Samples.
Diese Dateien und die beiden Bearbeitungs-/Syntheseprogramme sind unter
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) freigegeben.
Reproduktion: `python3 tools/prepare-object-audio.py`. Dieser Befehl überschreibt
keine aus Aufnahmen bearbeiteten Dateien.

## Auslösung

| Gruppe                           | Anlass                                                   |
| -------------------------------- | -------------------------------------------------------- |
| `vase-*`, `picture-*`, `books-*` | Bruch bzw. tatsächlicher Aufprall des jeweiligen Objekts |
| `creak-*`, `collapse-*`          | Regalwarnung/-schaden bzw. Einsturz                      |
| `jump-*`, `hairball-*`           | Tatsächlicher Absprung bzw. einmaliger Würgeabschluss    |
| `retch-*`                        | Laufende Würgeanimation                                  |
| `scratch-*`, `nibble-*`          | Kratzen bzw. Knabbern samt Wackelwarnung                 |
| `climb-*`, `slide-*`             | Tatsächliche Bewegung am Vorhang                         |
| `walk-*`                         | Tatsächliche waagerechte Bewegung mit Bodenkontakt       |

## Hörprobe und Lebensdauer

Beide Wohnzimmer und der DEV-Objekt-Playground verwenden dieselbe Audioanbindung.
Aktionsgeräusche laufen als genau ein Loop für Pixels aktuelle Aktion. Schritte
sind an Bodenkontakt, geringe vertikale Geschwindigkeit und tatsächlichen
horizontalen Positionsfortschritt gebunden: Luft, Vorhang und Wanddruck bleiben
frei von Schritten. Aktionswechsel, Bewegungsabbruch, Anschlag, Pause,
Stummschaltung, Heimkehr und Neustart entfernen laufende und vorbereitete Quellen.
Aktuelle Aktionen können beim Fortsetzen neu erklingen; alte Einzelereignisse
werden nicht nachgeholt. Loops und Impacts teilen das Stimmenlimit.

Die automatische Rückkehr zu Sara nutzt dieselbe Schrittregel; beim Sitzen endet
auch dort der Schrittsound. Der Wechsel zur Heimkehr spielt keine alte Aktion nach.
