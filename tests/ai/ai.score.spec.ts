import { test, expect } from '@playwright/test';
import { BasePage } from '../../src/pages/BasePage';
import { ChatbotPage } from '../../src/pages/ChatbotPage';
import {
  validateAIResponseScore,
  calculateSemanticScore,
  calculateHallucinationRisk,
  calculateContextPrecision,
  calculateContextRecall,
  calculateAnswerCorrectness,
  calculateFaithfulness,
  calculateConsistencyScore
} from '../../src/helpers/aiValidator';
import fs from 'fs';
import prompts from '../../src/test-data/ai-prompts.json';

test.describe.configure({ mode: 'serial' });

test.describe('AI Batch Quality Scoring', () => {

  let chat: ChatbotPage;
  let base: BasePage;

  test.beforeEach(async ({ page }) => {
    chat = new ChatbotPage(page);
    base = new BasePage(page);
    await chat.openApp();
    await base.handleDisclaimerIfPresent();
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
        responseTime,
        prompt.text, // User query for context precision
        prompt.groundTruth, // Ground truth for correctness
        prompt.expectedSources // Expected sources for faithfulness
      );

      results.push({
        id: prompt.id,
        question: prompt.text,
        responseTimeMs: scoreResult.responseTimeMs,
        score: scoreResult.score,
        hallucinationRisk: scoreResult.hallucinationRisk,
        contextPrecision: scoreResult.contextPrecision,
        contextRecall: scoreResult.contextRecall,
        answerCorrectness: scoreResult.answerCorrectness,
        faithfulness: scoreResult.faithfulness,
        issues: scoreResult.reasons,
        timestamp: new Date().toISOString()
      });
    }

    const aiReportDir = `reports/${process.env.ENV || 'r9int'}/ai`;
    fs.mkdirSync(aiReportDir, { recursive: true });
    fs.writeFileSync(`${aiReportDir}/ai-score-report.json`, JSON.stringify(results, null, 2));

  });

  test('Semantic Score - Topic diversity validation', async () => {

    const prompt = prompts[0];
    await chat.sendMessage(prompt.text);
    await chat.waitForAIResponse();
    const aiText = await chat.getLastAIResponse();

    const result = calculateSemanticScore(aiText);

    console.log(`Semantic Score: ${result.semanticScore}%`);
    console.log(`Matched Groups: ${result.matchedGroups}/${result.totalGroups}`);

    expect(result.semanticScore).toBeGreaterThanOrEqual(40);
    expect(result.matchedGroups).toBeGreaterThan(0);

  });

  test('Hallucination Risk - Fabrication detection', async () => {

    const prompt = prompts[0];
    await chat.sendMessage(prompt.text);
    await chat.waitForAIResponse();
    const aiText = await chat.getLastAIResponse();

    const result = calculateHallucinationRisk(aiText, prompt.keywords);

    console.log(`Hallucination Risk: ${result.hallucinationRisk}/85`);
    console.log(`Reasons: ${result.reasons.join(', ')}`);

    expect(result.hallucinationRisk).toBeLessThan(50);

  });

  test('Context Precision - Query relevance check', async () => {

    const prompt = prompts[0];
    await chat.sendMessage(prompt.text);
    await chat.waitForAIResponse();
    const aiText = await chat.getLastAIResponse();

    const result = calculateContextPrecision(aiText, prompt.text, prompt.keywords);

    console.log(`Context Precision: ${result.precisionScore}%`);
    console.log(`Issues: ${result.reasons.join(', ')}`);

    expect(result.precisionScore).toBeGreaterThanOrEqual(60);

  });

  test('Context Recall - Completeness coverage', async () => {

    const prompt = prompts[0];
    await chat.sendMessage(prompt.text);
    await chat.waitForAIResponse();
    const aiText = await chat.getLastAIResponse();

    const result = calculateContextRecall(aiText, prompt.keywords);

    console.log(`Context Recall: ${result.recallScore}%`);
    console.log(`Details: ${result.reasons.join(', ')}`);

    expect(result.recallScore).toBeGreaterThanOrEqual(50);

  });

  test('Answer Correctness - Ground truth comparison', async () => {

    const prompt = prompts[0];
    await chat.sendMessage(prompt.text);
    await chat.waitForAIResponse();
    const aiText = await chat.getLastAIResponse();

    const result = calculateAnswerCorrectness(aiText, prompt.groundTruth, prompt.keywords);

    console.log(`Answer Correctness: ${result.correctnessScore}%`);
    console.log(`Issues: ${result.reasons.join(', ')}`);

    expect(result.correctnessScore).toBeGreaterThanOrEqual(40);

  });

  test('Faithfulness - Source citation validation', async () => {

    const prompt = prompts[0];
    await chat.sendMessage(prompt.text);
    await chat.waitForAIResponse();
    const aiText = await chat.getLastAIResponse();

    const result = calculateFaithfulness(aiText, prompt.expectedSources);

    console.log(`Faithfulness Score: ${result.faithfulnessScore}%`);
    console.log(`Details: ${result.reasons.join(', ')}`);

    expect(result.faithfulnessScore).toBeGreaterThanOrEqual(30);

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

    const aiReportDir = `reports/${process.env.ENV || 'r9int'}/ai`;
    fs.mkdirSync(aiReportDir, { recursive: true });
    fs.writeFileSync(`${aiReportDir}/ai-consistency-report.json`, JSON.stringify(consistencyResults, null, 2));

  });

});
