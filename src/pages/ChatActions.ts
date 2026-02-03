import { Page, expect } from '@playwright/test';
import { ChatLocators } from './ChatLocators';

export class ChatActions {
  private page: Page;
  private locators: ChatLocators;

  constructor(page: Page, locators: ChatLocators) {
    this.page = page;
    this.locators = locators;
  }

  async openApp() {
    await this.page.goto('/');
  }

  async openChat() {
    await expect(this.locators.chatButton.first()).toBeVisible();
    await this.locators.chatButton.first().click();
    await expect(this.locators.chatWindow).toBeVisible();
  }

  async sendMessage(message: string) {
    await this.locators.inputBox.fill(message);
    await this.locators.inputBox.press('Enter');
  }

  async waitForAIResponse() {
    // Optional loader sync
    await this.locators.loader.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await this.locators.loader.waitFor({ state: 'hidden', timeout: 25000 }).catch(() => {});

    // Ensure AI message rendered
    await this.locators.aiMessage.last().waitFor({ timeout: 25000 });
  }

  async switchLanguage(lang: 'AR' | 'EN') {
    if (lang === 'AR') {
      await this.switchToArabic();
    } else {
      await this.switchToEnglish();
    }
  }

  async switchToArabic() {
    await this.locators.arabicToggle.first().click();
  }

  async switchToEnglish() {
    await this.locators.englishToggle.first().click();
  }
}
