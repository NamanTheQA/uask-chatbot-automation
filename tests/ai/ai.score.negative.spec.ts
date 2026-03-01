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
    const question = "How can I check UAE visa status?";
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
    const question = "What is the visa fee for UAE tourist visa?";
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

    const hallucinationDetected = llmValidation.llmValidation?.hallucinationDetected === true;
    const hasLowScores = (llmValidation.llmValidation?.relevanceScore ?? 100) < 30 || 
                         (llmValidation.llmValidation?.appropriatenessScore ?? 100) < 30;
    
    expect(hallucinationDetected || hasLowScores).toBe(true);

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

  test('LLM Validation - Subtle Hallucination Missed', async () => {
    const question = "How can I check the status of my visa application?";
    const subtleHallucinationResponse = "You can check your visa application status through the official ICP portal (icp.gov.ae). Login with your Emirates ID credentials and navigate to the 'My Applications' section. The system is updated every 48 hours with the latest application status.";
    
    const llmValidation = await validateWithOpenRouter(
      question,
      subtleHallucinationResponse,
      OPENROUTER_API_KEY,
      FREE_MODELS.GEMINI_PRO
    );

    console.log(`\nSUBTLE HALLUCINATION TEST - LLM Validation:`);
    console.log(`  Question: ${question}`);
    console.log(`  Response: ${subtleHallucinationResponse}`);
    console.log(`  Relevance: ${llmValidation.llmValidation?.relevanceScore}/100`);
    console.log(`  Appropriateness: ${llmValidation.llmValidation?.appropriatenessScore}/100`);
    console.log(`  Hallucination: ${llmValidation.llmValidation?.hallucinationDetected ? 'DETECTED' : 'NOT DETECTED'}`);
    console.log(`  Reasoning: ${llmValidation.llmValidation?.reasoning}`);

    const hallucinationNotDetected = llmValidation.llmValidation?.hallucinationDetected === false;
    const hasHighScores = (llmValidation.llmValidation?.relevanceScore ?? 0) >= 70 && 
                          (llmValidation.llmValidation?.appropriatenessScore ?? 0) >= 70;
    
    expect(hallucinationNotDetected && hasHighScores).toBe(true);

    const reportData = {
      type: 'subtle-hallucination-missed',
      question,
      response: subtleHallucinationResponse,
      llmValidation: llmValidation.llmValidation,
      hallucinationDetected: llmValidation.llmValidation?.hallucinationDetected,
      hallucinationNote: 'The "48 hours update frequency" is fabricated',
      timestamp: new Date().toISOString()
    };

    saveReport('llm-validation-subtle-hallucination.json', reportData);
  });

});
