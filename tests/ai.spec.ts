import { test, expect } from '@playwright/test';
import { ChatbotPage } from '../src/pages/ChatbotPage';
import { validateAIResponse } from '../src/helpers/aiValidator';
import aiData from '../test-data/ai-data.json';

test.describe('AI Functional Validation (Pass/Fail)', () => {

  let chat: ChatbotPage;

  test.beforeEach(async ({ page }) => {
    chat = new ChatbotPage(page);
    await chat.openApp();
    await chat.isChatWindowDisplayed();
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

  test('AI response formatting sanity check', async () => {

  await chat.sendMessage('How can I apply for UAE Golden Visa?');

  await chat.waitForAIResponse();

  const aiText = await chat.getLastAIResponse();

  expect(aiText.length).toBeGreaterThan(20);

  expect(aiText).not.toMatch(/<[^>]*$/);

  expect(['.', '!', '?']).toContain(aiText.trim().slice(-1));
});

test('Fallback message behavior validation', async () => {

  await chat.sendMessage('asdhjkasdhkjashdkjashd');

  await chat.waitForAIResponse();

  const aiText = await chat.getLastAIResponse();

  expect(aiText.length).toBeGreaterThan(5);
  expect(aiText.toLowerCase()).not.toContain('error');

});

});
