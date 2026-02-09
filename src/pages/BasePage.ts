import { Page } from '@playwright/test';

export class BasePage {

  constructor(protected page: Page) {}

  async goto(path = '/en/uask') {
    await this.page.goto(path);
  }

  async waitForLoaderToDisappear(selector: string) {
    const loader = this.page.locator(selector);
    await loader.waitFor({ state: 'hidden', timeout: 25000 }).catch(() => {});
  }

}
