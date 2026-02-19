import { test, expect } from '@playwright/test';
import { BasePage } from '../../src/pages/BasePage';
import { ChatbotPage } from '../../src/pages/ChatbotPage';
import { validateAIResponse, calculateConsistencyScore } from '../../src/helpers/aiValidator';
import aiData from '../../src/test-data/ai-data.json';

test.describe('AI Functional Validation (Pass/Fail)', () => {

  let chat: ChatbotPage;
  let base: BasePage;

  test.beforeEach(async ({ page }) => {
    chat = new ChatbotPage(page);
    base = new BasePage(page);
    await chat.openApp();
    await base.handleDisclaimerIfPresent();
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

test('AI consistency between English and Arabic responses', async ({ page }) => {

  const testQuery = "How to check UAE visa status?";
  const expectedKeywords = ["visa", "status", "check", "ICA"];

  await chat.sendMessage(testQuery);
  await chat.waitForAIResponse();
  const englishResponse = await chat.getLastAIResponse();

  await chat.toggleLanguageButton('AR');
  await page.waitForTimeout(2000);

  const chatAR = new ChatbotPage(page);
  await chatAR.isChatWindowDisplayed();

  await chatAR.sendMessage("كيف أتحقق من حالة التأشيرة؟");
  await chatAR.waitForAIResponse();
  const arabicResponse = await chatAR.getLastAIResponse();

  const consistency = calculateConsistencyScore(
    englishResponse,
    arabicResponse,
    expectedKeywords
  );

  console.log(`Consistency Score: ${consistency.consistencyScore}%`);
  console.log(`Reasons: ${consistency.reasons.join(', ')}`);

  // Assert minimum consistency threshold
  expect(consistency.consistencyScore).toBeGreaterThanOrEqual(60);
});

});
