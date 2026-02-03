import { test } from '@playwright/test';
import { ChatbotPage } from '../src/pages/ChatBotPage';
import { CHAT_WINDOW_SELECTOR } from '../src/pages/ChatLocators';
import { runA11y } from '../src/helpers/a11y';

test.describe('U-Ask Chatbot Accessibility Validation', () => {

  let chat: ChatbotPage;

  test.beforeEach(async ({ page }) => {
    chat = new ChatbotPage(page);
    await chat.openApp();
    await chat.openChat();
  });

  test('Chatbot UI meets basic accessibility standards', async ({ page }) => {

    // Run accessibility scan ONLY on chatbot container
    await runA11y(page, CHAT_WINDOW_SELECTOR);

  });

});
