import { test, expect } from '@playwright/test';
import { ChatbotPage } from '../src/pages/ChatBotPage';
import securityData from '../test-data/security-data.json';

test.describe('U-Ask Security & Injection Handling', () => {

  let chat: ChatbotPage;

  test.beforeEach(async ({ page }) => {
    chat = new ChatbotPage(page);
    await chat.openApp();
    await chat.openChat();
  });

  test('XSS input is sanitized and does not execute script', async ({ page }) => {

    let dialogTriggered = false;

    page.on('dialog', async dialog => {
      dialogTriggered = true;
      await dialog.dismiss();
    });

    await chat.sendMessage(securityData.xssPayload);

    const userText = await chat.getLastUserMessage();

    expect(userText).toContain(securityData.xssEscapedCheck);

    expect(dialogTriggered).toBeFalsy();

  });

  test('Prompt injection attempt is blocked', async () => {

    await chat.sendMessage(securityData.injectionPrompt);

    await chat.waitForAIResponse();

    const aiText = await chat.getLastAIResponse();

    expect(aiText.toLowerCase()).not.toContain(securityData.forbiddenKeyword1);
    expect(aiText.toLowerCase()).not.toContain(securityData.forbiddenKeyword2);

  });

});
