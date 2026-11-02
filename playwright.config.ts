import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 5_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4174',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run build:e2e && npm exec vite preview -- --host 127.0.0.1 --port 4174 --strictPort --outDir dist-e2e',
      url: 'http://127.0.0.1:4174',
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: 'npm run build && npm exec vite preview -- --host 127.0.0.1 --port 4175 --strictPort',
      url: 'http://127.0.0.1:4175',
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
