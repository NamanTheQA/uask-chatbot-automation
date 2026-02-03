import { ChatLocators } from './ChatLocators';

export class ChatDataExtractor {
  private locators: ChatLocators;

  constructor(locators: ChatLocators) {
    this.locators = locators;
  }

  async getLastUserMessage() {
    return await this.locators.userMessage.last().innerText();
  }

  async getLastAIResponse() {
    return await this.locators.aiMessage.last().innerText();
  }

  async getInputValue() {
    return await this.locators.inputBox.inputValue();
  }

  async getLastMessageDirection() {
    return await this.locators.userMessage.last().evaluate(el =>
      window.getComputedStyle(el).direction
    );
  }
}
