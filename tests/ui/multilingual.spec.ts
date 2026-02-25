import { test, expect } from '@playwright/test';
import { ChatbotPage } from '../../src/pages/ChatbotPage';
import uiData from '../../src/test-data/ui-data.json';

test.describe('Multilingual UI Validation (Data Driven)', () => {

  for (const langData of uiData.languages) {

    test(`Validate ${langData.lang} layout and localization using toggle`, async ({ page }) => {

      const chat = new ChatbotPage(page);

      await chat.openApp();
      await chat.isChatWindowDisplayed();
      await chat.toggleLanguageButton(langData.lang);

      await page.waitForTimeout(1000);

      const htmlDir = await page.locator('html').getAttribute('dir');
      expect(htmlDir).toBe(langData.direction);

      if (langData.lang === 'AR') {
        const langAttr = await page.locator('[lang="ar"]').first().getAttribute('lang');
        expect(langAttr).toBe('ar');
      }

      const inputLocator = page.locator('textarea, input[type="text"]').first();

      await expect(inputLocator).toBeVisible();

      const inputDirection = await inputLocator.evaluate(
        el => window.getComputedStyle(el).direction
      );

      expect(inputDirection).toBe(langData.direction);

      await chat.sendMessage(langData.message);

      await chat.getLastUserMessage();

      const messageDirection = await chat.getLastMessageDirection();
      expect(messageDirection).toBe(langData.direction);

      const placeholder = await inputLocator.getAttribute('placeholder');

      expect(placeholder?.toLowerCase())
        .toContain(langData.placeholderKeyword.toLowerCase());

      if (langData.lang === 'AR') {
        const userText = await chat.getLastUserMessage();

        expect(userText).toMatch(/[\u0600-\u06FF]/);

        // Validate Arabic text in notification circle (العربية)
        const arabicText = await page.locator('.notification-circle').first().textContent();
        if (arabicText) {
          expect(arabicText).toMatch(/[\u0600-\u06FF]/);
        }
      }

    });

  }

});
