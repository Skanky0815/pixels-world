import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import { OBJECTS } from './src/content/objects/catalog';
import { ROOMS } from './src/content/rooms';
import { resolveRoom } from './src/game/content/resolve-room';

// Fail before bundling/serving when any registered content is invalid.
for (const room of Object.values(ROOMS)) resolveRoom(room, OBJECTS);

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(version) },
  // Serve actual HTML files; missing dev pages must not fall back to the game in preview.
  appType: 'mpa',
  build: {
    rollupOptions: {
      // The comparison HTML is a dev-server page, never a release entry point.
      input: fileURLToPath(new URL('./index.html', import.meta.url)),
    },
  },
});
