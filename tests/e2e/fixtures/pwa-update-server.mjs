import { createServer } from 'node:http';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, extname, sep } from 'node:path';
import { log } from 'node:console';
import { URL } from 'node:url';
import process from 'node:process';
import { build } from 'vite';

// Two actual production builds share an origin, as two consecutive Pages deployments do.
const root = await mkdtemp(resolve(tmpdir(), 'pixels-pwa-updates-'));
const versions = { a: '0.0.1-update-test', b: '0.0.2-update-test' };
for (const [release, version] of Object.entries(versions))
  await build({
    base: './',
    logLevel: 'warn',
    define: { __APP_VERSION__: JSON.stringify(version) },
    build: { outDir: resolve(root, release), emptyOutDir: true },
  });

const releases = new Map([
  ['/', 'a'],
  ['/pixels-world/', 'a'],
]);
const broken = new Set();
const registrationBroken = new Set();
const blocked = [];
const types = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
};

async function serve(request, response) {
  const url = new URL(request.url, 'http://127.0.0.1:4178');
  const scope = url.searchParams.get('scope') || '/';
  if (url.pathname === '/__status') {
    response
      .writeHead(200, { 'Content-Type': 'application/json' })
      .end(JSON.stringify({ blocked }));
    return;
  }
  if (request.method === 'POST' && url.pathname === '/__release') {
    if (url.searchParams.has('registration')) registrationBroken.add(scope);
    else registrationBroken.delete(scope);
    releases.set(scope, url.searchParams.get('release') === 'b' ? 'b' : 'a');
    if (url.searchParams.has('broken')) broken.add(scope);
    else broken.delete(scope);
    response.writeHead(204).end();
    return;
  }
  const base = url.pathname.startsWith('/pixels-world/') ? '/pixels-world/' : '/';
  const directory = resolve(root, releases.get(base));
  const path = resolve(
    directory,
    decodeURIComponent(url.pathname.slice(base.length) || 'index.html'),
  );
  if (!path.startsWith(directory + sep)) {
    response.writeHead(403).end();
    return;
  }
  if (registrationBroken.has(base) && path.endsWith('/sw.js')) {
    response.writeHead(503).end();
    return;
  }
  if (broken.has(base) && path.endsWith('.js') && !path.endsWith('/sw.js')) {
    blocked.push(url.pathname);
    response.writeHead(503).end();
    return;
  }
  try {
    const body = await readFile(path);
    response
      .writeHead(200, {
        'Content-Type': types[extname(path)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
        'Service-Worker-Allowed': base,
      })
      .end(body);
  } catch {
    response.writeHead(404).end();
  }
}

const server = createServer((request, response) => {
  void serve(request, response).catch(() => response.writeHead(500).end());
});
server.listen(4178, '127.0.0.1', () => log('PWA release fixture ready'));
const stop = () => {
  server.close();
  void rm(root, { recursive: true, force: true });
};
process.once('SIGTERM', stop);
process.once('SIGINT', stop);
