import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';

/** Public URLs are independent of the application's source directories. */
export const publishedPages = {
  'index.html': 'game/landingpage/index.html',
  'play.html': 'game/play/play.html',
  'help.html': 'game/landingpage/help.html',
  'impressum.html': 'game/landingpage/impressum.html',
  'datenschutz.html': 'game/landingpage/datenschutz.html',
  'update.html': 'game/landingpage/update.html',
};
const developmentPages = Object.fromEntries(
  [
    'animation-compare',
    'interactable-playground',
    'portrait-preview',
    'ball-play-preview',
    'charm-preview',
  ].map((name) => [`${name}.html`, `game/dev/${name}.html`]),
);

async function servePage(server: ViteDevServer, url: string, source: string) {
  return server.transformIndexHtml(
    `/${pageName(url, server.config.base)}`,
    readFileSync(source, 'utf8'),
    url,
  );
}

function pageName(url: string, base: string) {
  const path = new URL(url, 'http://localhost').pathname;

  return path.startsWith(base) ? path.slice(base.length) || 'index.html' : '';
}

// eslint-disable-next-line max-lines-per-function -- Auflösung, HTML-Laden und Dev-Auslieferung müssen dieselbe öffentliche Pfadabbildung verwenden.
export function applicationPages(): Plugin {
  let root = '';
  let pages: Record<string, string> = {};

  return {
    name: 'application-pages',
    enforce: 'pre',
    configResolved(config) {
      root = config.root;
      pages =
        config.command === 'serve' ? { ...publishedPages, ...developmentPages } : publishedPages;
    },
    resolveId(id) {
      if (pages[id.slice(root.length + 1)] && id.startsWith(`${root}/`)) return id;
    },
    load(id) {
      const source = pages[id.slice(root.length + 1)];

      if (!id.startsWith(`${root}/`) || !source) return;
      this.addWatchFile(resolve(root, source));

      return readFileSync(resolve(root, source), 'utf8');
    },
    // eslint-disable-next-line max-lines-per-function -- Watcher und Middleware teilen die Zuordnung realer Quellen zu öffentlichen URLs.
    configureServer(server) {
      server.watcher.add(Object.values(pages).map((source) => resolve(root, source)));
      // eslint-disable-next-line max-lines-per-function -- Eine Anfrage wird als Ganzes aufgelöst, transformiert und mit Vites Fehlerbehandlung beantwortet.
      server.middlewares.use(async (request, response, next) => {
        const url = request.url ?? '/';
        const source = pages[pageName(url, server.config.base)];

        if (!source || !['GET', 'HEAD'].includes(request.method ?? '')) return next();

        try {
          const html = await servePage(server, url, resolve(root, source));

          response.setHeader('Content-Type', 'text/html; charset=utf-8');
          response.end(request.method === 'HEAD' ? undefined : html);
        } catch (error) {
          next(error);
        }
      });
    },
    handleHotUpdate({ file, server }) {
      if (!Object.values(pages).some((source) => resolve(root, source) === file)) return;
      server.ws.send({ type: 'full-reload' });

      return [];
    },
  };
}
