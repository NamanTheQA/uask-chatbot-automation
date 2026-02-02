import { AxeBuilder } from '@axe-core/playwright';
import { Page } from '@playwright/test';

/**
 * Runs accessibility audit on chatbot UI
 * Uses axe-core WCAG rules
 */
export async function runA11y(page: Page, selector?: string) {

  // Inject axe accessibility engine
  const axeBuilder = new AxeBuilder({ page });

  // If selector is provided, scan only chatbot area
  if (selector) {
    const results = await axeBuilder
      .include(selector)
      .analyze();
    console.log('A11y violations:', results.violations.length);
  }
  // Otherwise scan entire page
  else {
    const results = await axeBuilder.analyze();
    console.log('A11y violations:', results.violations.length);
  }
}