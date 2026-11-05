# Spielmechaniken des Prototyps

Hier stehen die tatsächlich spielbaren Mechaniken und ihre Parameter. Neue Wünsche und Phasenplanung werden ausschließlich in [Issues](https://github.com/Skanky0815/pixels-world/issues) und [Milestones](https://github.com/Skanky0815/pixels-world/milestones) gepflegt.

## Runde bis zur Heimkehr

Pro neuem Durchlauf wird einmal eine Rückkehrzeit zwischen **60 und 105 Sekunden**
aktiver Spielzeit gewählt. Das HUD zeigt nur „Noch etwas Zeit“, „Sara könnte bald
kommen“ und „Jeden Moment …“. Die Hinweise wechseln bei 40 bzw. 15 Prozent
verbleibender Rundendauer; sie zeigen keine konkrete Sekunde an.

Fokusverlust oder ein versteckter Tab pausieren Zeit, Physik, Interaktionen und
Darstellung. Gehaltene Tasten werden freigegeben. Nach Rückkehr wird das erste Delta
verworfen; weitere Frame-Deltas sind auf 100 ms begrenzt. Es wird keine Hintergrundzeit
nachgeholt. Uhr und Physik verwenden denselben bereinigten Zeitschritt.

Am Ende des letzten zulässigen Frames werden Physik-/Schadensereignisse und
Interaktionen noch verarbeitet. Anschließend wechselt die Runde genau einmal von
`chaos` nach `returning` und sichert den finalen Chaosstand. Physik, Steuerung,
weitere Schäden und Pixels Animation bleiben stehen. Sara tritt durch eine vorläufig
dargestellte Tür ein und schaut sich das Zimmer an. Die Reaktion nutzt einmalig den
eingefrorenen Score: **0–24** skeptisch/gelassen, **25–59** genervt und **ab 60**
fassungslos/verärgert. Es gelten dieselben zentralen Ärgergrenzen wie im HUD.

Der Eintritt dauert 1,2 Sekunden, der Reaktionsmoment 0,9 Sekunden. Danach erscheint
für 3,6 Sekunden ein zufällig gewählter trockener Kommentar; pro Stufe gibt es drei
Varianten. Auch dieser Ablauf pausiert bei Fokusverlust oder verstecktem Tab. Danach
wechselt die Runde einmalig in `reconciliation`: **„Versöhnung · Fortsetzung folgt“**
ist der erkennbare Platzhalter, noch keine spielbare Versöhnung. Weitere Punkte und
Bewegung bleiben während und nach der Sequenz gesperrt.

Saras Figur, Tür und Reaktionsdarstellung sind bewusst vorläufige Formen. Fertige
Chibi-Sprites und Animationen folgen separat in #88; die bestätigte Referenz wird
hier noch nicht als fertige Animation verwendet.

**R** startet auch nach der Heimkehr eine vollständig neue Runde einschließlich
neuer Zufallsauswahl, Zeit, Punkten, Schäden, Eingaben, Sara-Sequenz und HUD. Derselbe zufällig
gezogene Zeitpunkt darf dabei erneut vorkommen.

## Steuerung und Bewegungsrichtung

| Eingabe                 | Aktion                                    |
| ----------------------- | ----------------------------------------- |
| ← / →                   | Bewegen                                   |
| ↑ / ↓                   | An einer Kletterfläche auf- und absteigen |
| ↓ am Boden              | Ducken, später optional                   |
| Leertaste               | Springen                                  |
| Leertaste + ← / →       | Richtung beim Sprung steuern              |
| Leertaste beim Klettern | Von der Fläche abspringen                 |

Klettern ist langsamer als Springen. Beim Anspringen greift Pixel den Vorhang automatisch; ↑ oder ↓ greift auch bewusst. Nach dem Absprung muss Pixel die Kletterfläche verlassen, bevor er sie erneut automatisch greifen kann. Plattformkollisionen bleiben beim Klettern aktiv. Sprünge behalten ihren horizontalen Schwung, Richtungstasten erlauben begrenzte Luftsteuerung.

## Chaospunkte und Ärger-Vorschau

| Objekt                             | Punkte beim Bodenbruch |
| ---------------------------------- | ---------------------: |
| Kleine Vase auf dem ersten Regal   |                     25 |
| Blaue Vase auf dem mittleren Regal |                     35 |
| Erbstück auf dem oberen Regal      |                     40 |

Die HUD-Vorschau für Saras Ärger ist **entspannt** unter 25 Punkten, **genervt** ab 25 und **wütend** ab 60. Die Leiste reicht bis zu den insgesamt möglichen 162 Punkten: 100 für Vasen, 18 für Sofakratzer, 32 für Vorhangrisse und 12 für die Pflanze. Werte und Schwellen stehen in [src/game/domain/chaos.ts](../src/game/domain/chaos.ts). Berührung, Anschubsen und ein Zwischenstopp auf einem anderen Regal zählen noch nicht als Schaden. Vasen zählen erst beim tatsächlichen Bodenbruch und höchstens einmal pro Durchlauf. Sofa-, Vorhang- und Pflanzenschäden zählen je neuer Schadensstufe einmal; dasselbe Möbel zählt dabei als ein beschädigtes Objekt.

Die Vasen verwenden dieselbe Arcade-Physik wie Pixel. Nach einem seitlichen Anschubser gleiten sie über die Kante, fallen mit Schwerkraft und zeigen beim Bodenaufprall einfache Splitter. Die sichtbare Drehung ist Platzhalterfeedback; es gibt noch keine vollständige Starrkörper-/Stoffsimulation. Mehrere Vasen dienen dem Test der Punktebereiche; Bücher bleiben Dekoration; die Pflanze hat ihre eigene kleine Interaktion. Weitere Objektarten gehören zu #11.

Der HUD-Ausblick ist eine Vorschau. Verbindliche Planung und aktuelle Aufgaben stehen in den [GitHub-Milestones](https://github.com/Skanky0815/pixels-world/milestones).

## Automatisches Sofakratzen (Phase 1)

Bleibt Pixel etwa **zwei Sekunden** am Sofa stehen, beginnt sie ohne Aktionstaste zu kratzen. Das funktioniert am Boden vor dem Sofa und auf seiner Sitzfläche. Drei 32×32-Frames und bewegte Pfoten zeigen das Kratzen; alle **750 ms** kommt eine sichtbare Spur hinzu. Pro Durchlauf sind höchstens **sechs Schadensstufen** möglich.

Bewegen oder Springen beendet die Aktion sofort. Vorhandene Kratzer bleiben, beim erneuten Stillstehen läuft die volle Wartezeit von vorn. **R** entfernt die Kratzer und setzt Interaktion und Ereigniszähler zurück. Wartezeit, Intervall, Schadensgrenze und Ereigniswert stehen in [src/game/interactions/couch-scratching.ts](../src/game/interactions/couch-scratching.ts).

Jede neue Spur emittiert über die Phaser-Szene ein unveränderliches `object-damaged`-Ereignis mit `objectId: couch`, `kind: scratch`, Schadensstufe und `value: 3`. Das vorhandene Scoring zählt jede neue Kratzstufe einmal: **3 Punkte je Stufe, höchstens 18 pro Durchlauf**. Wiederholtes Ausgeben derselben Stufe kann keine zusätzlichen Punkte erzeugen. Das Sofa zählt als ein beschädigtes Objekt; die Vasen behalten ihre bisherigen Werte. R setzt sowohl Kratzschaden als auch Punkte zurück.

Konfigurierte Sofapunktwerte müssen nicht negative sichere Ganzzahlen sein; null ist erlaubt. Ungültige Werte werden bereits beim Erzeugen des Sofamodells abgelehnt, bevor die Interaktion Schaden erzeugen kann.

Zum manuellen Prüfen am Boden auf Höhe des Sofas anhalten: vor zwei Sekunden kein Kratzen, danach Animation und schrittweise Spuren. Weglaufen oder springen beendet die Animation; R entfernt den Schaden. Unit- und E2E-Tests prüfen Verzögerung, Intervalle, Abbruch, Animation, Schadensgrenze und Neustart.

## Vorhangrutschen und Risse (Phase 1)

Am Vorhang hält **↑** Pixel beim Hochklettern. Ohne Aufwärts-Eingabe rutscht sie mit **35 px/s** hinunter; **↓** beschleunigt auf **125 px/s**. Das bisherige bewegungslose Hängenbleiben entfällt. Weiterklettern und Abspringen beenden die Rutschphase; Plattformkollisionen bleiben aktiv. Trifft Pixel beim Rutschen auf Boden oder eine Plattform, löst sie den Griff automatisch. Vom Boden lässt sich mit ↑ sofort erneut greifen und klettern.

Nur beim tatsächlichen Hinabrutschen entsteht alle **600 ms** ein sichtbarer Riss. Jeder neue Riss gibt **4 Chaospunkte**, höchstens achtmal bzw. 32 Punkte pro Durchlauf. Weiterklettern oder Ablösen unterbricht das laufende Schadensintervall; bestehende Risse bleiben erhalten. **R** entfernt Risse und setzt Vorhangzustand, Ereignisse und Punkte zurück.

Geschwindigkeiten, Schadensintervall, Schadensgrenze und Ereigniswert stehen in [src/game/interactions/curtain-sliding.ts](../src/game/interactions/curtain-sliding.ts). Risse emittieren eingefrorene `object-damaged`-Ereignisse mit `objectId: curtain`, `kind: tear`, Stufe und Wert. Es gibt keine Ereignisflut pro Frame oder nach einem langen Frame. Das ist ein spielbarer Stoffschaden mit Platzhalterlinien, keine Stoffsimulation.

Zum Prüfen hinaufklettern und loslassen: Pixel rutscht sichtbar, nach dem Intervall entstehen Risse und Punkte. ↑ stoppt den Rissfortschritt, Leertaste löst den Griff. Am Boden endet das Rutschen; ↑ greift erneut, R stellt den unbeschädigten Vorhang wieder her. Automatisierte Tests prüfen Zustandswechsel, Bewegung, Punkte, Unterbrechungen, Bodenbegrenzung und Neustart.

## Katzengras anknabbern und Topf umwerfen (Phase 1)

Links am Boden steht ein Platzhalter für Katzengras. Geh von der Startposition ein kleines Stück nach links und bleib neben dem Topf stehen. Nach **zwei Sekunden** beginnt Pixel automatisch zu knabbern; zwei Animationsframes und bewegte Halme zeigen die Aktion. Nach **einer weiteren Sekunde** wackelt der Topf deutlich, begleitet vom Hinweis im HUD. Erst nach **1,2 Sekunden Warnzeit** kippt er nach links und Erde bleibt am Boden liegen. Es gibt keine Zufallsentscheidung und keine Aktionstaste.

Bewegung, Richtungseingaben oder Springen unterbrechen die Folge sofort; vor dem Kippen richtet sich der Topf wieder auf. Ein vorhandener Biss bleibt sichtbar. Bei erneuter Annäherung läuft die volle Wartezeit von vorn. Am Startpunkt, außerhalb der Reichweite und in der Luft beginnt keine Interaktion. Der erste Biss gibt einmal **2 Chaospunkte**, das Kippen weitere **10**. Auch nach erneutem Annähern gibt es denselben Schaden nicht doppelt; die Pflanze zählt als ein beschädigtes Objekt.

**R** stellt Topf und Halme aufrecht wieder her, entfernt Erde, Ereignisse und Punkte und beendet die Knabberanimation. Wartezeit, Knabberdauer, Warnzeit und Punkte stehen in [src/game/interactions/plant-nibbling.ts](../src/game/interactions/plant-nibbling.ts). Eingefrorene `object-damaged`-Ereignisse enthalten `objectId: plant`, `kind: nibble` bzw. `tip`, Stufe und Wert. Langframes können nicht mehrere Phasen auf einmal überspringen. Das Kippen ist eine feste Platzhalterdarstellung, keine zusätzliche Starrkörperphysik.

Zum Prüfen erst bis zum Wackeln warten und weglaufen: Der Topf bleibt stehen. Dann erneut warten, bis er kippt: insgesamt 12 Punkte, keine weitere Punktevergabe. R stellt alles wieder her. Unit- und Browser-Tests prüfen Phasengrenzen, Unterbrechungen, Animation, Warnung, einmalige Punkte und Reset.

## Pixels Animationen: 32×32-Grafik, 64×64-Darstellung

Der erste Idle-Frame ist exakt der von Rico bestätigte Pixel-Master v3. Das lokale Sprite-Sheet enthält 25 Zellen à **32×32 Pixel**: Sitzen mit Atmen/Blinzeln, einen seitlichen Laufzyklus, Aufstieg/Scheitelpunkt/Fall, kurze Landung sowie Klettern und Rutschen in **Rückansicht**. Kratzen und Knabbern verwenden ebenfalls Posen aus diesem Sheet. Linksbewegung spiegelt den seitlichen Lauf; Klettern zeigt den Rücken.

Die Animation folgt der vorhandenen Physik. Neue Bewegung unterbricht die Landepose; Springen und Klettern verdrängen Bodenaktionen. R setzt auf Idle zurück. Die Grunddarstellung des 32×32-Originals ist ohne Glättung **64×64**. Ein sichtbares Sprite folgt dem festen Physikkörper am Pfotenanker: kompakter Lauf und Idle verwenden Faktor 2, Klettern/Rutschen Faktor 2,5 (80×80); die ursprünglich kleiner angelegten Aktionsposen eine größere Zeichenfläche (94×94 für Sprung/Fall/Landung, 80×80 beim Knabbern und Kratzen). So schrumpft Pixel beim Zustandswechsel nicht in die alte, kleinere Körperwirkung zurück; gestreckte Posen dürfen eine größere Zeichenfläche belegen. Die ebenfalls skalierte Kollisionsfläche misst **52×52** Spielpixel und ist horizontal zentriert; Start und Reset richten die Pfoten am Boden aus. Animationsframes verändern weder Reichweiten, Bewegungsgeschwindigkeiten noch Schadensintervalle.

[Sheet, Framebelegung und Aufbereitung](../assets/pixel/README.md) dokumentieren Originalvorlage, Bildwerkzeug-Prompt und reproduzierbares Packen. Die Engine lädt nur das kleine 160×160-Sheet; Vorlage und Kontrollansicht werden nicht mitgeliefert. Einstellungen und Zustandsauswahl stehen in [src/game/actors/pixel-animations.ts](../src/game/actors/pixel-animations.ts). Zum Prüfen kurz stehen bleiben, laufen und Richtung wechseln, senkrecht springen/landen und am Vorhang hochklettern. Bei der obersten Vase erst links neben ihr auf dem Regal landen und dann seitlich anschubsen; von ganz oben kann Pixel darübersteigen.

### Animationen direkt vergleichen

Bei laufendem Entwicklungsserver öffnet [Animationsvergleich](http://127.0.0.1:5173/animation-compare.html) eine separate Arbeitsansicht. Jede Pose steht neben dem bestätigten Idle-Master auf derselben Pfotenlinie. Pause, Einzelschritt und Größenregler helfen beim Beurteilen; die Regler ändern ausschließlich die Vorschau. Andere Posen lassen sich je Karte auswählen. Die Ansicht verwendet dasselbe Sheet und dieselben Größen wie das Spiel, ist ausdrücklich nur im Dev-Betrieb erlaubt. `vite.config.ts` baut ausschließlich die Spielseite; E2E- und Produktionsvorschau liefern für die Vergleichsseite und ihre Quelldateien 404 statt einer SPA-Weiterleitung. Eine zusätzliche Laufzeitprüfung verhindert den Start außerhalb von `import.meta.env.DEV`.

## Raum und Content

Der Raum verwendet 960×540 logische Pixel und skaliert im ursprünglichen Seitenverhältnis. Boden, Sofa, Regale und Klettervorhang sind geometrische Platzhalter. Bücher und Bild sind Dekoration. Der bestätigte 32×32-Pixel-Master erscheint im Grundzustand mit 64×64 Spielpixeln. Zur Laufzeit sind kein Backend, keine Konten und keine externen Grafikdownloads nötig.

Instanzfähige Objekte, gemeinsame Schadensereignisse und der Lebenszyklus sind in der [Gameplay-Architektur](architecture/gameplay.md) dokumentiert. Handgebaute Räume, Objektvarianten, Assets und Validierung erklärt der [Content-Leitfaden](../src/content/README.md). Der Footer zeigt die beim Build übernommene Paketversion und das aktuelle Jahr; er bestätigt für sich allein keinen veröffentlichten Release.
