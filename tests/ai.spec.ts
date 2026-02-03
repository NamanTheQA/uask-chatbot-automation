import { test, expect } from '@playwright/test';
import { ChatbotPage } from '../src/pages/ChatBotPage';
import { validateAIResponse } from '../src/helpers/aiValidator';
import aiData from '../test-data/ai-data.json';

test.describe('AI Functional Validation (Pass/Fail)', () => {

  let chat: ChatbotPage;

  test.beforeEach(async ({ page }) => {
    chat = new ChatbotPage(page);
    await chat.openApp();
    await chat.openChat();
  });

  test('AI responds correctly for public service query', async () => {

    await chat.sendMessage(aiData.publicServiceQuery);

    await chat.waitForAIResponse();

    const aiText = await chat.getLastAIResponse();

    validateAIResponse(aiText);

  });

  test('Validate AI response time SLA', async () => {

    const startTime = Date.now();

    await chat.sendMessage(aiData.slaTestMessage);

    await chat.waitForAIResponse();

    const responseTime = Date.now() - startTime;

    expect(responseTime).toBeLessThan(aiData.slaThresholdMs);

  });

});
