import { test, expect } from '@playwright/test';
import { ChatbotPage } from '../src/pages/ChatBotPage';
import uiData from '../test-data/ui-data.json';

test.describe('U-Ask Chatbot UI Behavior (Data Driven)', () => {

  let chat: ChatbotPage;

  test.beforeEach(async ({ page }) => {
    chat = new ChatbotPage(page);
    await chat.openApp();
    await chat.openChat();
  });

  test('Chat widget loads and opens correctly', async () => {
    expect(chat.chatWindow).toBeVisible();
  });

  test('User can send message via input box', async () => {
    await chat.sendMessage(uiData.basicMessages.english);

    const userText = await chat.getLastUserMessage();

    expect(userText).toContain(uiData.basicMessages.english);
  });

  test('AI response renders properly', async () => {
    await chat.sendMessage(uiData.basicMessages.aiQuery);

    await chat.waitForAIResponse();

    const aiText = await chat.getLastAIResponse();

    expect(aiText.length).toBeGreaterThan(uiData.minAiResponseLength);
  });

  test('Input is cleared after sending message', async () => {
    await chat.sendMessage(uiData.basicMessages.english);

    const inputValue = await chat.getInputValue();

    expect(inputValue).toBe('');
  });

});
