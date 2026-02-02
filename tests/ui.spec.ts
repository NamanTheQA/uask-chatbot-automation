import { test, expect } from '@playwright/test';
import { ChatbotPage } from '../src/pages/ChatBotPage';

test.describe('U-Ask Chatbot UI Behavior', () => {

  test('Chat widget loads and opens correctly', async ({ page }) => {

    const chat = new ChatbotPage(page);

    await chat.openApp();
    await chat.openChat();

  });

  test('User can send message via input box', async ({ page }) => {

    const chat = new ChatbotPage(page);

    await chat.openApp();
    await chat.openChat();

    await chat.sendMessage('Hello');

    const userText = await chat.getLastUserMessage();
    expect(userText).toContain('Hello');

  });

  test('AI response renders properly', async ({ page }) => {

    const chat = new ChatbotPage(page);

    await chat.openApp();
    await chat.openChat();

    await chat.sendMessage('How can I check UAE visa status?');

    await chat.waitForAIResponse();

    const aiText = await chat.getLastAIResponse();
    expect(aiText.length).toBeGreaterThan(10);

  });

  test('Input is cleared after sending message', async ({ page }) => {

    const chat = new ChatbotPage(page);

    await chat.openApp();
    await chat.openChat();

    await chat.sendMessage('Ping test');

    const inputValue = await chat.getInputValue();
    expect(inputValue).toBe('');

  });

  test('Language toggle works with correct LTR and RTL layout', async ({ page }) => {

    const chat = new ChatbotPage(page);

    await chat.openApp();
    await chat.openChat();

    // Arabic RTL
    await chat.switchToArabic();
    await chat.sendMessage('مرحبا');

    const rtlDirection = await chat.getLastMessageDirection();
    expect(rtlDirection).toBe('rtl');

    // English LTR
    await chat.switchToEnglish();
    await chat.sendMessage('Hello');

    const ltrDirection = await chat.getLastMessageDirection();
    expect(ltrDirection).toBe('ltr');

  });

});
