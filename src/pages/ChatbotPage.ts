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

  public get sendButton() {
    return this.locators.sendButton;
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

  async isChatWindowDisplayed() {
    return this.actions.isChatWindowDisplayed();
  }

  async clearMessage() {
    return this.actions.clearMessage();
  }

  async enterMessage(message: string) {
    return this.actions.enterMessage(message);
  }

  async sendMessage(message: string) {
    return this.actions.sendMessage(message);
  }

  async waitForAIResponse() {
    return this.actions.waitForAIResponse();
  }

  async switchSpeechLanguage(lang: string) {
    return this.actions.switchSpeechLanguage(lang);
  }

  async toggleLanguageButton(lang: string) {
    return this.actions.toggleLanguageButton(lang);
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
