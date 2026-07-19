import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

export async function expectNoSeriousAccessibilityViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze();
  const violations = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical'
  );
  if (violations.length > 0) {
    throw new Error(
      violations
        .map(
          (violation) =>
            `${violation.id}: ${violation.help}\n${violation.nodes
              .map((node) => `  ${node.target.join(' ')}: ${node.failureSummary ?? ''}`)
              .join('\n')}`
        )
        .join('\n\n')
    );
  }
  expect(violations).toEqual([]);
}
