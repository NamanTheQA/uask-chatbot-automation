import { AxeBuilder } from '@axe-core/playwright';
import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Runs accessibility audit on chatbot UI
 * Uses axe-core WCAG rules
 */
export async function runA11y(page: Page, selector?: string) {

  // Inject axe accessibility engine
  const axeBuilder = new AxeBuilder({ page });

  // Run the analysis (scoped if selector provided)
  const results = selector
    ? await axeBuilder.include(selector).analyze()
    : await axeBuilder.analyze();

  // Ensure output directory exists and write full results for triage
  const outDir = path.join(process.cwd(), 'reports', 'a11y');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `a11y-results-${Date.now()}.json`);
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2), 'utf8');

  const violations = results.violations || [];
  console.log(`A11y violations: ${violations.length} (saved to ${outFile})`);

  // Fail the test if any violations are found, so CI fails fast.
  if (violations.length > 0) {
    // Provide concise violation summary in the error message
    const summary = violations.map((v: any) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })).slice(0, 10);
    // Throw to fail the Playwright test
    throw new Error(`Accessibility violations found: ${violations.length}. Summary: ${JSON.stringify(summary)}. Full report: ${outFile}`);
  }
}