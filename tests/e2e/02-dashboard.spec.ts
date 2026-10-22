import { expect, test } from '@playwright/test';
import { signIn } from './support';

// Seeded state at FIXED_NOW = 2026-10-22: 5 findings, 2 overdue (FND-00001, FND-00002).
test.describe('[AC-09] compliance dashboard', () => {
  test('[AC-09] shows coverage, open by severity, overdue by owner and audit progress', async ({ page }) => {
    await signIn(page, 'ravi.auditor');
    await expect(page.getByTestId('stat-open')).toContainText('4');
    await expect(page.getByTestId('stat-overdue')).toContainText('2');
    await expect(page.getByTestId('open-CRITICAL')).toHaveText('1');
    await expect(page.getByTestId('open-HIGH')).toHaveText('2');
    const overdue = page.getByTestId('panel-overdue');
    await expect(overdue).toContainText('Olivia');
    await expect(overdue).toContainText('Omar');
    await expect(page.getByTestId('panel-progress')).toContainText('AUD-2026-0001');
    for (const fw of ['ISO27001', 'SOC2', 'CIS']) await expect(page.getByTestId(`coverage-${fw}`)).toHaveText(/\d+%/);
    await expect(page).toHaveScreenshot('dashboard.png', { fullPage: true });
  });

  test('[AC-08][AC-09] escalated findings carry a badge in the findings list', async ({ page }) => {
    await signIn(page, 'ravi.auditor');
    await page.getByTestId('nav-findings').click();
    await expect(page.getByTestId('row-FND-00001').getByTestId('escalated-badge')).toHaveText('ESCALATED · 33d');
    await expect(page.getByTestId('row-FND-00003').getByTestId('escalated-badge')).toHaveCount(0);
    await expect(page).toHaveScreenshot('findings.png', { fullPage: true });
    await page.getByTestId('filter-state').selectOption('RE_OPEN');
    await expect(page.getByTestId('findings-table').locator('tbody tr')).toHaveCount(1);
  });

  test('[AC-06][AC-09] an owner sees only their own findings and a personal summary', async ({ page }) => {
    await signIn(page, 'olivia.owner');
    await expect(page.getByTestId('owner-summary')).toBeVisible();
    const rows = page.getByTestId('findings-table').locator('tbody tr');
    await expect(rows).toHaveCount(3);
    await expect(page.getByTestId('row-FND-00002')).toHaveCount(0);
    await expect(page).toHaveScreenshot('my-findings.png', { fullPage: true });
  });
});
