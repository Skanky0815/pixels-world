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

Du brauchst eine Tastatur und einen aktuellen Desktop-Browser.
Das Spiel läuft ohne Konto und ohne Backend.
Den aktuellen Versionsstand findest du unter [Releases](https://github.com/Skanky0815/pixels-world/releases).

## Spielidee

Du spielst Pixel, einen neugierigen Tigerkater allein in Saras Wohnzimmer.
Spring auf Möbel, klettere am Vorhang und entdecke, wie viel Unsinn in ein Zimmer passt.
Vasen zerbrechen, das Sofa bekommt Kratzer und selbst das Katzengras bleibt nicht verschont.

Der spielbare Prototyp bietet Bewegung, automatische Katzenaktionen und Chaospunkte.
Nach 60–105 Sekunden aktiver Spielzeit kommt Sara zurück und beendet die Chaosphase.
Grobe Zeithinweise ersetzen einen genauen Countdown; bei Fokusverlust pausiert das Spiel.
Sara tritt mit vorläufiger Grafik ein, reagiert auf den finalen Chaosstand und kommentiert
das Zimmer. Danach folgt ein sichtbarer Platzhalter für die spätere Versöhnungsphase.

Die warme, herbstliche Wohnung nutzt einfache Platzhaltergrafik und Pixels bestätigtes Sprite-Sheet.
Die komplette Spielfläche passt sich dem Browserfenster an.

## Steuerung

| Taste     | Aktion                                               |
| --------- | ---------------------------------------------------- |
| ← / →     | Laufen und in der Luft steuern                       |
| Leertaste | Springen; am Vorhang abspringen                      |
| ↑ / ↓     | Vorhang greifen und hinauf-/hinabklettern            |
| R         | Gesamtes Zimmer samt Schäden und Punkten neu starten |

Klicke zuerst ins Zimmer, damit es Tastatureingaben erhält.
Beim Anspringen greift Pixel den Vorhang automatisch; ohne Klettereingabe rutscht er langsam ab.
Am Sofa oder Katzengras kurz stehen bleiben: Pixel wird von selbst aktiv.
Weglaufen oder Springen unterbricht die Bodenaktionen.

Mehr dazu: [Spielmechaniken und Punkte](docs/gameplay.md).

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
