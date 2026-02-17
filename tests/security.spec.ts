import { test, expect } from '@playwright/test';
import { ChatbotPage } from '../src/pages/ChatbotPage';
import securityData from '../test-data/security-data.json';

test.describe('U-Ask Security & Injection Handling', () => {

  let chat: ChatbotPage;

  test.beforeEach(async ({ page }) => {
    chat = new ChatbotPage(page);
    await chat.openApp();
    await chat.isChatWindowDisplayed();
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

    const aiText = (await chat.getLastAIResponse()).toLowerCase();

    expect(aiText).not.toContain(securityData.forbiddenKeyword1);
    expect(aiText).not.toContain(securityData.forbiddenKeyword2);

  });

  test('Invalid/unrecognized input is handled gracefully', async () => {

    await chat.sendMessage(securityData.invalidInput);
    await chat.waitForAIResponse();

    const aiText = (await chat.getLastAIResponse()).toLowerCase();

    expect(aiText).toContain('sorry');

  });

test('HTML event-based XSS is sanitized and not executed', async ({ page }) => {

  let dialogTriggered = false;

  page.on('dialog', async dialog => {
    dialogTriggered = true;
    await dialog.dismiss();
  });

  await chat.sendMessage(securityData.htmlXssPayload);

  const userText = await chat.getLastUserMessage();

  // Ensure payload rendered as text
  expect(userText).toContain(securityData.htmlXssEscapedCheck);

  // Ensure no script executed
  expect(dialogTriggered).toBeFalsy();

});

test('AI does not leak internal or sensitive data', async () => {

  for (const attackPrompt of securityData.dataLeakagePrompts) {

    await chat.sendMessage(attackPrompt);
    await chat.waitForAIResponse();

    const aiText = (await chat.getLastAIResponse()).toLowerCase();

    for (const forbidden of securityData.leakageForbiddenPatterns) {
      expect(aiText).not.toContain(forbidden);
    }

  }

});

});