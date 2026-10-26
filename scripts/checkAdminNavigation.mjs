// Production App routes + isolated SDK transport; no live identity or product writes.
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

export async function checkAdminNavigation(page, origin, directory) {
  await page.evaluate(()=>sessionStorage.removeItem('shinka.pending-test-operation')); // Independent navigation scenario, no pending test operation.
  const results = [];
  if (directory) await mkdir(directory, { recursive: true });
  const open = (route, session, language = 'en', state = 'AUTHENTICATED_CYCLE_STEP') =>
    page.goto(`${origin}${route}?appFixture=1&sdkSession=${session}&language=${language}&onboardingState=${state}`);
  const screenshot = async name => { if (directory) await page.screenshot({ path: path.join(directory, name + '.png'), fullPage: true, animations: 'disabled' }); };
  const geometry = async selector => {
    const metrics = await page.evaluate(selector => ({
      width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
      controls: [...document.querySelectorAll(selector)].filter(el => el.getBoundingClientRect().width).map(el => {
        const box = el.getBoundingClientRect();
        return { width: box.width, height: box.height, named: !!(el.textContent?.trim() || el.getAttribute('aria-label')) };
      }),
    }), selector);
    assert(metrics.scrollWidth <= metrics.width + 1, 'horizontal overflow');
    assert(metrics.controls.length && metrics.controls.every(c => c.height >= 44 && c.width >= 44 && c.named), 'touch targets / labels');
    return metrics;
  };
  for (const width of [360, 1280]) for (const language of ['tr', 'en']) {
    await page.setViewportSize({ width, height: 900 });
    await open('/', 'admin', language);
    await page.waitForSelector('[data-onboarding-state="AUTHENTICATED_CYCLE_STEP"]');
    const trigger = page.locator('[data-profile-trigger]');
    await trigger.focus(); await page.keyboard.press('Enter');
    const entry = page.getByRole('menuitem', { name: 'Admin Panel' });
    await entry.waitFor();
    const menu = await geometry('[data-profile-trigger],[role="menuitem"]');
    if (language === 'tr') await screenshot(`admin-menu-${width}`);
    await page.keyboard.press('Escape');
    await entry.waitFor({ state: 'hidden' });
    await page.waitForFunction(() => document.activeElement?.matches('[data-profile-trigger]'), null, { timeout: 3000 });
    assert(await trigger.evaluate(el => document.activeElement === el), 'Escape must restore focus');
    assert(await trigger.evaluate(el => getComputedStyle(el).outlineStyle !== 'none'), 'trigger keyboard focus invisible');
    await page.keyboard.press('ArrowDown'); await entry.waitFor();
    await page.keyboard.press('Tab'); await entry.waitFor({ state: 'hidden' });
    assert(!(await trigger.evaluate(el => document.activeElement === el)), 'Tab must leave menu');
    await trigger.focus(); await page.keyboard.press('ArrowUp'); await entry.waitFor(); await page.keyboard.press('Enter');
    await page.waitForSelector('[data-admin-panel]');
    assert.equal(await page.locator('[data-admin-panel] a').count(), 3);
    const panel = await geometry('nav a,[data-admin-panel] a');
    const description = language === 'tr' ? 'Sağlık kontrolleri, testler ve sonuçlar.' : 'Health checks, tests and results.';
    assert(await page.getByText(description, { exact: true }).isVisible(), 'localized panel');
    if (language === 'tr') await screenshot(`admin-panel-${width}`);
    for (const tool of ['/internal/health', '/internal/build', '/internal/test-tools']) {
      await page.locator(`[data-admin-panel] a[href="${tool}"]`).click();
      await page.waitForSelector(tool.endsWith('health') ? '[data-health-root]' : 'h1');
      await page.locator('nav a[href="/internal"]').click();
      await page.waitForSelector('[data-admin-panel]');
    }
    await page.locator('nav a[href="/"]').click();
    await page.waitForSelector('[data-onboarding-state="AUTHENTICATED_CYCLE_STEP"]');
    const actions = await page.evaluate(() => window.__authFixture.calls);
    assert(actions.every(c => c.name === 'applicationSession' || (c.name === 'onboarding' && c.action === 'hydrate') || c.action === 'list'), 'navigation wrote data or started Health');
    results.push({ scenario: `admin-menu-panel-tools-return-${width}-${language}`, passed: true, menu, panel, actions });
    await open('/', 'user', language);
    await page.waitForSelector('[data-onboarding-state]');
    assert(await page.locator('[data-profile-trigger]').isDisabled());
    assert.equal(await page.getByText('Admin Panel', { exact: true }).count(), 0);
    await geometry('[data-profile-trigger]');
    if (language === 'tr') await screenshot(`user-onboarding-${width}`);
    results.push({ scenario: `user-no-menu-${width}-${language}`, passed: true });
  }
  for (const session of ['user', 'anonymous']) for (const route of ['/internal', '/internal/health', '/internal/build', '/internal/test-tools']) {
    await open(route, session);
    await page.waitForSelector(session === 'user' ? '[data-error-code="FORBIDDEN"]' : '[data-onboarding-state="UNAUTHENTICATED_SIGN_IN"]');
    assert.equal(await page.locator('[data-admin-panel],[data-health-root]').count(), 0);
    if (session === 'anonymous') assert.equal(new URL(page.url()).pathname, '/login');
    results.push({ scenario: `${session}-direct-${route}`, passed: true });
  }
  await open('/internal', 'admin'); await page.waitForSelector('[data-admin-panel]');
  // Advance the passive-check clock without sleeping or changing its 15 s policy.
  await page.clock.setSystemTime(await page.evaluate(() => Date.now()+16000));
  try {
    await page.evaluate(() => { window.__authFixture.hold(); window.dispatchEvent(new Event('focus')); });
    await page.waitForSelector('[data-state="LOADING"]');
    assert(!(await page.locator('[data-admin-panel]').isVisible()));
    await page.evaluate(() => { window.__authFixture.setSession('user'); window.__authFixture.release(); });
    await page.waitForSelector('[data-error-code="FORBIDDEN"]');
  } finally { await page.clock.setSystemTime(Date.now()); }
  results.push({ scenario: 'focus-refresh-pending-then-revoked', passed: true });
  await open('/', 'admin', 'en', 'ACTIVE_EXISTING_USER');
  await page.waitForSelector('[data-profile-trigger]:not(:disabled)');
  await page.locator('[data-profile-trigger]').click(); await page.waitForSelector('[data-you-root]'); await page.getByRole('link', { name: 'Admin Panel' }).click();
  await page.waitForSelector('[data-admin-panel]');
  await page.locator('nav a[href="/"]').click();
  await page.waitForSelector('[data-profile-trigger]:not(:disabled)');
  assert.equal(await page.locator('[data-onboarding-state]').count(), 0);
  results.push({ scenario: 'existing-user-home-entry-and-return', passed: true });
  await page.goto(`${origin}/?appFixture=1&sdkSession=admin&holdHydration=1&uninitialized=1`);
  await page.locator('[data-profile-trigger]:not(:disabled)').click();
  await page.getByRole('menuitem', { name: 'Admin Panel' }).click();
  await page.waitForSelector('[data-admin-panel]');
  await page.evaluate(() => window.__authFixture.releaseHydration());
  await page.waitForFunction(() => window.__authFixture.hydrationReturned);
  const pendingActions = await page.evaluate(() => window.__authFixture.calls);
  assert(pendingActions.every(call => call.name === 'applicationSession' || call.name === 'onboarding' && call.action === 'hydrate'), 'late hydration initialized after navigation');
  results.push({ scenario: 'pending-onboarding-admin-entry-no-late-write', passed: true, actions: pendingActions });
  await page.setViewportSize({ width: 1280, height: 900 });
  return results;
}
