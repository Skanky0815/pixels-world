![Pixel’s World – Pixel wirft eine Vase vom Regal](assets/banner.png)

# Pixel’s World

[![QA auf main](https://github.com/Skanky0815/pixels-world/actions/workflows/qa.yml/badge.svg?branch=main&event=push)](https://github.com/Skanky0815/pixels-world/actions/workflows/qa.yml)
[![Veröffentlichte Spielversion](https://img.shields.io/github/v/release/Skanky0815/pixels-world?label=Release&color=58b879)](https://github.com/Skanky0815/pixels-world/releases)

[![Phaser 3 – Spielengine](https://img.shields.io/badge/Phaser_3-Spielengine-A5654E)](https://phaser.io/) [![TypeScript – Sprache](https://img.shields.io/badge/TypeScript-Sprache-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Vite – Build](https://img.shields.io/badge/Vite-Build-646CFF?logo=vite&logoColor=white)](https://vite.dev/) [![Node.js – Entwicklungswerkzeuge](https://img.shields.io/badge/Node.js-Entwicklungswerkzeuge-417E38?logo=nodedotjs&logoColor=white)](#lokal-starten)

**Ein Zimmer. Eine Katze. Absolut kein Respekt vor Schwerkraft oder teuren Vasen.**

Eine gemütliche Pixel-Art-Sandbox über Pixel, Sara und ein ziemlich großes Chaos –
direkt im Browser, ohne Konto oder Backend.

**[Landingpage](https://skanky0815.github.io/pixels-world/)** ·
**[Jetzt spielen](https://skanky0815.github.io/pixels-world/play.html)** ·
[Releases](https://github.com/Skanky0815/pixels-world/releases) ·
[Repository](https://github.com/Skanky0815/pixels-world)

Spielvorstellung und App-Installation stehen auf der Landingpage.
Die Einführung im Spiel erklärt Ziel und Bedienung.

## Lokal starten

Voraussetzung: **Node.js 22.12+** oder eine unterstützte neuere LTS-Version und npm.

```sh
npm ci
npm run dev
```

Öffne die von Vite ausgegebene Adresse, üblicherweise `http://127.0.0.1:5173`.
Unter `/` liegt die Landingpage, unter `/play.html` das Spiel.
Weitere Befehle und DEV-Werkzeuge: [Lokal entwickeln](docs/development.md).

## Steuerung

**← / →** bewegen Pixel, **Leertaste** springt oder bestätigt Texte,
**↑ / ↓** klettern am Vorhang. **Esc** öffnet das Pause-Menü.
Auf Touch-Geräten erscheinen Bildschirmtasten; die Tastatur bleibt zusätzlich nutzbar.

## Entwickeln und mitmachen

Pixel’s World verwendet **Phaser 3, TypeScript und Vite**; Darstellung und Physik laufen im Browser.
Aufgaben, Fehlerberichte und Planung stehen in [Issues](https://github.com/Skanky0815/pixels-world/issues)
und [Milestones](https://github.com/Skanky0815/pixels-world/milestones).

- [Beitragsregeln und Arbeitsablauf](CONTRIBUTING.md)
- [Qualitätsprüfungen und manueller Spieltest](docs/qa.md)
- [Gameplay-Architektur](docs/architecture/gameplay.md)
- [Räume, Objektvorlagen und Assets](src/content/README.md)
- [Release und GitHub Pages](docs/deployment.md)
- [Arbeitsregeln für Agenten](AGENTS.md)
