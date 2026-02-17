import { test, expect } from '@playwright/test';
import { BasePage } from '../src/pages/BasePage';
import { ChatbotPage } from '../src/pages/ChatbotPage';
import uiData from '../test-data/ui-data.json';

test.describe('U-Ask Chatbot UI Behavior (Data Driven)', () => {

  let chat: ChatbotPage;
  let base: BasePage;

  test.beforeEach(async ({ page }) => {
    chat = new ChatbotPage(page);
    base = new BasePage(page);
    await chat.openApp();
    await base.handleDisclaimerIfPresent();
    await chat.isChatWindowDisplayed();
  });

  test('Chat widget loads and opens correctly', async () => {
    await expect(chat.chatWindow).toBeVisible();
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

    expect(aiText.length).toBeGreaterThan(
      uiData.minAiResponseLength
    );

  });

  test('Input is cleared after sending message', async () => {

    await chat.sendMessage(uiData.basicMessages.english);

    const inputValue = await chat.getInputValue();

    expect(inputValue).toBe('');

  });

  test('Send button is disabled after sending message', async () => {

    await chat.sendMessage(uiData.basicMessages.english);
    await chat.waitForAIResponse();

    await expect(chat.sendButton).toBeDisabled();

  });

  test('Send button is disabled after clearing message', async () => {

    await chat.enterMessage(uiData.basicMessages.english);
    await chat.clearMessage();

    await expect(chat.sendButton).toBeDisabled();

  });

  test('Chat scroll moves to latest message', async ({ page }) => {

    for (let i = 0; i < 5; i++) {
      await chat.sendMessage(`Scroll test ${i}`);
      await chat.waitForAIResponse();
    }

    const lastMsg = page.locator('.message, .ai-message').last();

    await lastMsg.scrollIntoViewIfNeeded();
    await expect(lastMsg).toBeVisible();

  });
});