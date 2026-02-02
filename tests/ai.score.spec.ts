import { test } from '@playwright/test';
import { ChatbotPage } from '../src/pages/ChatBotPage';
import { validateAIResponseScore } from '../src/helpers/aiValidator';
import fs from 'fs';
import prompts from '../test-data/ai-prompts.json';

const REPORT_PATH = 'reports/ai-score-report.json';

test.describe('AI Batch Quality Scoring', () => {

  test('Run AI scoring for all prompts', async ({ page }) => {

    const chat = new ChatbotPage(page);
    const results: any[] = [];

    await chat.openApp();
    await chat.openChat();

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
    fs.mkdirSync('reports', { recursive: true });

    // Write JSON report
    fs.writeFileSync(
      REPORT_PATH,
      JSON.stringify(results, null, 2)
    );

    console.log('AI Score Report Generated:', REPORT_PATH);

  });

});
