import { test, expect } from '@playwright/test';
import { BasePage } from '../../src/pages/BasePage';
import { ChatbotPage } from '../../src/pages/ChatbotPage';
import { validateWithOpenRouter, validateAIResponseWithLLM, FREE_MODELS } from '../../src/helpers/aiValidator';
import { saveReport } from '../../src/helpers/reportHelper';
import aiPrompts from '../../src/test-data/ai-prompts.json';
import { OPENROUTER_API_KEY } from '../../src/config/env';

test.describe('AI LLM Validation Suite', () => {
  let basePage: BasePage;
  let chatbotPage: ChatbotPage;

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page);
    chatbotPage = new ChatbotPage(page);

    await chatbotPage.openApp();
    await basePage.handleDisclaimerIfPresent();
    await chatbotPage.isChatWindowDisplayed();
  });

  test('OpenRouter LLM Validation - Single Response', async ({ page }) => {
    const testCase = aiPrompts[0];
    
    const startTime = Date.now();
    await chatbotPage.sendMessage(testCase.text);    
    await chatbotPage.waitForAIResponse();
    const responseTime = Date.now() - startTime;
    
    const aiResponse = await chatbotPage.getLastAIResponse();
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('LLM VALIDATION TEST');
    console.log(`${'='.repeat(60)}`);
    console.log(`Question: ${testCase.text}`);
    console.log(`Response: ${aiResponse.substring(0, 150)}...`);
    console.log(`Response Time: ${responseTime}ms\n`);

    // Validate with OpenRouter LLM
    const validation = await validateWithOpenRouter(
      testCase.text,
      aiResponse,
      OPENROUTER_API_KEY,
      FREE_MODELS.GEMINI_FLASH
    );

    console.log('LLM Validation Results:');
    console.log(`  Model: ${validation.llmValidation?.model}`);
    console.log(`  Relevance Score: ${validation.llmValidation?.relevanceScore}/100`);
    console.log(`  Appropriateness Score: ${validation.llmValidation?.appropriatenessScore}/100`);
    console.log(`  Hallucination Detected: ${validation.llmValidation?.hallucinationDetected ? 'YES ⚠️' : 'NO ✓'}`);
    console.log(`  Reasoning: ${validation.llmValidation?.reasoning}`);
    console.log(`  Overall Pass: ${validation.passed ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`${'='.repeat(60)}\n`);

    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      question: testCase.text,
      response: aiResponse,
      responseTimeMs: responseTime,
      validation,
      testPassed: validation.passed,
    };

    saveReport('llm-single-validation.json', report);

    // Assertions
    expect(validation.llmValidation?.relevanceScore).toBeGreaterThanOrEqual(70);
    expect(validation.llmValidation?.appropriatenessScore).toBeGreaterThanOrEqual(70);
    expect(validation.llmValidation?.hallucinationDetected).toBe(false);
    expect(validation.passed).toBe(true);
  });

  test.skip('Enhanced Validation - Traditional + LLM Combined', async ({ page }) => {
    const testCase = aiPrompts[1]; // Second test case
    
    const startTime = Date.now();
    await chatbotPage.sendMessage(testCase.text);
    await chatbotPage.waitForAIResponse();
    const responseTime = Date.now() - startTime;
    
    const aiResponse = await chatbotPage.getLastAIResponse();
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('ENHANCED VALIDATION (Traditional + LLM)');
    console.log(`${'='.repeat(60)}`);
    console.log(`Question: ${testCase.text}`);
    console.log(`Response: ${aiResponse.substring(0, 150)}...`);

    // Run combined validation
    const validation = await validateAIResponseWithLLM(
      testCase.text,
      aiResponse,
      {
        expectedKeywords: testCase.keywords,
        responseTimeMs: responseTime,
        minScore: 60,
        openRouterApiKey: process.env.OPENROUTER_API_KEY,
        openRouterModel: FREE_MODELS.GEMINI_FLASH,
        useLLM: true,
      }
    );

    console.log('\nTraditional Validation:');
    console.log(`  Overall Score: ${validation.traditional.score}/100`);
    console.log(`  Hallucination Risk: ${validation.traditional.hallucinationRisk}%`);
    console.log(`  Context Precision: ${validation.traditional.contextPrecision}%`);
    console.log(`  Context Recall: ${validation.traditional.contextRecall}%`);

    console.log('\nLLM Validation:');
    console.log(`  Relevance Score: ${validation.llm?.llmValidation?.relevanceScore}/100`);
    console.log(`  Appropriateness: ${validation.llm?.llmValidation?.appropriatenessScore}/100`);
    console.log(`  Hallucination: ${validation.llm?.llmValidation?.hallucinationDetected ? 'YES' : 'NO'}`);
    console.log(`  Reasoning: ${validation.llm?.llmValidation?.reasoning}`);

    console.log(`\nOverall Result: ${validation.overallPassed ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`${'='.repeat(60)}\n`);

    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      question: testCase.text,
      response: aiResponse,
      validation,
      testPassed: validation.overallPassed,
    };

    saveReport('llm-enhanced-validation.json', report);

    // Assertions
    expect(validation.traditional.score).toBeGreaterThanOrEqual(60);
    expect(validation.llm?.passed).toBe(true);
    expect(validation.overallPassed).toBe(true);
  });

  test.skip('LLM Batch Validation - Multiple Prompts', async ({ page }) => {
    const testCases = aiPrompts.slice(0, 3); // First 3 prompts
    const results = [];

    console.log(`\n${'='.repeat(60)}`);
    console.log('BATCH LLM VALIDATION');
    console.log(`Testing ${testCases.length} prompts`);
    console.log(`${'='.repeat(60)}\n`);

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      
      console.log(`[${i + 1}/${testCases.length}] ${testCase.text}`);
      
      const startTime = Date.now();
      await chatbotPage.sendMessage(testCase.text);
      await chatbotPage.waitForAIResponse();
      const responseTime = Date.now() - startTime;
      
      const aiResponse = await chatbotPage.getLastAIResponse();
      
      // Validate with LLM
      const validation = await validateWithOpenRouter(
        testCase.text,
        aiResponse,
        process.env.OPENROUTER_API_KEY,
        FREE_MODELS.GEMINI_FLASH
      );

      const result = {
        question: testCase.text,
        response: aiResponse,
        responseTimeMs: responseTime,
        relevanceScore: validation.llmValidation?.relevanceScore,
        appropriatenessScore: validation.llmValidation?.appropriatenessScore,
        hallucinationDetected: validation.llmValidation?.hallucinationDetected,
        reasoning: validation.llmValidation?.reasoning,
        passed: validation.passed,
      };

      results.push(result);

      console.log(`  Relevance: ${result.relevanceScore}/100 | Appropriateness: ${result.appropriatenessScore}/100`);
      console.log(`  Hallucination: ${result.hallucinationDetected ? 'YES ⚠️' : 'NO ✓'} | Status: ${result.passed ? 'PASS ✓' : 'FAIL ✗'}\n`);
      
      // Small delay between questions
      await page.waitForTimeout(1500);
    }

    // Summary
    const passCount = results.filter(r => r.passed).length;
    const avgRelevance = results.reduce((sum, r) => sum + (r.relevanceScore || 0), 0) / results.length;
    const avgAppropriateness = results.reduce((sum, r) => sum + (r.appropriatenessScore || 0), 0) / results.length;
    
    console.log(`${'='.repeat(60)}`);
    console.log('BATCH VALIDATION SUMMARY');
    console.log(`${'='.repeat(60)}`);
    console.log(`Total Tests: ${results.length}`);
    console.log(`Passed: ${passCount} | Failed: ${results.length - passCount}`);
    console.log(`Average Relevance Score: ${avgRelevance.toFixed(1)}/100`);
    console.log(`Average Appropriateness: ${avgAppropriateness.toFixed(1)}/100`);
    console.log(`${'='.repeat(60)}\n`);

    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      totalTests: results.length,
      passed: passCount,
      failed: results.length - passCount,
      averageRelevance: avgRelevance,
      averageAppropriateness: avgAppropriateness,
      results,
    };

    saveReport('llm-batch-validation.json', report);

    // Assertions
    expect(passCount).toBeGreaterThanOrEqual(Math.ceil(results.length * 0.8)); // 80% pass rate
    expect(avgRelevance).toBeGreaterThanOrEqual(70);
    expect(avgAppropriateness).toBeGreaterThanOrEqual(70);
  });

  test.skip('Compare Free Models - Model Performance Analysis', async ({ page }) => {
    const testCase = aiPrompts[0];
    
    await chatbotPage.sendMessage(testCase.text);
    await chatbotPage.waitForAIResponse();
    const aiResponse = await chatbotPage.getLastAIResponse();
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('FREE MODEL COMPARISON');
    console.log(`${'='.repeat(60)}`);
    console.log(`Question: ${testCase.text}\n`);

    const models = [
      { name: 'Gemini Flash', id: FREE_MODELS.GEMINI_FLASH },
      { name: 'Llama 3.2 3B', id: FREE_MODELS.LLAMA_3_2_3B },
      { name: 'Mistral 7B', id: FREE_MODELS.MISTRAL_7B },
    ];

    const modelResults = [];

    for (const model of models) {
      console.log(`Testing ${model.name}...`);
      
      try {
        const validation = await validateWithOpenRouter(
          testCase.text,
          aiResponse,
          process.env.OPENROUTER_API_KEY,
          model.id
        );

        const result = {
          model: model.name,
          modelId: model.id,
          relevanceScore: validation.llmValidation?.relevanceScore,
          appropriatenessScore: validation.llmValidation?.appropriatenessScore,
          hallucinationDetected: validation.llmValidation?.hallucinationDetected,
          reasoning: validation.llmValidation?.reasoning,
          passed: validation.passed,
        };

        modelResults.push(result);

        console.log(`  ✓ Relevance: ${result.relevanceScore} | Appropriateness: ${result.appropriatenessScore}`);
        console.log(`    ${result.reasoning}\n`);
      } catch (error) {
        console.log(`  ✗ Failed: ${error}\n`);
        modelResults.push({
          model: model.name,
          modelId: model.id,
          error: String(error),
        });
      }

      // Delay between API calls
      await page.waitForTimeout(2000);
    }

    console.log(`${'='.repeat(60)}\n`);

    // Save comparison report
    const report = {
      timestamp: new Date().toISOString(),
      question: testCase.text,
      response: aiResponse,
      modelResults,
    };

    saveReport('llm-model-comparison.json', report);

    // At least one model should pass
    const passCount = modelResults.filter(r => 'passed' in r && r.passed).length;
    expect(passCount).toBeGreaterThan(0);
  });
});
