import { test } from '@playwright/test';
import { ChatbotPage } from '../src/pages/ChatBotPage';
import { validateAIResponseScore } from '../src/helpers/aiValidator';
import fs from 'fs';
import prompts from '../test-data/ai-prompts.json';
import scoreConfig from '../test-data/score-config.json';

test.describe('AI Batch Quality Scoring', () => {

  let chat: ChatbotPage;

  test.beforeEach(async ({ page }) => {
    chat = new ChatbotPage(page);
    await chat.openApp();
    await chat.openChat();
  });

  test('Run AI scoring for all prompts', async () => {

    const results: any[] = [];

    for (const prompt of prompts) {

      const startTime = Date.now();

      await chat.sendMessage(prompt.text);

      await chat.waitForAIResponse();

      const responseTime = Date.now() - startTime;

      const aiText = await chat.getLastAIResponse();

      const scoreResult = validateAIResponseScore(
        aiText,
        prompt.keywords,
        responseTime
      );

      const entry = {
        id: prompt.id,
        question: prompt.text,
        responseTimeMs: scoreResult.responseTimeMs,
        score: scoreResult.score,
        issues: scoreResult.reasons,
        timestamp: new Date().toISOString()
      };

      results.push(entry);

      console.log('AI METRIC:', entry);
    }

    // Ensure reports folder exists
    fs.mkdirSync(scoreConfig.reportsDir, { recursive: true });

    // Write JSON report
    fs.writeFileSync(
      scoreConfig.reportPath,
      JSON.stringify(results, null, 2)
    );

    console.log('AI Score Report Generated:', scoreConfig.reportPath);

  });

});
