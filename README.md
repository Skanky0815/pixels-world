![Pixel’s World – Pixel wirft in einem gemütlichen herbstlichen Wohnzimmer eine Vase vom Regal](assets/banner.png)

# Pixel’s World

[![QA auf main](https://github.com/Skanky0815/pixels-world/actions/workflows/qa.yml/badge.svg?branch=main&event=push)](https://github.com/Skanky0815/pixels-world/actions/workflows/qa.yml) [![Status – Spielbarer Prototyp](https://img.shields.io/badge/Status-Spielbarer_Prototyp-C49464)](#projektstatus) [![Veröffentlichte Spielversion](https://img.shields.io/github/v/release/Skanky0815/pixels-world?label=Release&color=58b879)](https://github.com/Skanky0815/pixels-world/releases)

[![Phaser 3 – Spielengine](https://img.shields.io/badge/Phaser_3-Spielengine-A5654E)](https://phaser.io/) [![TypeScript – Sprache](https://img.shields.io/badge/TypeScript-Sprache-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Vite – Build](https://img.shields.io/badge/Vite-Build-646CFF?logo=vite&logoColor=white)](https://vite.dev/) [![Node.js – Entwicklungswerkzeuge](https://img.shields.io/badge/Node.js-Entwicklungswerkzeuge-417E38?logo=nodedotjs&logoColor=white)](#lokal-starten)

Die QA-Plakette zeigt den letzten Push auf `main`; die Release-Plakette zeigt veröffentlichte GitHub Releases. Das Spiel läuft im Browser, Node.js wird für die Entwicklungswerkzeuge benötigt.

**Ein Zimmer. Eine Katze. Absolut kein Respekt vor Schwerkraft oder teuren Vasen.**

*Eine gemütliche Pixel-Art-Sandbox über eine kleine Katze und ein ziemlich großes Chaos.*

## Die Idee

Spiele **Pixel**, einen neugierigen, frechen Kater, der allein in Saras Wohnung ist. Erkunde das Zimmer, springe auf Möbel, klettere an Vorhängen und wirf Dinge um. Im Mittelpunkt stehen Bewegung, spielerische Physik und eine Umgebung, die auf Pixel reagiert.

Sara soll später zu einem unvorhersehbaren Zeitpunkt heimkommen und das Chaos entdecken. Wie verärgert sie ist, hängt vom Schaden ab. Pixel hat dann kurz Zeit, sie mit Schnurren, Kuscheln und Köpfchengeben zu versöhnen. Je ruhiger Sara am Ende ist, desto mehr Leckerlis bekommt Pixel.

**Designrichtung:** zuerst Bewegung, Physik und Chaospunkte als Grundlage für Saras Ärger; danach Rundenablauf und Versöhnung. Grafik und Animationen folgen dem spielbaren Kern. Sockenverstecken war die ursprüngliche Idee und bleibt eine optionale spätere Mechanik.

## Geplanter Spielablauf

1. **Allein zu Hause:** erkunden, springen, klettern und Unsinn machen.
2. **Sara kommt heim:** eine unvorhersehbare Ankunft beendet die Chaosphase.
3. **Wiedergutmachen:** schnurren, kuscheln und Sara um die Pfote wickeln.
4. **Leckerlis:** die Belohnung hängt davon ab, wie verärgert Sara noch ist.

## Interaktionen als Ideen

| Aktion | Reaktion der Umgebung |
| --- | --- |
| Vase schubsen | Sie kippt, fällt und zerbricht beim Aufprall |
| Sofa oder Tapete kratzen | Sichtbare Kratzer |
| Vorhang hochklettern | Der Stoff reagiert; vielleicht fällt der Vorhang herunter |
| Bücher vom Regal schubsen | Bücher fallen und verteilen sich |
| Wassernapf umkippen | Eine Pfütze entsteht |
| Durch Wasser laufen | Nasse Pfotenabdrücke bleiben zurück |

## Steuerung und Bewegungsrichtung

| Eingabe | Aktion |
| --- | --- |
| ← / → | Bewegen |
| ↑ / ↓ | An einer Kletterfläche auf- und absteigen |
| ↓ am Boden | Ducken, später optional |
| Leertaste | Springen |
| Leertaste + ← / → | Richtung beim Sprung steuern |
| Leertaste beim Klettern | Von der Fläche abspringen |

Klettern ist langsamer als Springen. Beim Anspringen greift Pixel den Vorhang automatisch; ↑ oder ↓ greift auch bewusst. Nach dem Absprung muss Pixel die Kletterfläche verlassen, bevor er sie erneut automatisch greifen kann. Plattformkollisionen bleiben beim Klettern aktiv. Sprünge behalten ihren horizontalen Schwung, Richtungstasten erlauben begrenzte Luftsteuerung.

## Visuelle Richtung

- Gemütliche **2D-Seitenansicht in Pixel-Art** mit warmer, leicht herbstlicher Wohnungspalette.
- **32×32 px** als bevorzugter Ausgangspunkt für Pixels Sprite, keine feste Bildschirmauflösung oder Farbtiefe.
- Pixel ist ein kurzhaariger braun-grauer Tigerkater mit dunklen Streifen, einem M auf der Stirn, heller Schnauze, gelbgrünen Augen und geringeltem Schwanz.
- Geplante Animationen: stehen, laufen, springen/landen, **Klettern in Rückansicht**, schleichen, schubsen, kratzen, schnurren, kuscheln und Köpfchengeben.
- Frame-Anzahl und endgültige Asset-Größen müssen noch erprobt werden.

## Technik

| Bereich | Wahl |
| --- | --- |
| Sprache | TypeScript |
| Engine | Phaser 3 |
| Plattform | Webbrowser |
| Darstellung | 2D-Pixel-Art mit fester logischer Auflösung |
| Physik | Zunächst Arcade-Kollisionen; komplexeres Objektverhalten bei Bedarf |
| Backend und Konten | Für den Prototyp nicht erforderlich |

Der Raumprototyp verwendet Phaser 3, TypeScript und Vite. Weitere Spielsysteme sind geplant.

## Erster spielbarer Prototyp

**Ziel:** Pixel kann vom Boden aufs Sofa springen, zum Regal klettern und eine Vase herunterstoßen, die fällt und zerbricht.

- [x] Spielbarer Raum mit Boden, Sofa, Regalen, Vorhang und Plattformen
- [ ] Pixel-Sprite mit grundlegenden Stand-, Lauf-, Sprung- und Kletteranimationen
- [x] Pfeiltasten- und Leertastensteuerung, ohne optionales Ducken
- [x] Bewegung mit Schwerkraft, Kollisionen, Sprungschwung, Klettern, automatischem Greifen und Absprung
- [x] Interaktive Vasen mit Fall- und Bruchverhalten
- [x] Chaospunkte und konfigurierbare Ärger-Vorschau

Der spielbare Kern umfasst jetzt Bewegung, Zerstörung und Punkte. Saras tatsächliche Rückkehr, Versöhnung, Leckerlis und eine vollständige Runde folgen später; Benutzerkonten sind nicht erforderlich.

## Projektstatus

**Spielbare Chaos-Sandbox mit Platzhaltern.** Der Raum verwendet geometrische Platzhalter, einen festen Boden, Sofa- und Regalplattformen sowie einen markierten kletterbaren Vorhang. Die Kamera zeigt den ganzen Raum mit 960×540 logischen Pixeln und skaliert ihn passend zum Browser. Zur Laufzeit sind weder Backend noch Konten oder externe Grafikdownloads nötig. Drei Vasen lassen sich durch Kontakt anschubsen und zerbrechen beim Bodenaufprall. Vollständige Sprite-Animationen, Saras Heimkehr und der Rundenablauf folgen später. Der [Issue-Abgleich](docs/gameplay-status.md) unterscheidet bereits gemergte Grundlagen und den aktuellen Gameplay-PR.

## Lokal starten

Voraussetzung: Node.js 22.12+ oder eine unterstützte neuere LTS-Version sowie npm.

```sh
npm ci
npm run dev
```

Die von Vite ausgegebene lokale Adresse öffnen, üblicherweise http://127.0.0.1:5173. Eine Tastatur ist erforderlich; Touch-Steuerung ist noch nicht enthalten.

- **← / →:** bewegen.
- **Leertaste:** springen; horizontaler Schwung bleibt beim Loslassen erhalten. Richtungstasten steuern in der Luft begrenzt nach. Vor der Sofakante abspringen, um über die feste Seite zu kommen.
- **↑ / ↓ am markierten Vorhang:** greifen und klettern; Anspringen greift automatisch. Loslassen zum Hängenbleiben, seitlich die Fläche verlassen oder mit Leertaste abspringen – standardmäßig nach links, sonst in die gehaltene Richtung.
- **R:** Durchlauf neu starten: Pixel, sämtliche Vasen, Splitter und Punkte zurücksetzen.

Bücher, Pflanze, Sofalehne und Bild sind Dekoration. Die Sitzfläche und Regalbretter bilden die festen Möbelplattformen.

## Build und Vorschau

```sh
npm run build
npm run preview
```

Der Build prüft TypeScript und erzeugt die statische Website unter `dist/`. Phaser wird lokal gebündelt; Vite kann wegen der Engine einen Hinweis zur Bundle-Größe ausgeben.

## Manueller Spieltest

1. Lokal starten: Der gesamte Raum, Pixel, Sofa, Regale und der markierte Vorhang sind sichtbar.
2. Links und rechts laufen: Boden und Raumgrenzen halten Pixel auf.
3. Von der Startposition nach rechts aufs Sofa springen. Zur rechten Kante laufen und auf das erste Regal springen; danach das nächste Regal erreichen. Pixel landet auf den sichtbaren Flächen.
4. Am Vorhang ↑ halten: Pixel klettert. Loslassen zum Hängenbleiben, ↓ zum Absteigen und Leertaste mit einer Richtung zum Abspringen. Nach dem Verlassen wirkt wieder Schwerkraft.
5. Auf einer Plattform oder beim Klettern R drücken: Pixel kehrt zur Startposition zurück.
6. Die erste Vase auf dem Regal von links anschubsen. Beim Kontakt bleiben die Punkte unverändert; erst der Bodenaufprall liefert 25 Punkte und sichtbare Splitter. Warten/erneutes Berühren zählt nicht nochmals.
7. Am Vorhang zur zweiten Vase klettern und sie nach links vom Regal schieben. Nach deren Bruch zeigt das HUD insgesamt 60 Punkte und die wütende Vorschau.
8. R drücken: alle Vasen stehen wieder, Splitter verschwinden und Punkte/Ärger-Vorschau sind zurückgesetzt.
9. Browsergröße ändern: Der gesamte Raum bleibt im ursprünglichen Seitenverhältnis sichtbar.

## Qualitätsprüfungen

```sh
npm run lint       # ESLint mit TypeScript-Regeln; Warnungen führen zum Fehler
npm run typecheck  # Strenge TypeScript-Prüfung
npm run test:unit  # Punkte, Doppeltzählung, Reset und Ärgerschwellen
npm run qa         # Lint, Unit-Tests, Typprüfung und Produktionsbuild
```

GitHub Actions führt diese Prüfungen für jeden Pull Request und jeden Push nach `main` aus; ein manueller Start ist ebenfalls möglich. CI installiert mit `npm ci` aus dem Lockfile auf Node.js 22. Der manuelle Spieltest ergänzt die statischen Prüfungen. Der separate CI-Job **Playwright (Chromium)** prüft Start und Rendering, Tastaturbewegung, Boden/Raumgrenze, Sofa-/Regalsprünge, Vorhangklettern mit Absprung, Reset und einen kleinen Viewport. Zusätzliche Gameplay-Tests prüfen Sprungschwung, automatisches Greifen, Kletterkollisionen, fallende Vasen, einmalige Punktevergabe, Ärgerstufen und vollständigen Reset. Außerdem prüft er, dass der Produktionsbuild keine Test-Schnittstelle enthält.

## Beiträge

Sprache, Commits und Review-Ablauf sind in [CONTRIBUTING.md](CONTRIBUTING.md) beschrieben. Die Arbeitsregeln für Agenten stehen in [AGENTS.md](AGENTS.md).

## Versionierung

Startversion ist `0.1.0`. Release Please bereitet aus Conventional Commits einen Versions-PR samt Changelog vor. Nach Review, Merge und erneuter QA wird ein GitHub Release mit Tag `vX.Y.Z` bewusst veröffentlicht. Der Ablauf steht unter [Versionierung und Releases](CONTRIBUTING.md#versionierung-und-releases). Ein Eintrag in `package.json` allein bedeutet noch keinen veröffentlichten Release.


## End-to-End-Tests

```sh
npm ci
npx playwright install chromium
npm run test:e2e
```

Playwright baut und startet selbst zwei lokale Vorschauen auf den Ports **4174** (E2E-Build) und **4175** (Produktionsbuild). Die Ports müssen frei sein; ein vorhandener Server wird nicht übernommen. Der normale Entwicklungsserver auf 5173 bleibt davon unabhängig. Die Suite verwendet echte Tastatureingaben; sie setzt keine Spielfigurenpositionen.

```sh
npm run test:e2e -- --repeat-each=3  # Stabilitätsprüfung ohne automatische Retries
npm run test:e2e:debug              # Sichtbarer Browser und Playwright Inspector
npm run test:e2e:report             # Letzten HTML-Bericht öffnen
```

Auf Linux bei Bedarf einmal `npx playwright install --with-deps chromium` ausführen. CI führt jeden Test zweimal ohne automatische Retries aus, installiert Chromium samt Systemabhängigkeiten und speichert den HTML-Bericht sowie Screenshots/Traces fehlgeschlagener Tests für 14 Tage als `playwright-results`. Ein Trace lässt sich mit `npx playwright show-trace <pfad-zur-trace.zip>` öffnen. Tests laufen isoliert mit einem Worker und geben Tasten im Cleanup frei. Playwrights Browser-Uhr ist vor dem Laden installiert und pausiert; zwischen Zustandsabfragen werden Timer und Animationen in kleinen Simulationsschritten weitergeführt. So verlängert die Antwortzeit eines langsamen CI-Runners keine Tastatureingaben. Abbruchgrenzen und tolerante Ergebnisprüfungen ersetzen feste Echtzeitpausen und exakte Frame-Positionen.

Nur `vite build --mode e2e` enthält die lesbare, unveränderliche Beobachtungsschnittstelle `window.__pixelTest`. Sie liefert Bereitschaft, Szene, Frame, Kamera und Pixels Bewegungszustand als eingefrorene Kopien, ohne Mutatoren oder Phaser-Objekte. `npm run build` entfernt den gesamten Beobachter durch Vites Modusauswertung; ein eigener Test prüft den ausgelieferten Produktionscode darauf. Der manuelle Spieltest bleibt für das Spielgefühl sinnvoll; Cross-Browser- und pixelgenaue Screenshot-Tests sind noch nicht enthalten.


## Chaospunkte und Ärger-Vorschau

| Objekt | Punkte beim Bodenbruch |
| --- | ---: |
| Kleine Vase auf dem ersten Regal | 25 |
| Blaue Vase auf dem mittleren Regal | 35 |
| Erbstück auf dem oberen Regal | 40 |

Die HUD-Vorschau für Saras Ärger ist **entspannt** unter 25 Punkten, **genervt** ab 25 und **wütend** ab 60. Die Leiste reicht bis zu den insgesamt möglichen 118 Punkten: 100 für Vasen und 18 für Sofakratzer. Werte und Schwellen stehen in [src/chaos.ts](src/chaos.ts). Berührung, Anschubsen und ein Zwischenstopp auf einem anderen Regal zählen noch nicht als Schaden. Jedes Objekt zählt erst beim tatsächlichen Bodenbruch und höchstens einmal pro Durchlauf.

Die Vasen verwenden dieselbe Arcade-Physik wie Pixel. Nach einem seitlichen Anschubser gleiten sie über die Kante, fallen mit Schwerkraft und zeigen beim Bodenaufprall einfache Splitter. Die sichtbare Drehung ist Platzhalterfeedback; es gibt noch keine vollständige Starrkörper-/Stoffsimulation. Mehrere Vasen dienen dem Test der Punktebereiche; Bücher und Pflanze bleiben Dekoration. Weitere Objektarten gehören zu #11.

Der HUD-Ausblick ist noch keine heimgekehrte oder tatsächlich reagierende Sara. Timer/Heimkehr (#6), Saras Reaktion und Phasenwechsel (#8), Versöhnung (#9) sowie die vollständige Ergebnisrunde (#10) bleiben eigenständige nächste Schritte. Animationen und Feinschliff (#2) folgen nach dem Gameplay-Kern.


## Automatisches Sofakratzen (Phase 1)

Bleibt Pixel etwa **zwei Sekunden** am Sofa stehen, beginnt sie ohne Aktionstaste zu kratzen. Das funktioniert am Boden vor dem Sofa und auf seiner Sitzfläche. Zwei Platzhalter-Frames und bewegte Pfoten zeigen das Kratzen; alle **750 ms** kommt eine sichtbare Spur hinzu. Pro Durchlauf sind höchstens **sechs Schadensstufen** möglich.

Bewegen oder Springen beendet die Aktion sofort. Vorhandene Kratzer bleiben, beim erneuten Stillstehen läuft die volle Wartezeit von vorn. **R** entfernt die Kratzer und setzt Interaktion und Ereigniszähler zurück. Reichweite, Wartezeit, Intervall, Schadensgrenze und Ereigniswert stehen in [src/couch-scratching.ts](src/couch-scratching.ts).

Jede neue Spur emittiert über die Phaser-Szene ein unveränderliches `object-damaged`-Ereignis mit `objectId: couch`, `kind: scratch`, Schadensstufe und `value: 3`. Das vorhandene Scoring zählt jede neue Kratzstufe einmal: **3 Punkte je Stufe, höchstens 18 pro Durchlauf**. Wiederholtes Ausgeben derselben Stufe kann keine zusätzlichen Punkte erzeugen. Das Sofa zählt als ein beschädigtes Objekt; die Vasen behalten ihre bisherigen Werte. R setzt sowohl Kratzschaden als auch Punkte zurück.

Zum manuellen Prüfen am Boden auf Höhe des Sofas anhalten: vor zwei Sekunden kein Kratzen, danach Animation und schrittweise Spuren. Weglaufen oder springen beendet die Animation; R entfernt den Schaden. Unit- und E2E-Tests prüfen Verzögerung, Intervalle, Abbruch, Animation, Schadensgrenze und Neustart.
