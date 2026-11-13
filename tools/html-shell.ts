import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

/** Native HTML components preserve static links and the existing direct-child layout. */
// eslint-disable-next-line max-lines-per-function -- Zusammengehörige Vite-Hooks liefern und aktualisieren dieselben zwei statischen Komponenten.
export function htmlShell(name: 'game' | 'landing', pages: readonly string[]): Plugin {
  const parts = ['header', 'footer'].map((part) => ({
    marker: `<!-- ${name.toUpperCase()}_${part.toUpperCase()} -->`,
    path: fileURLToPath(new URL(`../src/ui/${name}-shell/${part}.html`, import.meta.url)),
  }));

  return {
    name: `${name}-shell`,
    transformIndexHtml(html, context) {
      if (!pages.some((page) => context.filename.endsWith(`/${page}.html`))) return html;

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
