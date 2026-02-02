import { test } from '@playwright/test';
import { ChatbotPage } from '../src/pages/ChatBotPage';
import { runA11y } from '../src/helpers/a11y';

test.describe('U-Ask Chatbot Accessibility Validation', () => {

  test('Chatbot UI meets basic accessibility standards', async ({ page }) => {

    const chat = new ChatbotPage(page);

    await chat.openApp();
    await chat.openChat();

    // Run accessibility scan ONLY on chatbot container
    await runA11y(page, '[role="dialog"]');

  });

});
