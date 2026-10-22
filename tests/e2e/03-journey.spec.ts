import { expect, test } from '@playwright/test';
import { signIn, signOut } from './support';

// The end-to-end story from the brief: plan → record → remediate → review, across three roles.
test('[AC-02][AC-03][AC-04][AC-05][AC-06][AC-07] audit to remediation across roles', async ({ page }) => {
  // Auditor plans an audit and starts fieldwork.
  await signIn(page, 'ravi.auditor');
  await page.getByTestId('nav-audits').click();
  await page.getByTestId('audit-framework').selectOption('CIS');
  await page.getByTestId('audit-title').fill('CIS quick check — build servers');
  await page.getByTestId('audit-end').fill('2026-12-15');
  await page.getByTestId('audit-create').click();
  await expect(page).toHaveURL(/#\/audits\/AUD-2026-0004$/);
  await expect(page.getByRole('heading', { name: /CIS quick check/ })).toContainText('PLANNED');
  await page.getByTestId('audit-advance').click();
  await expect(page.getByRole('heading', { name: /CIS quick check/ })).toContainText('IN PROGRESS');

  // AC-04: record a finding; AC-05: due date comes from the SLA (HIGH = 30 days from 2026-10-22).
  const form = page.getByTestId('record-finding');
  await form.getByTestId('finding-control').selectOption({ index: 1 });
  await form.getByTestId('finding-severity').selectOption('HIGH');
  await form.getByTestId('finding-owner').selectOption({ label: 'Olivia Owner' });
  await form.getByTestId('finding-title').fill('Build agents run as root');
  await form.getByTestId('finding-ref').fill('WP-CIS-07');
  await form.getByTestId('finding-description').fill('Synthetic: CI runners execute jobs with uid 0.');
  await form.getByTestId('finding-create').click();
  await expect(page.getByTestId('row-FND-00006')).toBeVisible();
  await page.getByTestId('row-FND-00006').getByRole('link').click();
  await expect(page.getByTestId('due-date')).toHaveText('2026-11-21');
  await signOut(page);

  // Owner: bad evidence is rejected field by field, then valid evidence moves it to review.
  await signIn(page, 'olivia.owner');
  await page.goto('/#/findings/FND-00006');
  await page.getByTestId('evidence-file').fill('runner-config.txt');
  await page.getByTestId('evidence-size').fill('0');
  await page.getByTestId('evidence-sha').fill('nope');
  await page.getByTestId('evidence-submit').click();
  await expect(page.getByTestId('form-error')).toBeVisible();
  await page.getByTestId('evidence-size').fill('1832');
  await page.getByTestId('evidence-sha').fill('e'.repeat(64));
  await page.getByTestId('evidence-note').fill('Runners now use an unprivileged user.');
  await page.getByTestId('evidence-submit').click();
  await expect(page.getByRole('heading', { name: /Build agents run as root/ })).toContainText('AWAITING REVIEW');
  await expect(page.getByTestId('evidence-list')).toContainText('runner-config.txt');
  await signOut(page);

  // Reviewer: the queue shows it; a comment is required; approval is final.
  await signIn(page, 'rhea.reviewer');
  await expect(page.getByTestId('review-queue')).toContainText('FND-00006');
  await page.getByTestId('review-queue').getByRole('link', { name: 'FND-00006' }).click();
  await page.getByTestId('review-approve').click();
  await expect(page.getByTestId('form-error')).toBeVisible();
  await page.getByTestId('review-comment').fill('Checked runner config in the export; uid 1001.');
  await page.getByTestId('review-approve').click();
  await expect(page.getByRole('heading', { name: /Build agents run as root/ })).toContainText('REMEDIATED');
  await expect(page.getByTestId('review-form')).toHaveCount(0);
  await expect(page.getByTestId('timeline').locator('li')).toHaveCount(3);
  await expect(page).toHaveScreenshot('finding-remediated.png', { fullPage: true });
});
