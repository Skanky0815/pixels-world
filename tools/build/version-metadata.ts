import type { Plugin } from 'vite';

/** A tiny uncached release probe must not install an offline copy of the game. */
// eslint-disable-next-line max-lines-per-function -- Build-Define und erzeugte Versionsdatei gehören zu einem Plugin-Lebenszyklus.
export function versionMetadata(): Plugin {
  let version: string;

  return {
    name: 'pixel-release-version',
    configResolved(config) {
      version = JSON.parse(config.define?.__APP_VERSION__ ?? '"unknown"');
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ version }),
      });
    },
  };
}
