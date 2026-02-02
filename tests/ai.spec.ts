import { test, expect } from '@playwright/test';
import { ChatbotPage } from '../src/pages/ChatBotPage';
import { validateAIResponse } from '../src/helpers/aiValidator';

test.describe('AI Functional Validation (Pass/Fail)', () => {

  test('AI responds correctly for public service query', async ({ page }) => {

    const chat = new ChatbotPage(page);

    await chat.openApp();
    await chat.openChat();

    const question = 'How can I check UAE visa status?';

    await chat.sendMessage(question);

    await chat.waitForAIResponse();

    const aiText = await chat.getLastAIResponse();

    // Hard functional gate
    validateAIResponse(aiText);

  });

  test('Validate AI response time SLA', async ({ page }) => {

    const chat = new ChatbotPage(page);

    await chat.openApp();
    await chat.openChat();

    const startTime = Date.now();

    await chat.sendMessage('Hello');

    await chat.waitForAIResponse();

    const responseTime = Date.now() - startTime;

    expect(responseTime).toBeLessThan(7000);

  });

});
