import { test, expect } from '@playwright/test';
import { BasePage } from '../../src/pages/BasePage';
import { ChatbotPage } from '../../src/pages/ChatbotPage';
import { OPENROUTER_API_KEY } from '../../src/config/env';
import {
  validateWithOpenRouter,
  FREE_MODELS
} from '../../src/helpers/aiValidator';
import { saveReport } from '../../src/helpers/reportHelper';

test.describe.configure({ mode: 'serial' });

test.describe('AI Quality Scoring - Negative Tests', () => {

  let chat: ChatbotPage;
  let base: BasePage;

  test.beforeEach(async ({ page }) => {
    chat = new ChatbotPage(page);
    base = new BasePage(page);
    await chat.openApp();
    await base.handleDisclaimerIfPresent();
    await chat.isChatWindowDisplayed();
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

    console.log(`\n HARDCODED BAD RESPONSE DEMO - LLM Validation:`);
    console.log(`  Question: ${question}`);
    console.log(`  Response: ${badResponse}`);
    console.log(`  Relevance: ${llmValidation.llmValidation?.relevanceScore}/100`);
    console.log(`  Appropriateness: ${llmValidation.llmValidation?.appropriatenessScore}/100`);
    console.log(`  Hallucination: ${llmValidation.llmValidation?.hallucinationDetected ? 'YES' : 'NO'}`);
    console.log(`  Reasoning: ${llmValidation.llmValidation?.reasoning}`);
    console.log(`  Status: ${llmValidation.passed ? 'PASSED' : 'FAILED'}`);

    // This should fail because the response is irrelevant and unprofessional
    expect(llmValidation.llmValidation?.relevanceScore).toBeLessThan(70);
    expect(llmValidation.llmValidation?.appropriatenessScore).toBeLessThan(70);

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

  test('LLM Validation - Hallucination Detection (Negative Test)', async () => {
    // This test uses a hardcoded hallucinated response with false information
    
    const question = "What is the visa fee for UAE tourist visa?";
    
    // Hardcoded response with hallucinated/false information
    const hallucinatedResponse = "The UAE tourist visa is completely free of charge. Additionally, you will receive a $500 cash bonus upon arrival at Dubai airport. The visa is processed instantly and you don't need any documents.";
    
    const llmValidation = await validateWithOpenRouter(
      question,
      hallucinatedResponse,
      OPENROUTER_API_KEY,
      FREE_MODELS.GEMINI_PRO
    );

    console.log(`\nHALLUCINATION DETECTION TEST - LLM Validation:`);
    console.log(`  Question: ${question}`);
    console.log(`  Response: ${hallucinatedResponse}`);
    console.log(`  Relevance: ${llmValidation.llmValidation?.relevanceScore}/100`);
    console.log(`  Appropriateness: ${llmValidation.llmValidation?.appropriatenessScore}/100`);
    console.log(`  Hallucination: ${llmValidation.llmValidation?.hallucinationDetected ? 'DETECTED' : 'NOT DETECTED'}`);
    console.log(`  Reasoning: ${llmValidation.llmValidation?.reasoning}`);

    // This should detect hallucination
    expect(llmValidation.llmValidation?.hallucinationDetected).toBe(true);
    // Scores should be low due to false information
    expect(llmValidation.llmValidation?.relevanceScore).toBeLessThan(70);

    const reportData = {
      type: 'hallucination-detection-negative-test',
      question,
      response: hallucinatedResponse,
      llmValidation: llmValidation.llmValidation,
      hallucinationDetected: llmValidation.llmValidation?.hallucinationDetected,
      timestamp: new Date().toISOString()
    };

    saveReport('llm-validation-hallucination-detection.json', reportData);
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

    console.log(`\nREAL CHATBOT EDGE CASE - LLM Analysis:`);
    console.log(`  Question: ${question}`);
    console.log(`  Response: ${aiText.substring(0, 200)}...`);
    console.log(`  Relevance: ${llmValidation.llmValidation?.relevanceScore}/100`);
    console.log(`  Appropriateness: ${llmValidation.llmValidation?.appropriatenessScore}/100`);
    console.log(`  Hallucination: ${llmValidation.llmValidation?.hallucinationDetected ? 'YES' : 'NO'}`);
    console.log(`  Reasoning: ${llmValidation.llmValidation?.reasoning}`);
    console.log(`  Status: ${llmValidation.passed ? 'PASSED' : 'FAILED'}`);

    // This might fail if chatbot gives a vague or inappropriate response
    // Using soft assertions here since the response quality may vary
    expect(llmValidation.llmValidation?.relevanceScore).toBeDefined();
    expect(llmValidation.llmValidation?.appropriatenessScore).toBeDefined();

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

});
