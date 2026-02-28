import { test, expect } from '@playwright/test';
import { BasePage } from '../../src/pages/BasePage';
import { ChatbotPage } from '../../src/pages/ChatbotPage';
import { GOOGLE_AI_API_KEY } from '../../src/config/env';
import { calculateContextRecall } from '../../src/helpers/aiValidator';
import { validateWithGoogleAI } from '../../src/helpers/googleAIHelper';
import { saveReport } from '../../src/helpers/reportHelper';
import prompts from '../../src/test-data/ai-prompts.json';

test.describe.configure({ mode: 'serial' });

test.describe('AI Quality Testing - Google AI (Free)', () => {
  let chat: ChatbotPage;
  let base: BasePage;

  test.beforeEach(async ({ page }) => {
    chat = new ChatbotPage(page);
    base = new BasePage(page);
    await chat.openApp();
    await base.handleDisclaimerIfPresent();
    await chat.isChatWindowDisplayed();
  });

  test('Context Recall with Google AI LLM Validation (FREE)', async () => {

    const prompt = prompts[0];
    await chat.sendMessage(prompt.text);
    await chat.waitForAIResponse();
    const aiText = await chat.getLastAIResponse();

    // Traditional Context Recall
    const result = calculateContextRecall(aiText, prompt.keywords);

    console.log(`Context Recall: ${result.recallScore}%`);
    console.log(`Details: ${result.reasons.join(', ')}`);

    // LLM validation using FREE Google AI (Gemini 1.5 Flash)
    const llmValidation = await validateWithGoogleAI(
      prompt.text,
      aiText,
      GOOGLE_AI_API_KEY
    );

    console.log(`\nLLM Validation (Google AI - FREE):`);
    console.log(`  Model: ${llmValidation.llmValidation?.model}`);
    console.log(`  Relevance: ${llmValidation.llmValidation?.relevanceScore}/100`);
    console.log(`  Appropriateness: ${llmValidation.llmValidation?.appropriatenessScore}/100`);
    console.log(`  Hallucination: ${llmValidation.llmValidation?.hallucinationDetected ? 'YES' : 'NO'}`);
    console.log(`  Reasoning: ${llmValidation.llmValidation?.reasoning}`);

    // Assertions
    expect(result.recallScore).toBeGreaterThanOrEqual(50);
    expect(llmValidation.llmValidation?.relevanceScore).toBeGreaterThanOrEqual(70);

    // Save report
    const reportData = {
      question: prompt.text,
      traditional: {
        recallScore: result.recallScore,
        details: result.reasons,
      },
      llmValidation: llmValidation.llmValidation,
      llmPassed: llmValidation.passed,
    };

    await saveReport('google-ai-context-recall', reportData);
  });
});
