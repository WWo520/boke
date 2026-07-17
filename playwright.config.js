// @ts-check
import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'url';

// 复用仓库内已下载的浏览器（ms-playwright/chromium-1228），免手动设环境变量
if (!process.env.PLAYWRIGHT_BROWSERS_PATH) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = fileURLToPath(new URL('./ms-playwright', import.meta.url));
}

/**
 * Playwright 配置
 * - 前后端已手动启动：前端 http://localhost:3000，后端 http://localhost:3333
 * - api 项目：纯接口测试，不启动浏览器（快速、稳定）
 * - e2e 项目：基于 Chromium 的端到端冒烟测试
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 30000,
  expect: { timeout: 8000 },

  projects: [
    {
      name: 'api',
      testMatch: /.*\.api\.spec\.js/,
      use: {
        baseURL: 'http://localhost:3333',
        extraHTTPHeaders: { 'Content-Type': 'application/json' },
      },
    },
    {
      name: 'e2e',
      testMatch: /.*\.e2e\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
      },
    },
  ],
});
