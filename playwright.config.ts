import { defineConfig } from '@playwright/test';
import { ENV, baseURLs } from './src/config/env';

export default defineConfig({

  testDir: './tests',

  fullyParallel: ENV === 'prod' ? false : true,

  timeout: 60000,

  retries: ENV === 'prod' ? 0 : 1,
  workers: ENV === 'prod' ? 1 : 4,

  use: {
    baseURL: baseURLs[ENV],
    headless: process.env.HEADED ? false : true,

    viewport: { width: 1920, height: 1080 },

    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',

    actionTimeout: 15000,
    navigationTimeout: 30000
  },

  projects: [
    {
      name: 'chrome',
      use: {
        browserName: 'chromium'
      }
    },
    {
      name: 'mobile',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 }, // Pixel-like
        isMobile: true
      }
    }
  ],

  reporter: [
    ['list'],
    ['html'],
    ['allure-playwright']
  ]

});