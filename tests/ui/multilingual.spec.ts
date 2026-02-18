import { test, expect } from '@playwright/test';
import { ChatbotPage } from '../../src/pages/ChatbotPage';
import uiData from '../../src/test-data/ui-data.json';

test.describe('Multilingual UI Validation (Data Driven)', () => {

  for (const langData of uiData.languages) {

    test(`Validate ${langData.lang} layout and localization using toggle`, async ({ page }) => {

      const chat = new ChatbotPage(page);

      // Open app & ensure chatbot visible
      await chat.openApp();
      await chat.isChatWindowDisplayed();

      // Toggle language using top-right button (triggers page refresh)
      await chat.toggleLanguageButton(langData.lang);

      // Wait for page to stabilize after refresh
      await page.waitForTimeout(1000);

      // Validate page-level direction (html tag)
      const htmlDir = await page.locator('html').getAttribute('dir');
      expect(htmlDir).toBe(langData.direction);

      // Validate lang attribute on html or div elements
      if (langData.lang === 'AR') {
        const langAttr = await page.locator('[lang="ar"]').first().getAttribute('lang');
        expect(langAttr).toBe('ar');
      }

      // Validate input field direction
      const inputLocator = page.locator('textarea, input[type="text"]').first();

      await expect(inputLocator).toBeVisible();

      const inputDirection = await inputLocator.evaluate(
        el => window.getComputedStyle(el).direction
      );

      expect(inputDirection).toBe(langData.direction);

      // Send localized message
      await chat.sendMessage(langData.message);

      // Wait for message to render
      await chat.getLastUserMessage();

      // Validate message direction
      const messageDirection = await chat.getLastMessageDirection();
      expect(messageDirection).toBe(langData.direction);

      // Validate placeholder localization
      const placeholder = await inputLocator.getAttribute('placeholder');

      expect(placeholder?.toLowerCase())
        .toContain(langData.placeholderKeyword.toLowerCase());

      // Arabic-specific validation
      if (langData.lang === 'AR') {
        const userText = await chat.getLastUserMessage();

        // Ensure Arabic Unicode characters exist
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
