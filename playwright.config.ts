import { defineConfig } from '@playwright/test';
import { ENV, baseURLs } from './src/config/env';

const timestamp = new Date()
  .toISOString()
  .replace(/[:.]/g, '-')
  .replace('T', '_')
  .split('Z')[0];

const reportBasePath = `reports/${ENV}/${timestamp}`;

export default defineConfig({

  testDir: './tests',
  outputDir: `reports/${ENV}/playwright/test-results`,

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
  [
    'html',
    {
      outputFolder: `${reportBasePath}/playwright/html-report`,
      open: 'never'
    }
  ],
  [
    'allure-playwright',
    {
      outputFolder: `${reportBasePath}/allure/results`
    }
  ]
],

});