import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

const parts = ['header', 'footer'].map((name) => ({
  marker: `<!-- GAME_${name.toUpperCase()} -->`,
  path: fileURLToPath(new URL(`../src/ui/game-shell/${name}.html`, import.meta.url)),
}));

/** Native HTML components preserve static links and the existing direct-child layout. */
// eslint-disable-next-line max-lines-per-function -- Zusammengehörige Vite-Hooks liefern und aktualisieren dieselben zwei statischen Komponenten.
export function gameShell(): Plugin {
  return {
    name: 'game-shell',
    transformIndexHtml(html, context) {
      if (!context.filename.endsWith('/play.html')) return html;

      return parts.reduce(
        (page, part) => page.replace(part.marker, readFileSync(part.path, 'utf8')),
        html,
      );
    },
    configureServer(server) {
      server.watcher.add(parts.map((part) => part.path));
    },
    handleHotUpdate({ file, server }) {
      if (!parts.some((part) => part.path === file)) return;
      server.ws.send({ type: 'full-reload' });

      return [];
    },
  };
}
