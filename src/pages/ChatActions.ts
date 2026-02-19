import { Page, expect } from '@playwright/test';
import { ChatLocators } from './ChatLocators';

export class ChatActions {
  private page: Page;
  private locators: ChatLocators;

  constructor(page: Page, locators: ChatLocators) {
    this.page = page;
    this.locators = locators;
  }

  async openApp() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await this.page.waitForSelector('.targeted-loader-fullhide', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await expect(this.locators.chatWindow).toBeVisible();
  }

  async isChatWindowDisplayed() {
    await expect(this.locators.chatWindow).toBeVisible();
  }

  async clearMessage() {
    await this.locators.inputBox.waitFor({ state: 'visible', timeout: 5000 });
    await this.locators.inputBox.clear();
  }

  async enterMessage(message: string) {
    await this.locators.inputBox.waitFor({ state: 'visible', timeout: 5000 });
    await this.locators.inputBox.fill(message);
  }

  async sendMessage(message: string) {
    await this.locators.inputBox.waitFor({ state: 'visible', timeout: 5000 });
    await this.locators.inputBox.fill(message);
    await this.locators.inputBox.press('Enter');
  }

  async sendMessageWithButton(message: string) {
    await this.locators.inputBox.waitFor({ state: 'visible', timeout: 5000 });
    await this.locators.inputBox.fill(message);
    await this.locators.sendButton.waitFor({ state: 'visible', timeout: 5000 });
    await expect(this.locators.sendButton).toBeEnabled();
    await this.locators.sendButton.click();
  }

  async waitForAIResponse() {
    // Wait for loader to appear (AI is thinking)
    await this.locators.loader.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    
    // Wait for loader to disappear (AI finished thinking)
    await this.locators.loader.waitFor({ state: 'hidden', timeout: 25000 }).catch(() => {});
    
    // Wait for message element to appear
    await this.locators.aiMessage.last().waitFor({ timeout: 25000 });
    
    // Wait for streaming to complete (text content stabilizes)
    await this.page.waitForTimeout(2000);
    
    // Additional check: wait for no text changes (streaming stopped)
    const messageElement = this.locators.aiMessage.last();
    let previousText = '';
    let stableCount = 0;
    
    for (let i = 0; i < 10; i++) {
      const currentText = await messageElement.textContent();
      if (currentText === previousText) {
        stableCount++;
        if (stableCount >= 3) break; // Text stable for 3 checks
      } else {
        stableCount = 0;
        previousText = currentText || '';
      }
      await this.page.waitForTimeout(300);
    }
  }

  async switchSpeechLanguage(lang: string) {
    const langMap: { [key: string]: string } = {
      'KA': 'ka-GE',
      'AR': 'ar-AE',
      'EN': 'en-US',
      'FR': 'fr-FR',
      'ES': 'es-AR',
      'DE': 'de-DE',
      'IT': 'it-IT',
      'PT': 'pt-PT',
      'SV': 'sv-SE',
      'NL': 'nl-NL',
      'DA': 'da-DK',
      'FI': 'fi-FI',
      'EL': 'el-GR',
      'HU': 'hu-HU',
      'NB': 'nb-NO',
      'RO': 'ro-RO',
      'TR': 'tr-TR',
      'CMN': 'cmn-Hant-TW',
      'JA': 'ja-JP',
      'RU': 'ru-RU',
      'KO': 'ko-KR',
      'PL': 'pl-PL',
      'CA': 'ca-ES',
      'UR': 'ur-IN',
      'HI': 'hi-IN',
      'BN': 'bn-BD',
      'ID': 'id-ID',
      'TH': 'th-TH',
      'VI': 'vi-VN',
      'HE': 'he-IL',
      'UK': 'uk-UA'
    };
    
    const selectValue = langMap[lang.toUpperCase()] || lang;
    await this.locators.languageSelect.selectOption(selectValue);
    await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await this.page.waitForTimeout(500);
  }

  async toggleLanguageButton(lang: string) {
    // Click the language toggle button in top-right corner
    const toggle = lang.toUpperCase() === 'AR' 
      ? this.locators.arabicToggle 
      : this.locators.englishToggle;
    
    await toggle.waitFor({ state: 'visible', timeout: 5000 });
    await toggle.click();
    
    // Wait for page to reload/refresh with new language
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await this.page.waitForSelector('.targeted-loader-fullhide', { state: 'hidden', timeout: 10000 }).catch(() => {});
    
    // Ensure chat window is still visible after refresh
    await expect(this.locators.chatWindow).toBeVisible();
  }
}
