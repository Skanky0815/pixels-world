![Pixel’s World – Pixel wirft in einem gemütlichen herbstlichen Wohnzimmer eine Vase vom Regal](assets/banner.png)

**Ein Zimmer. Eine Katze. Absolut kein Respekt vor Schwerkraft oder teuren Vasen.**

*Eine gemütliche Pixel-Art-Sandbox über eine kleine Katze und ein ziemlich großes Chaos.*

## Die Idee

Spiele **Pixel**, einen neugierigen, frechen Kater, der allein in Saras Wohnung ist. Erkunde das Zimmer, springe auf Möbel, klettere an Vorhängen und wirf Dinge um. Im Mittelpunkt stehen Bewegung, spielerische Physik und eine Umgebung, die auf Pixel reagiert.

Sara soll später zu einem unvorhersehbaren Zeitpunkt heimkommen und das Chaos entdecken. Wie verärgert sie ist, hängt vom Schaden ab. Pixel hat dann kurz Zeit, sie mit Schnurren, Kuscheln und Köpfchengeben zu versöhnen. Je ruhiger Sara am Ende ist, desto mehr Leckerlis bekommt Pixel.

**Designrichtung:** zuerst die Physik-Sandbox, später Punkte und Versöhnung. Sockenverstecken war die ursprüngliche Idee und bleibt eine optionale spätere Mechanik.

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

Klettern soll langsamer und kontrollierter sein als Springen. Automatisches Greifen beim Sprung gegen eine Kletterfläche ist für die weitere Bewegungsentwicklung vorgesehen; im aktuellen Raumprototyp erfolgt das Greifen bewusst mit ↑ oder ↓.

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
- [ ] Vollständige Pfeiltasten- und Leertastensteuerung
- [ ] Vollständige Bewegung mit Schwerkraft, Kollisionen, Klettern, Greifen und Absprung
- [ ] Interaktive Vase mit Fall- und Bruchverhalten

Für den ersten Prototyp brauchen wir weder Saras Rückkehr noch Ärgeranzeige, Leckerlis, eine vollständige Runde oder Benutzerkonten. Zunächst soll es Spaß machen, sich zu bewegen und Unordnung zu stiften.

## Projektstatus

**Wohnzimmerprototyp umgesetzt (Issue #1).** Der Raum verwendet geometrische Platzhalter, einen festen Boden, Sofa- und Regalplattformen sowie einen markierten kletterbaren Vorhang. Die Kamera zeigt den ganzen Raum mit 960×540 logischen Pixeln und skaliert ihn passend zum Browser. Zur Laufzeit sind weder Backend noch Konten oder externe Grafikdownloads nötig. Vaseninteraktionen und vollständige Sprite-Animationen folgen später.

## Lokal starten

Voraussetzung: Node.js 22.12+ oder eine unterstützte neuere LTS-Version sowie npm.

```sh
npm ci
npm run dev
```

Die von Vite ausgegebene lokale Adresse öffnen, üblicherweise http://127.0.0.1:5173. Eine Tastatur ist erforderlich; Touch-Steuerung ist noch nicht enthalten.

- **← / →:** bewegen.
- **Leertaste:** springen; eine Richtung halten, um sich im Sprung zu bewegen. Vor der Sofakante abspringen, um über die feste Seite zu kommen.
- **↑ / ↓ am markierten Vorhang:** greifen und klettern. Loslassen zum Hängenbleiben, seitlich die Fläche verlassen oder mit Leertaste abspringen – standardmäßig nach links, sonst in die gehaltene Richtung.
- **R:** Pixel auf die Startposition am Boden zurücksetzen.

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
6. Browsergröße ändern: Der gesamte Raum bleibt im ursprünglichen Seitenverhältnis sichtbar.

## Qualitätsprüfungen

```sh
npm run lint       # ESLint mit TypeScript-Regeln; Warnungen führen zum Fehler
npm run typecheck  # Strenge TypeScript-Prüfung
npm run qa         # Lint, Typprüfung und Produktionsbuild
```

GitHub Actions führt diese Prüfungen für jeden Pull Request und jeden Push nach `main` aus; ein manueller Start ist ebenfalls möglich. CI installiert mit `npm ci` aus dem Lockfile auf Node.js 22. Der manuelle Spieltest ergänzt die statischen Prüfungen. Automatisierte Playwright-Tests sind in [Issue #13](https://github.com/Skanky0815/pixels-world/issues/13) geplant.

## Beiträge

Sprache, Commits und Review-Ablauf sind in [CONTRIBUTING.md](CONTRIBUTING.md) beschrieben. Die Arbeitsregeln für Agenten stehen in [AGENTS.md](AGENTS.md).

## Versionierung

Startversion ist `0.1.0`. Release Please bereitet aus Conventional Commits einen Versions-PR samt Changelog vor. Nach Review, Merge und erneuter QA wird ein GitHub Release mit Tag `vX.Y.Z` bewusst veröffentlicht. Der Ablauf steht unter [Versionierung und Releases](CONTRIBUTING.md#versionierung-und-releases). Ein Eintrag in `package.json` allein bedeutet noch keinen veröffentlichten Release.
