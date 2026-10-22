import { expect, type Page } from '@playwright/test';

/** Signs in with a demo user button and waits for that role's home page. */
export async function signIn(page: Page, username: string) {
  await page.goto('/');
  await page.evaluate(() => sessionStorage.clear());
  await page.goto('/#/');
  await page.reload();
  await page.getByTestId(`login-${username}`).click();
  await expect(page.getByTestId('whoami')).toHaveText(username);
}

export async function signOut(page: Page) {
  if (await page.getByTestId('menu-toggle').isVisible()) await page.getByTestId('menu-toggle').click();
  await page.getByTestId('sign-out').click();
  await expect(page.getByTestId('login-alice.admin')).toBeVisible();
}
