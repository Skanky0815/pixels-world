import { readFileSync } from 'node:fs';
import { env } from 'node:process';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import { OBJECTS } from './src/content/objects/catalog';
import { ROOMS } from './src/content/rooms';
import { resolveRoom } from './src/game/content/resolve-room';
import { roundConfigForBuild } from './tools/e2e-timing';

// Fail before bundling/serving when any registered content is invalid.
for (const room of Object.values(ROOMS)) resolveRoom(room, OBJECTS);

const { version } = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string };

// eslint-disable-next-line max-lines-per-function -- Der deklarative Buildvertrag hält Modi, feste Defines und gemeinsame Ein-/Ausgänge zusammen.
export default defineConfig(({ mode }) => ({
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __E2E_ROUND_CONFIG__:
      JSON.stringify(roundConfigForBuild(mode, env.E2E_FULL_ROUND)) ?? 'undefined',
  },
  // Serve actual HTML files; missing dev pages must not fall back to the game in preview.
  appType: 'mpa',
  build: {
    rollupOptions: {
      // The comparison HTML is a dev-server page, never a release entry point.
      input: {
        game: fileURLToPath(new URL('./index.html', import.meta.url)),
        impressum: fileURLToPath(new URL('./impressum.html', import.meta.url)),
        datenschutz: fileURLToPath(new URL('./datenschutz.html', import.meta.url)),
      },
    },
  },
}));
