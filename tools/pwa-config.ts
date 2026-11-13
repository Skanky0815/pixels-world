import type { VitePWAOptions } from 'vite-plugin-pwa';

/** The relative app identity and start route work at / and at the Pages subpath. */
// eslint-disable-next-line max-lines-per-function -- Manifest, Cache-Grenzen und Update-Verhalten bilden einen zusammenhängenden deklarativen Buildvertrag.
export function pwaOptions(mode: string): Partial<VitePWAOptions> {
  return {
    disable: mode === 'e2e',
    injectRegister: false,
    registerType: 'prompt',
    manifest: {
      id: './',
      name: 'Pixel’s World',
      short_name: 'Pixel’s World',
      description: 'One room. One cat. Your chaos.',
      start_url: './play.html',
      scope: './',
      display: 'standalone',
      background_color: '#241f29',
      theme_color: '#241f29',
      icons: [
        { src: 'icons/pixel-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: 'icons/pixel-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        {
          src: 'icons/pixel-maskable-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    workbox: {
      // Installation must not succeed without its cache handler when an external runtime fails.
      inlineWorkboxRuntime: true,
      globPatterns: ['**/*.{js,css,html,png,svg,wav,webmanifest}'],
      // Small landing-page previews work offline; sharing images and ZIP downloads stay out.
      globIgnores: ['social/**', 'downloads/**/*.zip', 'update.html', 'assets/recovery-*.js'],
      navigateFallback: null,
      cleanupOutdatedCaches: true,
      skipWaiting: false,
      clientsClaim: false,
    },
  };
}
