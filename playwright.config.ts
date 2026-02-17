  import { defineConfig, devices } from '@playwright/test';

  const ENV = process.env.ENV || 'r9int';

  const baseURLs: Record<string, string> = {
    r9int: 'https://beta-ask.u.ae',
    prod: 'https://ask.u.ae'
  };

  export default defineConfig({

    testDir: './tests',
    fullyParallel: true,
    timeout: 60000,

    expect: {
      timeout: 10000
    },

    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 2 : 1,

    use: {
      baseURL: baseURLs[ENV],
      headless: process.env.HEADED ? false : true,
      screenshot: 'only-on-failure',
      video: 'retain-on-failure',
      trace: 'retain-on-failure',
      actionTimeout: 15000,
      navigationTimeout: 30000
    },

    projects: [
      {
        name: 'chrome',
        use: { ...devices['Desktop Chrome'] }
      },
      // {
      //   name: 'mobile',
      //   use: { ...devices['Pixel 7'] }
      // }
    ],

    reporter: [
      ['list'],
      ['html'],
      ['allure-playwright']
    ]

  });