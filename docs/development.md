# Lokal entwickeln

Node.js 22.12+ oder eine unterstützte neuere LTS-Version und npm werden benötigt.

## Entwicklungsserver

```sh
npm ci
npm run dev
```

Die von Vite ausgegebene lokale Adresse öffnen, üblicherweise http://127.0.0.1:5173. Eine Tastatur ist erforderlich; Touch-Steuerung ist noch nicht enthalten.

- **← / →:** bewegen.
- **Leertaste:** springen; horizontaler Schwung bleibt beim Loslassen erhalten. Richtungstasten steuern in der Luft begrenzt nach. Vor der Sofakante abspringen, um über die feste Seite zu kommen.
- **↑ / ↓ am markierten Vorhang:** greifen und klettern; Anspringen greift automatisch. Ohne ↑ rutscht Pixel langsam hinunter; ↓ beschleunigt den Abstieg. Seitlich die Fläche verlassen oder mit Leertaste abspringen – standardmäßig nach links, sonst in die gehaltene Richtung.
- **R:** Phaser-Szene vollständig neu starten: Pixel, sämtliche Vasen, Sofakratzer, Vorhangrisse, Pflanze, Splitter und Punkte zurücksetzen.

Bücher, Sofalehne und Bild sind Dekoration. Der Katzengrastopf links ist interaktiv: kurz daneben stehen bleiben, um zu knabbern; Weglaufen oder Springen verhindert das spätere Umkippen. Die Sitzfläche und Regalbretter bilden die festen Möbelplattformen.

## Build und Vorschau

```sh
npm run build
npm run preview
```

Der Build prüft TypeScript und erzeugt die statische Website unter `dist/`. Phaser wird lokal gebündelt; Vite kann wegen der Engine einen Hinweis zur Bundle-Größe ausgeben.

## Weiterführend

- [Qualitätsprüfungen und manueller Spieltest](qa.md)
- [Spielmechaniken und Animationen](gameplay.md)
- [Räume und Assets](../src/content/README.md)
- [Architektur](architecture/gameplay.md)
- [Beiträge und Versionsreleases](../CONTRIBUTING.md)
