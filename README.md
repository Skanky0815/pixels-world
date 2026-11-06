![Pixel’s World – Pixel wirft eine Vase vom Regal](assets/banner.png)

# Pixel’s World

[![QA auf main](https://github.com/Skanky0815/pixels-world/actions/workflows/qa.yml/badge.svg?branch=main&event=push)](https://github.com/Skanky0815/pixels-world/actions/workflows/qa.yml)
[![Status – Spielbarer Prototyp](https://img.shields.io/badge/Status-Spielbarer_Prototyp-C49464)](#spielidee)
[![Veröffentlichte Spielversion](https://img.shields.io/github/v/release/Skanky0815/pixels-world?label=Release&color=58b879)](https://github.com/Skanky0815/pixels-world/releases)

[![Phaser 3 – Spielengine](https://img.shields.io/badge/Phaser_3-Spielengine-A5654E)](https://phaser.io/) [![TypeScript – Sprache](https://img.shields.io/badge/TypeScript-Sprache-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Vite – Build](https://img.shields.io/badge/Vite-Build-646CFF?logo=vite&logoColor=white)](https://vite.dev/) [![Node.js – Entwicklungswerkzeuge](https://img.shields.io/badge/Node.js-Entwicklungswerkzeuge-417E38?logo=nodedotjs&logoColor=white)](#lokal-starten)

**Ein Zimmer. Eine Katze. Absolut kein Respekt vor Schwerkraft oder teuren Vasen.**

Eine gemütliche Pixel-Art-Sandbox über eine kleine Katze und ein ziemlich großes Chaos.

## Jetzt spielen

**[Pixel’s World im Browser öffnen →](https://skanky0815.github.io/pixels-world/)**

Du brauchst einen aktuellen Browser. Am Desktop spielst du mit Tastatur; auf Geräten
mit grobem Zeiger (Touch) erscheint eine zusätzliche Bildschirmsteuerung.
Das Spiel läuft ohne Konto und ohne Backend. Über die Sprachwahl im Kopfbereich
spielst du auf Deutsch oder Englisch. Nur diese Einstellung bleibt lokal im
Browser gespeichert; ein Sprachwechsel erhält die laufende Runde.
Den aktuellen Versionsstand findest du unter [Releases](https://github.com/Skanky0815/pixels-world/releases).

## Spielidee

Du spielst Pixel, einen neugierigen Tigerkater allein in Saras Wohnzimmer.
Spring auf Möbel, klettere am Vorhang und entdecke, wie viel Unsinn in ein Zimmer passt.
Vasen zerbrechen, das Sofa bekommt Kratzer und selbst das Katzengras bleibt nicht verschont.

Der spielbare Prototyp bietet Bewegung, automatische Katzenaktionen und Chaospunkte.
Pixel möchte seinen Lieblingsball auf dem obersten Regal erreichen. Bleib dort kurz
stehen, um mit ihm zu spielen: Das holt Sara vorzeitig nach Hause. Sonst kommt sie
nach 60–105 Sekunden aktiver Spielzeit zurück und beendet die Chaosphase.
Der Ball ist auch ohne Schaden erreichbar; Chaos bleibt optional.
Grobe Zeithinweise ersetzen einen genauen Countdown; bei Fokusverlust pausiert das Spiel.
Sara tritt als animierte Chibi-Figur ein, reagiert auf den finalen Chaosstand und kommentiert
das Zimmer. Nach der Bestätigung per Leertaste versucht Pixel mit einer kurzen
Pfeiltastenfolge, Sara durch Schnurren und Anschmiegen zu versöhnen.
Die Ergebnisansicht fasst Chaospunkte, Saras ursprüngliche Reaktion und den
Versöhnungsausgang zusammen. Mit R beginnt die nächste Runde.

Die warme, herbstliche Wohnung nutzt einfache Platzhaltergrafik sowie Pixels und Saras Sprite-Sheets.
Die komplette Spielfläche passt sich dem Browserfenster an.

## Steuerung

| Taste     | Aktion                                                    |
| --------- | --------------------------------------------------------- |
| ← / →     | Laufen und in der Luft steuern                            |
| Leertaste | Springen; am Vorhang abspringen; Heimkehr-Text bestätigen |
| ↑ / ↓     | Vorhang greifen und hinauf-/hinabklettern                 |
| R         | Gesamtes Zimmer samt Schäden und Punkten neu starten      |

Während der Versöhnung: die jeweils angezeigte Pfeiltaste rechtzeitig neu drücken.
Anleitung und Saras Sprüche kannst du in Ruhe lesen und mit Leertaste bestätigen.
Je nach Chaos benötigt Sara ein, zwei oder drei Herzen.
Eine erfolgreiche Folge füllt die Herzleiste; pro Herz hast du zwei Versuche. Danach kann die Versöhnung auch scheitern.
R startet auch während dieser Phase neu.

Beim Laden erscheint die Einführung mit dem vorhandenen Spielbanner.
Klicke bei Bedarf ins Zimmer und drücke Leertaste, um die erste Runde zu starten.
Vorher bleiben Timer, Bewegung und Chaosaktionen angehalten. R startet nach dem
Spielbeginn direkt eine neue Runde; Neuladen zeigt die Einführung erneut.
Beim Anspringen greift Pixel den Vorhang automatisch; ohne Klettereingabe rutscht er langsam ab.
Am Sofa oder Katzengras kurz stehen bleiben: Pixel wird von selbst aktiv.
Weglaufen oder Springen unterbricht die Bodenaktionen.

Unter dem Spiel öffnet **Feedback & Ideen** die GitHub-Auswahl für Fehlerberichte
und Feature-Wünsche in einem neuen Tab. Für eigene Beiträge brauchst du ein GitHub-Konto.
[Impressum](impressum.html) und [Datenschutz](datenschutz.html) bleiben ebenfalls
über den Footer erreichbar und öffnen im selben Tab. Die Spielversion verlinkt
bei veröffentlichten Release-Builds die passenden Release-Notes in einem neuen
Tab; Entwicklungs- und normale Vorschaubuilds zeigen die Version ohne Link. „Zum Spiel“ führt zurück zur Einführung.

Mehr dazu: [Spielmechaniken und Punkte](docs/gameplay.md).

### Touch-Steuerung

Auf Touch-Geräten erscheinen vier Richtungstasten und
**Sprung** im Spiel bzw. **Weiter** bei Start und Lesepausen. Mehrere Finger
funktionieren gleichzeitig, etwa rechts laufen und springen. Weiter startet
die Runde, bestätigt Saras Texte und die
Versöhnungsanleitung; die Pfeile spielen auch die Charmeoffensive. Während der
laufenden Runde gibt es keinen Neustart-Button. Erst beim Ergebnis erscheint
**Neue Runde**. Der bestehende Tastaturkurzbefehl R bleibt verfügbar.

Ein Finger bleibt seiner Taste zugeordnet. Verlassen einer Taste, Abbruch,
Fokus-/Sichtbarkeitsverlust und Rotation lösen gehaltene Eingaben. Browsergesten
außerhalb der Buttons bleiben verfügbar. Tastatur und Touch können gemeinsam
verwendet werden; entgegengesetzte Richtungen sind neutral.

Die Eingabe ist in Chromium mit emuliertem Touch geprüft. Ein erster Praxistest auf iPhone/Safari war erfolgreich (#54). Eine vollständige
Geräteabnahme steht noch aus. Auf kompakten Touch-Geräten bleiben HUD und Dialoge
in CSS-Pixeln lesbar. Im Querformat liegt das Zimmer zwischen Richtungstasten links
und Aktionstasten rechts. Der Titel steht über dem Steuerkreuz, kompakte
Statusinfos über der Aktionstaste. Im Hochformat stehen die Buttons darunter. Die Einführung
und längere Dialoge haben ein eigenes Scrollfeld; der komplette Raum bleibt sichtbar.

## Lokal starten

Voraussetzung: **Node.js 22.12+** oder eine unterstützte neuere LTS-Version und npm.

```sh
npm ci
npm run dev
```

Öffne die ausgegebene lokale Adresse, üblicherweise `http://127.0.0.1:5173`.

Für Build, Vorschau und die Arbeitsansicht der Animationen:
[Lokal entwickeln](docs/development.md) und [Animationen vergleichen](docs/gameplay.md#animationen-direkt-vergleichen).

## Technik & Mitmachen

Pixel’s World verwendet **Phaser 3, TypeScript und Vite**.
Darstellung und Physik laufen vollständig im Browser; Assets werden lokal gebündelt.

Ideen, Fehlerberichte und Planung sammeln wir zentral auf GitHub:

- [Issues – Aufgaben und Wünsche](https://github.com/Skanky0815/pixels-world/issues)
- [Milestones – Phasen und Roadmap](https://github.com/Skanky0815/pixels-world/milestones)
- [Neues Issue erstellen](https://github.com/Skanky0815/pixels-world/issues/new/choose)

Für Beiträge und technische Details:

- [Beitragsregeln und Versionsreleases](CONTRIBUTING.md)
- [Qualitätsprüfungen und manueller Spieltest](docs/qa.md)
- [Gameplay-Architektur](docs/architecture/gameplay.md)
- [Räume, Objektvorlagen und Assets](src/content/README.md)
- [Veröffentlichung auf GitHub Pages](docs/deployment.md)
- [Arbeitsregeln für Agenten](AGENTS.md)
