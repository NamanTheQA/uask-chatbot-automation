import { test, expect } from '@playwright/test';
import { ChatbotPage } from '../src/pages/ChatBotPage';
import uiData from '../test-data/ui-data.json';

test.describe('Multilingual UI Validation (Data Driven)', () => {

  for (const langData of uiData.languages) {

    test(`Validate ${langData.lang} layout and localization`, async ({ page }) => {

      const chat = new ChatbotPage(page);

      await chat.openApp();
      await chat.openChat();
      
      await chat.switchLanguage(langData.lang as 'AR' | 'EN');

      await chat.sendMessage(langData.message);

      const direction = await chat.getLastMessageDirection();
      expect(direction).toBe(langData.direction);

      const placeholder = await page
        .locator('textarea, input[type="text"]')
        .getAttribute('placeholder');

      expect(placeholder?.toLowerCase())
        .toContain(langData.placeholderKeyword.toLowerCase());

    });

  }

});
