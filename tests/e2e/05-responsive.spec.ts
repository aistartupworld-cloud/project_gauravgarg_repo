import { expect, test } from '@playwright/test';
import { signIn } from './support';

test.describe('[AC-09] responsive layout', () => {
  test('[AC-09] the shell adapts to the viewport and never scrolls sideways', async ({ page }) => {
    await signIn(page, 'ravi.auditor');
    const nav = page.getByRole('navigation', { name: 'Main' });
    const mobile = (page.viewportSize()?.width ?? 1280) < 768;
    const go = async (testId: string) => {
      if (mobile) await page.getByTestId('menu-toggle').click();
      await page.getByTestId(testId).click();
    };
    if (mobile) await expect(nav).toBeHidden();
    else await expect(page.getByTestId('menu-toggle')).toBeHidden();

    await go('nav-findings');
    if (mobile) await expect(nav).toBeHidden();
    await expect(page.getByTestId('findings-table')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);

    await go('nav-dashboard');
    await expect(page.getByTestId('panel-coverage')).toBeVisible();
    await expect(page).toHaveScreenshot('dashboard-responsive.png', { fullPage: true });
  });
});
