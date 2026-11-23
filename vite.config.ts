import { readFileSync } from 'node:fs';
import { env } from 'node:process';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { pwaOptions } from './tools/build/pwa-config';
import { OBJECTS } from './game/play/content/objects/catalog';
import { ROOMS } from './game/play/content/rooms';
import { populateSpawnSlots } from './game/play/content/spawn-slots';
import { DIFFICULTIES, difficultyRoom } from './game/play/content/difficulty';
import { releaseUrl } from './tools/build/release-metadata';
import { roundConfigForBuild } from './tools/qa/e2e-timing';
import { pageInformation } from './tools/build/page-information';
import { versionMetadata } from './tools/build/version-metadata';
import { htmlShell } from './tools/build/html-shell';
import { applicationPages, publishedPages } from './tools/build/application-pages';
import { de } from './game/shared/i18n/de';

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
    applicationPages(),
    htmlShell('game', ['play']),
    htmlShell('landing', ['index', 'help']),
    htmlShell('legal', ['impressum', 'datenschutz']),
    versionMetadata(),
    VitePWA(pwaOptions(mode)),
    pageInformation({
      year: new Date().getFullYear(),
      version,
      releaseUrl: releaseUrl(mode, command, version, env.PIXELS_RELEASE_TAG),
      releaseTitle: de.releaseNotesForVNewTab.replace('{v0}', version),
      dev: command === 'serve',
    }),
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
      input: Object.fromEntries(
        Object.keys(publishedPages).map((page) => [
          page.replace('.html', ''),
          fileURLToPath(new URL(`./${page}`, import.meta.url)),
        ]),
      ),
    },
  },
}));
