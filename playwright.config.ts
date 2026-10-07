import { defineConfig } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import {randomBytes} from 'node:crypto';
if (existsSync('.env.local')) loadEnvFile('.env.local');
mkdirSync('data', { recursive: true });
process.env.TEST_ADMIN_PASSWORD ||= randomBytes(18).toString('hex');
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  expect: { timeout: 15000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5174',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --port 5174',
    url: 'http://127.0.0.1:5174/login',
    reuseExistingServer: false,
    env:{TURSO_DATABASE_URL:`file:./data/test-${Date.now()}.db`,ADMIN_EMAIL:'admin@example.test',ADMIN_PASSWORD:process.env.TEST_ADMIN_PASSWORD,NEXT_DIST_DIR:'.next-test'},
    timeout: 120000,
  },
});
