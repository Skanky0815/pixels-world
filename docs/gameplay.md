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
`chaos` nach `returning` und sichert den finalen Chaosstand. Spielersteuerung, weitere Schäden und die übrigen dynamischen Objekte bleiben
stehen. Pixel läuft mit seiner normalen Physik automatisch zu Sara, steigt dabei
von Möbeln herunter und setzt sich links neben sie. Sara tritt durch eine vorläufig
dargestellte Tür ein und schaut sich das Zimmer an. Die Reaktion nutzt einmalig den
eingefrorenen Score: **0–24** skeptisch/gelassen, **25–59** genervt und **ab 60**
fassungslos/verärgert. Es gelten dieselben zentralen Ärgergrenzen wie im HUD.

Der Eintritt dauert 1,2 Sekunden, der Reaktionsmoment 0,9 Sekunden. Danach erscheint
ein zufällig gewählter trockener Kommentar; pro Stufe gibt es drei Varianten. Er
bleibt ohne Zeitlimit sichtbar. Sobald Pixel sitzt, bestätigt ein neuer Druck auf
die Leertaste den Text; gehaltene Tasten überspringen ihn nicht. Auch dieser Ablauf
pausiert bei Fokusverlust oder verstecktem Tab. Nach der Bestätigung
wechselt die Runde einmalig in das Versöhnungs-Minispiel. Weitere Punkte und
freie Bewegung bleiben während und nach der Sequenz gesperrt.

Sara erscheint als animierte Chibi-Figur mit Brille, lockerem Pferdeschwanz und
dunklem Hoodie. Eintritt und Idle laufen als Schleifen; die drei Reaktionen werden
jeweils einmal abgespielt und halten dann ihre Endpose bis zum nächsten Zustand.
Alle Posen verwenden eine gemeinsame Palette und denselben Fußanker. Die Tür
bleibt eine einfache Raumdarstellung; die Versöhnung ist weiterhin ein Platzhalter.

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

Unter den Pixel-Karten stehen Saras fünf Zustände: Idle/Blinzeln, Hereinkommen und
die drei Reaktionen. Jede Karte zeigt Saras bestätigte Idle-Silhouette, Pixel im
Spielmaßstab und die auswählbare animierte Pose. Es gelten dieselben 64×96-Zellen,
der Faktor 2, die gemeinsame Fußlinie und die Clip-Geschwindigkeiten wie im Spiel.
Pause und Einzelschritt steuern beide Figuren gemeinsam. Nur diese Arbeitsansicht
wiederholt auch einmalige Reaktionen zur Kontrolle. [Assetvertrag und Prompts](../assets/sara/README.md).

## Raum und Content

Der Raum verwendet 960×540 logische Pixel und skaliert im ursprünglichen Seitenverhältnis. Boden, Sofa, Regale und Klettervorhang sind geometrische Platzhalter. Bücher und Bild sind Dekoration. Der bestätigte 32×32-Pixel-Master erscheint im Grundzustand mit 64×64 Spielpixeln. Zur Laufzeit sind kein Backend, keine Konten und keine externen Grafikdownloads nötig.

Instanzfähige Objekte, gemeinsame Schadensereignisse und der Lebenszyklus sind in der [Gameplay-Architektur](architecture/gameplay.md) dokumentiert. Handgebaute Räume, Objektvarianten, Assets und Validierung erklärt der [Content-Leitfaden](../src/content/README.md). Der Footer zeigt die beim Build übernommene Paketversion und das aktuelle Jahr; er bestätigt für sich allein keinen veröffentlichten Release.

## Versöhnung: Pixels Charmeoffensive

Nach Saras Kommentar und dessen Bestätigung beginnt das Pfeiltasten-Reaktionsspiel.
Es erscheint nur die nächste Taste, niemals die gesamte zufällige Folge. Jede
Taste muss innerhalb ihres Zeitfensters neu gedrückt werden; Gedrückthalten oder
mehrere gleichzeitige Pfeile zählen nicht als weitere richtige Eingabe. Zwischen
Tasten liegen 700 ms Vorbereitung. Eine vollständige Folge verdient genau ein Herz.
Die Anzeige zeigt gefüllte und leere Herzen sowie den Zähler, etwa `♥♥♡ · 2/3`.
Die nötigen Herzen werden beim Start anhand des finalen Chaoswerts gewählt und
bleiben für diesen Versöhnungsversuch fest.

| Chaos | Tasten pro Folge | Benötigte Folgen | Zeit pro Taste |
| ----- | ---------------- | ---------------- | -------------- |
| 0–24  | 3                | 1                | 1,8 s          |
| 25–59 | 4                | 2                | 1,5 s          |
| ab 60 | 4                | 3                | 1,2 s          |

Das sind erste Playtestwerte aus `src/content/reconciliation.ts`, keine zweite
Chaos-Schwellenlogik. Die Domain verwendet dieselbe `angerFor`-Auswahl wie Sara.
Vor dem ersten Versuch und nach jeder Folge oder jedem Fehler gibt es eine
Lesepause ohne Timer. Ein neuer Druck auf die Leertaste startet den nächsten Versuch.
Während der Eingabe erscheint die aktive Taste auf einer großen eigenen Kachel;
Saras Sprüche werden ausschließlich in den Lesepausen gezeigt und kursiv
in warmem Gold und Anführungszeichen vom Spielhinweis abgesetzt. Leertaste bzw. R stehen unten rechts im Dialogfeld. Bereits
verdiente Herzen bleiben. Pro Herz gibt es zwei Versuche für die gesamte Tastenfolge. Nach dem ersten Fehler
wird das Eingabefenster um 300 ms verlängert; ein zweiter Fehler am selben Herz
beendet die Versöhnung als gescheitert. Ein gewonnenes Herz setzt das Budget
und die zusätzliche Hilfe zurück. Fehler und Timeouts zählen gleichermaßen.
Es gibt kein Gesamtzeitlimit; Lesepausen verbrauchen keine Versuche.
Nach dem Scheitern bleibt ein eindeutiger Abschluss mit R zum Neustart stehen.

Texte und Herzchen zeigen Schnurren und Anschmiegen als grafische Platzhalter.
Sara kommentiert abhängig von der ursprünglichen Chaosstufe. Bei voller Leiste
folgt ein kurzer Streichel-Platzhalter und dann „Versöhnt“ mit Neustart über R.
Danach zeigt das Rundenergebnis Chaospunkte, Saras ursprüngliche Reaktion und
den Versöhnungsausgang und die erreichten Herzen. Ein eigener Abschlussspruch
richtet sich nach der ursprünglichen Ärgerstufe und dem Erfolg oder Scheitern
der Versöhnung; alle sechs Kombinationen haben einen passenden Kommentar. Es bleibt
ohne Zeitlimit stehen; R setzt Uhr, Schäden, Punkte, Figuren, Dialoge,
Versöhnungsfortschritt und Ergebnis gemeinsam zurück. Echte Zuneigungsanimationen
und Audio sind in diesem Schritt nicht enthalten. Bei flüssigen Eingaben sind ungefähr
je nach Ärgerstufe wenige Sekunden bis etwa 20 Sekunden aktive Reaktionszeit vorgesehen; Lesepausen sind frei; das Spielgefühl muss noch mit Rico abgestimmt werden.
Fokus-/Visibility-Pause stoppt alle Fristen; R verwirft auch Folge und Fortschritt.

## Einstieg vor der ersten Runde

Die Seite zeigt zuerst eine Einführung mit dem unveränderten README-Banner,
Spielidee und aktuellen Tastenhinweisen. Leertaste startet genau einmal;
diese Eingabe wird verbraucht und löst keinen Sprung aus. Gedrückthalten
startet nicht mehrfach. Vorher laufen weder Uhr noch Physik, Animationen
oder Chaosaktionen. R wird vor dem Start ignoriert. Browserfokus und
Sichtbarkeit müssen für das Startsignal aktiv sein.

Nach dem ersten Start führt R direkt in eine frische Runde, auch aus der
Auswertung. Erst das Neuladen der Seite zeigt die Einführung wieder.
Die Startseite verwendet normalen Browsertext; im schmalen Fenster ist
der Inhalt scrollbar, während der Start-Hinweis sichtbar bleibt.

## Feedback und Ideen

Unter der Spielfläche ist die GitHub-Issue-Auswahl dauerhaft per Link erreichbar,
auch während Einführung oder Ergebnis. Sie öffnet in einem neuen Tab und ersetzt
die Spielseite nicht. Für Beiträge ist ein GitHub-Konto erforderlich.
Fokusverlust pausiert die Runde nach derselben Regel wie andere Tabwechsel.
Solange ein Link oder anderes interaktives HTML-Element Tastaturfokus hat,
werden Spieltasten verworfen und gehaltene Eingaben gelöst. Enter bedient
den Link regulär; nach der Rückkehr ins Zimmer geht die Runde weiter.

## Ein Hauptziel: Pixels Lieblingsball

Pixel will spielen: Auf dem obersten Regal ganz rechts liegt ein goldener Ball
mit Sternmarkierung. Ein eigener Zielkasten auf der Startseite erklärt Position,
Kontaktzeit und vorzeitige Heimkehr aus derselben Raumdefinition. Erreiche ihn über den Vorhang und bleib auf seiner Auflage
**1,2 Sekunden ohne Eingabe** stehen. Weglaufen, Springen oder Klettern bricht
die Interaktion ab und setzt den Teilfortschritt zurück. Ein kurzer Hinweis
zeigt Ziel und Fortschritt; es gibt genau ein Ziel und keine Bedürfnisbalken.

Zielerreichung beendet die Chaosphase sofort. Verstreicht vorher der vorhandene
Timer, endet sie mit „Ziel nicht erreicht“. Beide Wege verwenden denselben
Heimkehr-/Reaktions-/Versöhnungsablauf und frieren denselben finalen Score ein.
Pro Runde wird genau ein Abschluss akzeptiert. Werden Ziel und Deadline im
selben Simulationsframe beobachtet, gewinnt deterministisch die Deadline.
Ein früheres Ziel bleibt auch nach dem späteren Timerende der einzige Trigger.

Das Ziel ist in beiden handgebauten Räumen ohne Sachschaden erreichbar. Bewegung
und vorhandene Chaosaktionen bleiben frei; die Ballinteraktion vergibt keine Punkte.
Der Ergebnisbildschirm führt „Hauptziel: Erreicht/Nicht erreicht“ unabhängig
von Chaospunkten und Versöhnung auf. Fokus-/Tabpause hält auch den Zielkontakt
an; R stellt Ziel, Fortschritt, Uhr und Ergebnis vollständig zurück.

Die feste Raumdefinition enthält Ziel-ID, Spielzeugtyp, Bezeichnung, Motivation,
Auflage, X-Position und Interaktionsdauer. Weitere Zieltypen, wechselnde Bedürfnisse,
Zufallsauswahl und ein atmosphärischer Zeitsprung sind spätere Erweiterungen.
