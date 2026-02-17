import { test } from '@playwright/test';
import { ChatbotPage } from '../src/pages/ChatbotPage';
import {
  validateAIResponseScore,
  calculateConsistencyScore
} from '../src/helpers/aiValidator';
import fs from 'fs';
import prompts from '../test-data/ai-prompts.json';
import scoreConfig from '../test-data/score-config.json';

test.describe.configure({ mode: 'serial' });

test.describe('AI Batch Quality Scoring', () => {

  let chat: ChatbotPage;

  test.beforeEach(async ({ page }) => {
    chat = new ChatbotPage(page);
    await chat.openApp();
    await chat.isChatWindowDisplayed();
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

      results.push({
        id: prompt.id,
        question: prompt.text,
        responseTimeMs: scoreResult.responseTimeMs,
        score: scoreResult.score,
        issues: scoreResult.reasons,
        timestamp: new Date().toISOString()
      });
    }

    fs.mkdirSync(scoreConfig.reportsDir, { recursive: true });

    fs.writeFileSync(
      scoreConfig.reportPath,
      JSON.stringify(results, null, 2)
    );
  });

  test('AI response consistency scoring (multi-run stability)', async () => {

    const consistencyResults: any[] = [];

    for (const prompt of prompts) {

      await chat.sendMessage(prompt.text);
      await chat.waitForAIResponse();
      const response1 = await chat.getLastAIResponse();

      await chat.sendMessage(prompt.text);
      await chat.waitForAIResponse();
      const response2 = await chat.getLastAIResponse();

      const consistency = calculateConsistencyScore(
        response1,
        response2,
        prompt.keywords
      );

      consistencyResults.push({
        id: prompt.id,
        question: prompt.text,
        consistencyScore: consistency.consistencyScore,
        issues: consistency.reasons,
        timestamp: new Date().toISOString()
      });
    }

    fs.mkdirSync(scoreConfig.reportsDir, { recursive: true });

    fs.writeFileSync(
      `${scoreConfig.reportsDir}/ai-consistency-report.json`,
      JSON.stringify(consistencyResults, null, 2)
    );
  });

});