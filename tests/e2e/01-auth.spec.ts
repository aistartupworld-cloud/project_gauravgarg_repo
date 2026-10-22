import { expect, test } from '@playwright/test';
import { signIn, signOut } from './support';

test.describe('[AC-10] role-based sign-in and navigation', () => {
  test('[AC-10] login page lists the synthetic demo users', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /SecureGate/ })).toBeVisible();
    await expect(page).toHaveScreenshot('login.png');
  });

  test('[AC-10] each role lands on its home page and sees only its menu', async ({ page }) => {
    const cases: Array<[string, RegExp, string[], string[]]> = [
      ['alice.admin', /#\/dashboard$/, ['Dashboard', 'Admin console'], ['Review queue', 'My findings']],
      ['ravi.auditor', /#\/dashboard$/, ['Dashboard', 'Audits', 'Findings'], ['Admin console', 'Review queue']],
      ['olivia.owner', /#\/my-findings$/, ['My findings'], ['Dashboard', 'Audits', 'Admin console']],
      ['rhea.reviewer', /#\/reviews$/, ['Review queue', 'Findings'], ['Admin console', 'My findings']],
    ];
    for (const [user, home, visible, hidden] of cases) {
      await signIn(page, user);
      await expect(page).toHaveURL(home);
      const nav = page.getByRole('navigation', { name: 'Main' });
      for (const label of visible) await expect(nav.getByRole('link', { name: label, exact: true })).toBeVisible();
      for (const label of hidden) await expect(nav.getByRole('link', { name: label, exact: true })).toHaveCount(0);
      await signOut(page);
    }
  });

  test('[AC-10] an owner who types an admin URL is sent back home', async ({ page }) => {
    await signIn(page, 'olivia.owner');
    await page.goto('/#/admin');
    await expect(page).toHaveURL(/#\/my-findings$/);
  });

  test('[AC-10] unknown users get a clear error', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('login-username').fill('mallory');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByTestId('form-error')).toContainText(/unknown/i);
  });
});
