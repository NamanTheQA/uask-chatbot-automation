import { test, expect } from '@playwright/test';
import { ChatbotPage } from '../src/pages/ChatBotPage';
import languages from '../test-data/language-data.json';

test.describe('Data Driven Multilingual Validation', () => {

  for (const langData of languages) {

    test(`Validate ${langData.lang} language UI behavior`, async ({ page }) => {

      const chat = new ChatbotPage(page);

      await chat.openApp();
      await chat.openChat();

      // Switch language dynamically
      await chat.switchLanguage(langData.lang as 'AR' | 'EN');

      // Send localized message
      await chat.sendMessage(langData.message);

      // Direction validation
      const direction = await chat.getLastMessageDirection();
      expect(direction).toBe(langData.direction);

      // Placeholder localization validation
      const placeholder = await page
        .locator('textarea, input[type="text"]')
        .getAttribute('placeholder');

      expect(placeholder?.toLowerCase())
        .toContain(langData.placeholderKeyword.toLowerCase());

    });

  }

});
