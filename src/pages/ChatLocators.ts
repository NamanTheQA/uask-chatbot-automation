import { Page, Locator } from '@playwright/test';

// Selector constants
export const CHAT_WINDOW_SELECTOR = '[role="dialog"]';

export class ChatLocators {
  private page: Page;

  chatButton: Locator;
  chatWindow: Locator;
  inputBox: Locator;
  userMessage: Locator;
  aiMessage: Locator;
  loader: Locator;
  arabicToggle: Locator;
  englishToggle: Locator;

  constructor(page: Page) {
    this.page = page;

    this.chatButton = this.page.locator(
      'button:has-text("Ask"), button[aria-label*="Ask"]'
    );

    this.chatWindow = this.page.locator(CHAT_WINDOW_SELECTOR);

    this.inputBox = this.page.locator('textarea, input[type="text"]');

    this.userMessage = this.page.locator('.user-message, .message');

    this.aiMessage = this.page.locator('.ai-message, [data-role="ai"]');

    this.loader = this.page.locator('.typing, .loader, .dots');

    this.arabicToggle = this.page.locator(
      'button:has-text("AR"), a:has-text("AR")'
    );

    this.englishToggle = this.page.locator(
      'button:has-text("EN"), a:has-text("EN")'
    );
  }
}
