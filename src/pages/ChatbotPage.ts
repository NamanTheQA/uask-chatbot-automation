import { Page, expect } from '@playwright/test';

export class ChatbotPage {

  constructor(private page: Page) {}

  // ============================
  // Locators
  // ============================

  private chatButton = this.page.locator(
    'button:has-text("Ask"), button[aria-label*="Ask"]'
  );

  private chatWindow = this.page.locator('[role="dialog"]');

  private inputBox = this.page.locator('textarea, input[type="text"]');

  private userMessage = this.page.locator('.user-message, .message');

  private aiMessage = this.page.locator('.ai-message, [data-role="ai"]');

  private loader = this.page.locator('.typing, .loader, .dots');

  private arabicToggle = this.page.locator(
    'button:has-text("AR"), a:has-text("AR")'
  );

  private englishToggle = this.page.locator(
    'button:has-text("EN"), a:has-text("EN")'
  );

  // ============================
  // Page Actions
  // ============================

  async openApp() {
    await this.page.goto('/');
  }

  async openChat() {
    await expect(this.chatButton.first()).toBeVisible();
    await this.chatButton.first().click();
    await expect(this.chatWindow).toBeVisible();
  }

  async sendMessage(message: string) {
    await this.inputBox.fill(message);
    await this.inputBox.press('Enter');
  }

  async switchLanguage(lang: 'AR' | 'EN') {
  if (lang === 'AR') {
    await this.switchToArabic();
  } else {
    await this.switchToEnglish();
  }
}

  async waitForAIResponse() {

    // Optional loader sync
    await this.loader.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await this.loader.waitFor({ state: 'hidden', timeout: 25000 }).catch(() => {});

    // Ensure AI message rendered
    await this.aiMessage.last().waitFor({ timeout: 25000 });
  }

  // ============================
  // Data Getters
  // ============================

  async getLastUserMessage() {
    return await this.userMessage.last().innerText();
  }

  async getLastAIResponse() {
    return await this.aiMessage.last().innerText();
  }

  async getInputValue() {
    return await this.inputBox.inputValue();
  }

  async getLastMessageDirection() {
    return await this.userMessage.last().evaluate(el =>
      window.getComputedStyle(el).direction
    );
  }

  // ============================
  // Language Controls
  // ============================

  async switchToArabic() {
    await this.arabicToggle.first().click();
  }

  async switchToEnglish() {
    await this.englishToggle.first().click();
  }

}
