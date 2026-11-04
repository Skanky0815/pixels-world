import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  // CI parallelizes across runners; software rendering needs an uncontended worker.
  workers: process.env.CI ? 1 : 2,
  timeout: 60_000,
  expect: { timeout: 5_000 },
  reporter: [['list'], ['html', { open: 'never' }], ['junit', { outputFile: 'test-reports/playwright.xml', includeProjectInTestName: true }]],
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
      // The E2E build above is the mandatory shared typecheck for this test run.
      command: 'npm exec vite build && npm exec vite preview -- --host 127.0.0.1 --port 4175 --strictPort',
      url: 'http://127.0.0.1:4175',
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
