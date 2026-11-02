import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  // Serve actual HTML files; missing dev pages must not fall back to the game in preview.
  appType: 'mpa',
  build: {
    rollupOptions: {
      // The comparison HTML is a dev-server page, never a release entry point.
      input: fileURLToPath(new URL('./index.html', import.meta.url)),
    },
  },
});
