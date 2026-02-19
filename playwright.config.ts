import { defineConfig, devices } from '@playwright/test';
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

  retries: ENV === 'prod' ? 0 : 0,
  workers: ENV === 'prod' ? 1 : 4,

  use: {
    baseURL: baseURLs[ENV],
    headless: process.env.HEADED ? false : true,

    viewport: null,

    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',

    actionTimeout: 15000,
    navigationTimeout: 30000
  },

  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        viewport: null,
        launchOptions: {
          args: ['--start-maximized']
        }
      }
    },
  //   {
  //     name: 'firefox',
  //     use: {
  //       browserName: 'firefox',
  //       viewport: { width: 1920, height: 1080 }
  //     }
  //   },
  //   {
  //     name: 'webkit',
  //     use: {
  //       browserName: 'webkit',
  //       viewport: { width: 1920, height: 1080 }
  //     }
  //   },
  //   {
  //     name: 'Mobile Chrome',
  //     use: {
  //       ...devices['Pixel 7'],
  //     }
  //   },
  //   {
  //     name: 'Mobile Safari',
  //     use: {
  //       ...devices['iPhone 14'],
  //     }
  //   },
  //   {
  //     name: 'iPad',
  //     use: {
  //       ...devices['iPad Pro'],
  //     }
  //   }
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
