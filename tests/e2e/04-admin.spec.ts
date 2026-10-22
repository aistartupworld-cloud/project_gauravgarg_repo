import { expect, test } from '@playwright/test';
import { signIn } from './support';

test.describe('[AC-01][AC-08][AC-10] admin console', () => {
  test('[AC-08] escalations are ordered by severity, then days overdue', async ({ page }) => {
    await signIn(page, 'alice.admin');
    await page.getByTestId('nav-admin').click();
    await page.getByTestId('tab-escalations').click();
    const items = page.getByTestId('escalations-panel').locator('li');
    await expect(items).toHaveCount(2);
    await expect(items.nth(0)).toContainText('FND-00001');
    await expect(items.nth(1)).toContainText('FND-00002');
  });

  test('[AC-05] SLA rule history is visible and versioned', async ({ page }) => {
    await signIn(page, 'alice.admin');
    await page.getByTestId('nav-admin').click();
    await page.getByTestId('tab-sla').click();
    await expect(page.getByTestId('sla-panel')).toContainText('Active rule set: v1');
    await expect(page).toHaveScreenshot('admin-sla.png', { fullPage: true });
  });

  test('[AC-01] a draft control can be created and published', async ({ page }) => {
    await signIn(page, 'alice.admin');
    await page.getByTestId('nav-admin').click();
    await page.getByTestId('tab-controls').click();
    await page.getByTestId('control-framework').selectOption('CIS');
    await page.getByTestId('control-id').fill('CIS-99.1');
    await page.getByTestId('control-title').fill('Synthetic e2e control');
    await page.getByTestId('control-category').fill('Testing');
    await page.getByTestId('control-description').fill('Created by the Playwright suite.');
    await page.getByTestId('control-create').click();
    await page.getByTestId('publish-CIS-99.1').click();
    await expect(page.getByTestId('publish-CIS-99.1')).toHaveCount(0);
  });

  test('[AC-10] the users panel lists every role', async ({ page }) => {
    await signIn(page, 'alice.admin');
    await page.getByTestId('nav-admin').click();
    await expect(page.getByTestId('role-olivia.owner')).toHaveValue('OWNER');
    await expect(page.getByTestId('role-rhea.reviewer')).toHaveValue('REVIEWER');
  });
});
