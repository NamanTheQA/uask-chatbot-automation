import { test, expect } from '@playwright/test';
import { ChatbotPage } from '../../src/pages/ChatbotPage';
import uiData from '../../src/test-data/ui-data.json';
import { BasePage } from '../../src/pages/BasePage';

test.describe('Multilingual UI Validation (Arabic only)', () => {

  const arData = uiData.languages.find(l => l.lang === 'AR');

  test.only('Validate AR layout and localization using toggle', async ({ page }) => {

    if (!arData) {
      test.skip(true, 'No AR data present in ui-data.json');
      return;
    }

    const langData = arData;
    const chat = new ChatbotPage(page);
    const base = new BasePage(page);

    await chat.openApp();
    await base.handleDisclaimerIfPresent();
    await chat.isChatWindowDisplayed();
    await chat.toggleLanguageButton(langData.lang);

    // Wait for the page to apply the language direction (rtl) instead of a fixed sleep
    await page.waitForSelector(`html[dir="${langData.direction}"]`, { timeout: 10000 });

    // Assert HTML dir attribute
    await expect(page.locator('html')).toHaveAttribute('dir', langData.direction, { timeout: 10000 });

    const inputSelector = '#conversation';
    const inputLocator = page.locator(inputSelector);

    // wait until computed style direction matches expected (pass args as a single array)
    await page.waitForFunction(
      ([sel, dir]) => {
        const el = document.querySelector(sel);
        return !!el && window.getComputedStyle(el).direction === dir;
      },
      [inputSelector, langData.direction],
      { timeout: 10000 }
    );

    const inputDirection = await inputLocator.evaluate(el => window.getComputedStyle(el).direction);
    expect(inputDirection).toBe(langData.direction);

    await chat.sendMessage(langData.message);
    await chat.waitForAIResponse();
    await chat.getLastAIResponse();

    const messageDirection = await chat.getLastMessageDirection();
    expect(messageDirection).toBe(langData.direction);

    const placeholder = await inputLocator.getAttribute('placeholder');
    expect(placeholder?.toLowerCase()).toContain(langData.placeholderKeyword.toLowerCase());

    // Arabic-specific validations
    const userText = await chat.getLastUserMessage();
    expect(userText).toMatch(/[\u0600-\u06FF]/);

    const arabicLocator = page.locator('.notification-circle').first();
    await expect(arabicLocator).toHaveText(/\p{Script=Arabic}/u, { timeout: 10000 });

  });

});
