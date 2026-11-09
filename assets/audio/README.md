# Wohnzimmer-Geräusche

Originale, deterministisch synthetisierte Geräusche für Pixel’s World (#237).
Keine Samples, Aufnahmen oder fremden Klangquellen. Erstellt mit
[`tools/prepare-object-audio.py`](../../tools/prepare-object-audio.py), reproduzierbar
mit `python3 tools/prepare-object-audio.py` (Python-Standardbibliothek).

Alle WAV-Dateien und ihr Syntheseprogramm werden unter **CC0-1.0**
freigegeben: [CC0 Public Domain Dedication](https://creativecommons.org/publicdomain/zero/1.0/).
Es bestehen keine fremden Namensnennungs- oder Lizenzpflichten.
Format: Mono, PCM 16 Bit, 22.050 Hz. Je zwei Varianten:

| Dateigruppe  | Anlass                                                   | Klang                                    |
| ------------ | -------------------------------------------------------- | ---------------------------------------- |
| `vase-*`     | Bruch am Boden                                           | heller keramischer Bruch, kurze Splitter |
| `picture-*`  | Bild erreicht Boden                                      | tieferer Rahmen-/Glasklirrer             |
| `books-*`    | Umsturz oder erneuter Bodenaufprall nach Auflagenverlust | dumpfer Papier-/Buchschlag               |
| `creak-*`    | Regal wird wacklig oder beschädigt                       | kurzes Holzknarzen                       |
| `collapse-*` | Regal stürzt ein                                         | tiefer Holzbruch mit Nachpoltern         |

| `jump-*` | Tatsächlich ausgelöster Boden-/Vorhangsprung | kurzer weicher Luft-/Absprungimpuls |
| `hairball-*` | Einmaliger Abschluss des Würgens | kurzer dumpfer Haarballen-Plopp |
| `retch-*` | Laufende Würgeanimation | gedämpftes rhythmisches Würgen |
| `scratch-*` | Laufende Kratzanimation | rhythmisches Schaben |
| `nibble-*` | Laufende Knabberanimation, einschließlich Wackelwarnung | leises Knuspern und Rascheln |
| `climb-*` | Tatsächliche Aufwärtsbewegung am Vorhang | kurze rhythmische Stoff-/Krallenreibung |
| `slide-*` | Tatsächliche Abwärtsbewegung am Vorhang | weiche kontinuierliche Stoffreibung |

Die Originaldateien lassen sich direkt im Browser oder Audioplayer anhören.
Im DEV-Objekt-Playground lassen sich die Geräusche mit den realen Interaktionen
prüfen. Beide Räume nutzen dieselben Übergänge. Die Variante wechselt pro
abgespieltem Effekt; objektbezogene Pegel liegen in `object-cues.ts`.

Aktionsgeräusche laufen als genau ein Loop für Pixels aktuelle Aktion. Wechsel,
Bewegungsabbruch, stillstehender Vorhangrand, Pause, Stummschaltung, Heimkehr und
Neustart entfernen den laufenden und den von Phaser vorbereiteten Folgesound.
Aktuelle Aktionen können beim Fortsetzen neu erklingen; alte Einzelereignisse
werden nicht nachgeholt. Aktionsloops teilen das Stimmenlimit mit den Impacts.
