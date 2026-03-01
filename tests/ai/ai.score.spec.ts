import { test, expect } from '@playwright/test';
import { BasePage } from '../../src/pages/BasePage';
import { ChatbotPage } from '../../src/pages/ChatbotPage';
import { OPENROUTER_API_KEY } from '../../src/config/env';
import {
  validateAIResponseScore,
  calculateSemanticScore,
  calculateHallucinationRisk,
  calculateContextPrecision,
  calculateContextRecall,
  calculateAnswerCorrectness,
  calculateFaithfulness,
  calculateConsistencyScore,
  validateWithOpenRouter,
  FREE_MODELS,
  PREMIUM_MODELS
} from '../../src/helpers/aiValidator';
import { saveReport } from '../../src/helpers/reportHelper';
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
        prompt.text,
        prompt.groundTruth,
        prompt.expectedSources
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

    saveReport('ai-score-report.json', results);

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

    const reportData = {
      question: prompt.text,
      semanticScore: result.semanticScore,
      matchedGroups: result.matchedGroups,
      totalGroups: result.totalGroups,
      timestamp: new Date().toISOString()
    };

    saveReport('semantic-score-report.json', reportData);

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

    const reportData = {
      question: prompt.text,
      hallucinationRisk: result.hallucinationRisk,
      maxRisk: 85,
      reasons: result.reasons,
      timestamp: new Date().toISOString()
    };

    saveReport('hallucination-report.json', reportData);

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

    const reportData = {
      question: prompt.text,
      precisionScore: result.precisionScore,
      issues: result.reasons,
      timestamp: new Date().toISOString()
    };

    saveReport('context-precision-report.json', reportData);

  });

  test('Context Recall - Completeness coverage', async () => {

    const prompt = prompts[0];
    await chat.sendMessage(prompt.text);
    await chat.waitForAIResponse();
    const aiText = await chat.getLastAIResponse();

    const result = calculateContextRecall(aiText, prompt.keywords);

    console.log(`Context Recall: ${result.recallScore}%`);
    console.log(`Details: ${result.reasons.join(', ')}`);

    // LLM validation using Gemini Pro Preview
    const llmValidation = await validateWithOpenRouter(
      prompt.text,
      aiText,
      OPENROUTER_API_KEY,
      FREE_MODELS.GEMINI_PRO
    );

    console.log(`\nLLM Validation:`);
    console.log(`  Relevance: ${llmValidation.llmValidation?.relevanceScore}/100`);
    console.log(`  Appropriateness: ${llmValidation.llmValidation?.appropriatenessScore}/100`);
    console.log(`  Hallucination: ${llmValidation.llmValidation?.hallucinationDetected ? 'YES' : 'NO'}`);
    console.log(`  Reasoning: ${llmValidation.llmValidation?.reasoning}`);

    expect(result.recallScore).toBeGreaterThanOrEqual(50);
    expect(llmValidation.llmValidation?.relevanceScore).toBeGreaterThanOrEqual(70);

    const reportData = {
      question: prompt.text,
      traditional: {
        recallScore: result.recallScore,
        details: result.reasons,
      },
      llm: llmValidation.llmValidation,
      timestamp: new Date().toISOString()
    };

    saveReport('context-recall-report.json', reportData);

  });

  test('LLM Validation - Hardcoded Bad Response Demo', async () => {
    // This test demonstrates LLM catching inappropriate/irrelevant hardcoded responses
    
    const question = "How can I check UAE visa status?";
    
    // Hardcoded bad response (irrelevant/unprofessional)
    const badResponse = "I don't know, maybe try Google? Anyway, did you watch the game last night?";
    
    const llmValidation = await validateWithOpenRouter(
      question,
      badResponse,
      OPENROUTER_API_KEY,
      FREE_MODELS.GEMINI_PRO
    );

    console.log(`\n🔴 HARDCODED BAD RESPONSE DEMO - LLM Validation:`);
    console.log(`  Question: ${question}`);
    console.log(`  Response: ${badResponse}`);
    console.log(`  Relevance: ${llmValidation.llmValidation?.relevanceScore}/100`);
    console.log(`  Appropriateness: ${llmValidation.llmValidation?.appropriatenessScore}/100`);
    console.log(`  Hallucination: ${llmValidation.llmValidation?.hallucinationDetected ? 'YES' : 'NO'}`);
    console.log(`  Reasoning: ${llmValidation.llmValidation?.reasoning}`);
    console.log(`  Status: ${llmValidation.passed ? '✅ PASSED' : '❌ FAILED'}`);

    // This should fail because the response is irrelevant and unprofessional
    expect(llmValidation.llmValidation?.relevanceScore).toBeGreaterThanOrEqual(70);
    expect(llmValidation.llmValidation?.appropriatenessScore).toBeGreaterThanOrEqual(70);

    const reportData = {
      type: 'hardcoded-bad-response',
      question,
      response: badResponse,
      llmValidation: llmValidation.llmValidation,
      passed: llmValidation.passed,
      timestamp: new Date().toISOString()
    };

    saveReport('llm-validation-hardcoded-failure.json', reportData);
  });

  test('LLM Validation - Mediocre Response (70-90 range)', async () => {
    // This test demonstrates LLM evaluating a partially correct but incomplete response
    
    // Ask a question where chatbot might give generic/vague answer
    const question = "How can I renew my visa?";
    
    await chat.sendMessage(question);
    await chat.waitForAIResponse();
    const aiText = await chat.getLastAIResponse();
    
    const llmValidation = await validateWithOpenRouter(
      question,
      aiText,
      OPENROUTER_API_KEY,
      FREE_MODELS.GEMINI_PRO
    );

    console.log(`\n⚠️  MEDIOCRE RESPONSE DEMO - LLM Validation:`);
    console.log(`  Question: ${question}`);
    console.log(`  Response: ${aiText.substring(0, 200)}...`);
    console.log(`  Relevance: ${llmValidation.llmValidation?.relevanceScore}/100`);
    console.log(`  Appropriateness: ${llmValidation.llmValidation?.appropriatenessScore}/100`);
    console.log(`  Hallucination: ${llmValidation.llmValidation?.hallucinationDetected ? 'YES' : 'NO'}`);
    console.log(`  Reasoning: ${llmValidation.llmValidation?.reasoning}`);
    console.log(`  Status: ${llmValidation.passed ? '✅ PASSED' : '❌ FAILED'}`);

    // This should pass but might have lower scores depending on response quality
    expect(llmValidation.llmValidation?.relevanceScore).toBeGreaterThanOrEqual(70);
    expect(llmValidation.llmValidation?.appropriatenessScore).toBeGreaterThanOrEqual(70);

    const reportData = {
      type: 'mediocre-response',
      question,
      response: aiText,
      llmValidation: llmValidation.llmValidation,
      passed: llmValidation.passed,
      timestamp: new Date().toISOString()
    };

    saveReport('llm-validation-mediocre-response.json', reportData);
  });

  test('LLM Validation - Real Chatbot Edge Case', async () => {
    // This test demonstrates LLM validating actual chatbot responses for edge cases
    
    // Ask a vague/ambiguous question that might produce a poor response
    const question = "Tell me about stuff";
    
    await chat.sendMessage(question);
    await chat.waitForAIResponse();
    const aiText = await chat.getLastAIResponse();
    
    const llmValidation = await validateWithOpenRouter(
      question,
      aiText,
      OPENROUTER_API_KEY,
      FREE_MODELS.GEMINI_PRO
    );

    console.log(`\n🔍 REAL CHATBOT EDGE CASE - LLM Analysis:`);
    console.log(`  Question: ${question}`);
    console.log(`  Response: ${aiText.substring(0, 200)}...`);
    console.log(`  Relevance: ${llmValidation.llmValidation?.relevanceScore}/100`);
    console.log(`  Appropriateness: ${llmValidation.llmValidation?.appropriatenessScore}/100`);
    console.log(`  Hallucination: ${llmValidation.llmValidation?.hallucinationDetected ? 'YES' : 'NO'}`);
    console.log(`  Reasoning: ${llmValidation.llmValidation?.reasoning}`);
    console.log(`  Status: ${llmValidation.passed ? '✅ PASSED' : '❌ FAILED'}`);

    // This might fail if chatbot gives a vague or inappropriate response
    expect(llmValidation.llmValidation?.relevanceScore).toBeGreaterThanOrEqual(70);
    expect(llmValidation.llmValidation?.appropriatenessScore).toBeGreaterThanOrEqual(70);

    const reportData = {
      type: 'real-chatbot-edge-case',
      question,
      response: aiText,
      llmValidation: llmValidation.llmValidation,
      passed: llmValidation.passed,
      timestamp: new Date().toISOString()
    };

    saveReport('llm-validation-real-edge-case.json', reportData);
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

    const reportData = {
      question: prompt.text,
      correctnessScore: result.correctnessScore,
      issues: result.reasons,
      timestamp: new Date().toISOString()
    };

    saveReport('answer-correctness-report.json', reportData);

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

    const reportData = {
      question: prompt.text,
      faithfulnessScore: result.faithfulnessScore,
      details: result.reasons,
      timestamp: new Date().toISOString()
    };

    saveReport('faithfulness-report.json', reportData);

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

    saveReport('ai-consistency-report.json', consistencyResults);

  });

});
