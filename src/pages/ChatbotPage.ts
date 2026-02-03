import { Page } from '@playwright/test';
import { ChatLocators } from './ChatLocators';
import { ChatActions } from './ChatActions';
import { ChatDataExtractor } from './ChatDataExtractor';

export class ChatbotPage {

  private locators: ChatLocators;
  private actions: ChatActions;
  private extractor: ChatDataExtractor;

  // Public access to chatWindow for tests
  public get chatWindow() {
    return this.locators.chatWindow;
  }

  constructor(page: Page) {
    this.locators = new ChatLocators(page);
    this.actions = new ChatActions(page, this.locators);
    this.extractor = new ChatDataExtractor(this.locators);
  }

  // Delegate methods from ChatActions
  async openApp() {
    return this.actions.openApp();
  }

  async openChat() {
    return this.actions.openChat();
  }

  async sendMessage(message: string) {
    return this.actions.sendMessage(message);
  }

  async waitForAIResponse() {
    return this.actions.waitForAIResponse();
  }

  async switchLanguage(lang: 'AR' | 'EN') {
    return this.actions.switchLanguage(lang);
  }

  async switchToArabic() {
    return this.actions.switchToArabic();
  }

  async switchToEnglish() {
    return this.actions.switchToEnglish();
  }

  // Delegate methods from ChatDataExtractor
  async getLastUserMessage() {
    return this.extractor.getLastUserMessage();
  }

  async getLastAIResponse() {
    return this.extractor.getLastAIResponse();
  }

  async getInputValue() {
    return this.extractor.getInputValue();
  }

  async getLastMessageDirection() {
    return this.extractor.getLastMessageDirection();
  }

}
