import { readFileSync } from 'node:fs';
import { env } from 'node:process';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { pwaOptions } from './tools/pwa-config';
import { OBJECTS } from './src/content/objects/catalog';
import { ROOMS } from './src/content/rooms';
import { populateSpawnSlots } from './src/game/content/spawn-slots';
import { DIFFICULTIES, difficultyRoom } from './src/content/difficulty';
import { releaseUrl } from './tools/release-metadata';
import { roundConfigForBuild } from './tools/e2e-timing';
import { legalFooter } from './tools/legal-footer';
import { versionMetadata } from './tools/version-metadata';
import { gameShell } from './tools/game-shell';
import { de } from './src/i18n/de';

// Fail before bundling/serving when any registered content is invalid.
for (const room of Object.values(ROOMS))
  for (const difficulty of DIFFICULTIES)
    populateSpawnSlots(difficultyRoom(room, difficulty), OBJECTS, difficulty, () => 0.5);

const { version } = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string };

// eslint-disable-next-line max-lines-per-function -- Der deklarative Buildvertrag hält Modi, feste Defines und gemeinsame Ein-/Ausgänge zusammen.
export default defineConfig(({ mode, command }) => ({
  plugins: [
    gameShell(),
    versionMetadata(),
    VitePWA(pwaOptions(mode)),
    legalFooter(
      {
        year: new Date().getFullYear(),
        version,
        releaseUrl: releaseUrl(mode, command, version, env.PIXELS_RELEASE_TAG),
        releaseTitle: de.releaseNotesForVNewTab.replace('{v0}', version),
        dev: command === 'serve',
      },
      de.aiDisclosure,
    ),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __APP_RELEASE_URL__: JSON.stringify(releaseUrl(mode, command, version, env.PIXELS_RELEASE_TAG)),
    __E2E_ROUND_CONFIG__:
      JSON.stringify(roundConfigForBuild(mode, env.E2E_FULL_ROUND)) ?? 'undefined',
  },
  // Serve actual HTML files; missing dev pages must not fall back to the game in preview.
  appType: 'mpa',
  build: {
    rollupOptions: {
      // The comparison HTML is a dev-server page, never a release entry point.
      input: {
        landing: fileURLToPath(new URL('./index.html', import.meta.url)),
        game: fileURLToPath(new URL('./play.html', import.meta.url)),
        impressum: fileURLToPath(new URL('./impressum.html', import.meta.url)),
        datenschutz: fileURLToPath(new URL('./datenschutz.html', import.meta.url)),
        recovery: fileURLToPath(new URL('./update.html', import.meta.url)),
      },
    },
  },
}));
