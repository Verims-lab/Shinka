import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const ROUTE = '/internal/test-tools/onboarding';
const INTRO = 'UNAUTHENTICATED_INTRO', SIGN_IN = 'UNAUTHENTICATED_SIGN_IN';
const NAME = 'AUTHENTICATED_NAME_REQUIRED', PROFILE = 'AUTHENTICATED_PROFILE_REQUIRED';
const CYCLE = 'AUTHENTICATED_CYCLE_STEP', PREPARATION = 'FIRST_SHINKA_DEPENDENCY';
const fixture = '?appFixture=1&sdkSession=admin&onboardingState=ACTIVE_EXISTING_USER';
const snapshot = page => page.evaluate(() => ({
  user: JSON.stringify(window.__appAuth.user),
  local: JSON.stringify(Object.entries(localStorage).sort()),
  session: JSON.stringify(Object.entries(sessionStorage).sort()),
  calls: window.__authFixture.calls.length,
}));

// Real App, real admin/Terms gates and real onboarding controls. The CLI SDK is
// isolated. Provider and product calls are counted independently of DOM success.
// This is UI simulation acceptance, never real OAuth/backend/device acceptance.
export async function checkOnboardingSimulation(browser, origin, directory) {
  const results = [];
  if (directory) await mkdir(directory, { recursive: true });
  for (const width of [320, 360, 390, 430]) for (const language of ['tr', 'en']) {
    const context = await browser.newContext({ locale: language === 'tr' ? 'tr-TR' : 'en-US', viewport: { width, height: 844 } });
    const page = await context.newPage(), errors = [], outbound = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
      if (new URL(route.request().url()).origin === origin) return route.continue();
      outbound.push(route.request().method()); return route.abort();
    });
    try {
      const state = value => page.locator(`[data-onboarding-state="${value}"]`).waitFor();
      const next = () => page.getByRole('button', { name: language === 'tr' ? 'Devam et' : 'Continue', exact: true });
      const back = page.locator('[data-onboarding-back]');
      const provider = width === 320 || width === 390 ? 'apple' : 'google';
      const authenticate = async () => {
        await page.locator('#age-declaration').check();
        await page.locator('#terms-declaration').check();
        await page.locator(`[data-provider="${provider}"]`).click();
        await state(NAME);
      };
      const visibleControls = async () => {
        assert(await page.locator('[data-simulation-indicator]').isVisible());
        assert(await page.locator('[data-simulation-exit]').isVisible());
        const metrics = await page.evaluate(() => ({
          width: innerWidth, scroll: document.documentElement.scrollWidth,
          buttons: [...document.querySelectorAll('[data-onboarding-test] button')].map(node => {
            const box = node.getBoundingClientRect(); return { width: box.width, height: box.height };
          }),
        }));
        assert(metrics.scroll <= metrics.width + 1, 'simulation must not overflow horizontally');
        assert(metrics.buttons.every(button => button.width >= 44 && button.height >= 44), 'all test controls retain touch targets');
        assert.equal(await page.locator('[data-app-backdrop]').count(), 1);
        const exit = await page.locator('[data-simulation-exit]').boundingBox();
        assert(exit.y >= 0 && exit.y + exit.height <= (await page.viewportSize()).height, 'exit must stay in the usable viewport');
        const geometry = await page.locator('[data-onboarding-test]').evaluate(root => {
          const stage = root.querySelector('.shinka-onboarding-test-stage');
          const artwork = getComputedStyle(stage.querySelector('[data-app-backdrop]'), '::before');
          const heading = stage.querySelector('h1').getBoundingClientRect();
          return { headingTop: heading.top, logoBottom: stage.getBoundingClientRect().top
            + parseFloat(artwork.top) + parseFloat(artwork.width) * 314 / 941 };
        });
        assert(geometry.headingTop >= geometry.logoBottom - 1, 'heading must clear the centered artwork');
        if (directory) {
          await page.evaluate(() => document.fonts.ready);
          const screen = await page.locator('[data-onboarding-state]').getAttribute('data-onboarding-state');
          await page.screenshot({ path: path.join(directory, `${screen}-${language}-${width}.png`), fullPage: true });
        }
      };
      await page.goto(`${origin}/internal/test-tools${fixture}&language=${language}`);
      await page.locator('[data-onboarding-test-entry]:not(:disabled)').waitFor();
      const before = await snapshot(page);
      await page.locator('[data-onboarding-test-entry]').click();
      await state(INTRO); await visibleControls();
      assert(await page.locator('[data-simulation-back]').isDisabled());
      await page.getByRole('button', { name: language === 'tr' ? 'Başla' : 'Begin', exact: true }).click();
      await state(SIGN_IN); await visibleControls();
      for (const selector of ['#age-declaration', '#terms-declaration', '[data-provider="apple"]', '[data-provider="google"]']) {
        assert(await page.locator(selector).isVisible(), `${selector} must remain visible`);
      }
      await page.locator(`[data-provider="${provider}"]`).click();
      await page.locator('#age-error').waitFor();
      await page.locator('#age-declaration').check();
      await page.locator(`[data-provider="${provider}"]`).click();
      await page.locator('#terms-error').waitFor();
      assert.equal(await page.locator('[data-onboarding-state]').getAttribute('data-onboarding-state'), SIGN_IN);
      for (const link of ['terms', 'privacy']) {
        await page.locator(`a[href="#simulation-${link}"]`).click();
        await page.locator('[data-simulation-legal]').waitFor();
        assert.equal(context.pages().length, 1);
      }
      await authenticate(); await visibleControls();
      await page.locator('#display_name').fill('Fictional QA');
      await back.click(); await state(SIGN_IN);
      assert(!(await page.locator('#age-declaration').isChecked()));
      await authenticate();
      assert.equal(await page.locator('#display_name').inputValue(), 'Fictional QA');
      const skip = language === 'en';
      if (skip) {
        await page.locator('#display_name').fill('');
        await page.getByRole('button', { name: 'Prefer not to say', exact: true }).click();
      } else await next().click();
      await state(PROFILE); await visibleControls();
      await next().click(); await page.locator('#birth_date-error').waitFor();
      await page.locator('#birth_date').fill('2000-01-01');
      await page.locator('#birthplace').fill('Test');
      await page.locator('[data-place-option]').first().waitFor();
      await page.locator('#birthplace').press('ArrowDown');
      await page.locator('#birthplace').press('Enter');
      await back.click(); await state(NAME);
      await next().click(); await state(PROFILE);
      assert.equal(await page.locator('#birth_date').inputValue(), '2000-01-01');
      assert.match(await page.locator('#birthplace').inputValue(), /Test/);
      await page.setViewportSize({ width, height: 490 });
      await visibleControls();
      await page.setViewportSize({ width, height: 844 });
      await next().click(); await state(CYCLE); await visibleControls();
      const finishCycle = async () => {
        if (skip) await page.getByRole('button', { name: 'Skip for now', exact: true }).click();
        else await page.getByRole('button', { name: 'Bitir', exact: true }).click();
        await state(PREPARATION);
        await page.locator('[data-simulation-prepare]:not(:disabled)').waitFor();
      };
      if (!skip) {
        await page.locator('#period_start_date').fill('2026-11-01');
        await page.locator('#period_duration_days').fill('5');
        await page.locator('#initial_cycle_length_days').fill('28');
        await page.getByRole('button', { name: 'Bitir', exact: true }).click();
        await page.locator('#health_consent-error').waitFor();
        await page.locator('#health_consent').check();
      }
      await finishCycle(); await visibleControls();
      await page.locator('[data-simulation-back]').click(); await state(CYCLE);
      if (!skip) assert.equal(await page.locator('#period_start_date').inputValue(), '2026-11-01');
      await finishCycle();
      if (directory) await page.screenshot({ path: path.join(directory, `preparation-${language}-${width}.png`), fullPage: true });
      await page.locator('[data-simulation-prepare]').click();
      await page.locator('[data-simulation-complete]').waitFor();
      assert.equal(await page.locator('[data-home-root]').count(), 0, 'completion must not load real Home');
      await page.locator('[data-simulation-back]').click(); await state(PREPARATION);
      await page.locator('[data-simulation-back]').click(); await state(CYCLE);
      if (!skip) assert.equal(await page.locator('#period_start_date').inputValue(), '2026-11-01');
      await finishCycle(); await page.locator('[data-simulation-prepare]').click();
      await page.locator('[data-simulation-complete]').waitFor();
      await page.locator('[data-simulation-restart]').click(); await state(INTRO);
      await page.getByRole('button', { name: language === 'tr' ? 'Başla' : 'Begin', exact: true }).click();
      await state(SIGN_IN);
      assert(!(await page.locator('#age-declaration').isChecked()));
      assert(!(await page.locator('#terms-declaration').isChecked()));
      await authenticate(); assert.equal(await page.locator('#display_name').inputValue(), '');
      await next().click(); await state(PROFILE);
      assert.equal(await page.locator('#birth_date').inputValue(), '');
      assert.equal(await page.locator('#birthplace').inputValue(), '');
      await page.getByRole('button', { name: language === 'tr' ? 'Çıkış yap' : 'Sign out', exact: true }).click();
      await state(SIGN_IN);
      assert(!(await page.locator('#age-declaration').isChecked()));
      assert(!(await page.locator('#terms-declaration').isChecked()));
      await page.locator('[data-simulation-exit]').click(); await page.locator('[data-test-tools]').waitFor();
      const after = await snapshot(page);
      assert.equal(after.user, before.user, 'real authenticated identity is unchanged');
      assert.equal(after.local, before.local); assert.equal(after.session, before.session);
      const calls = await page.evaluate(start => window.__authFixture.calls.slice(start), before.calls);
      assert(calls.every(call => call.name === 'applicationSession'), `only real admin session checks are allowed: ${JSON.stringify(calls)}`);
      assert.equal(await page.evaluate(() => window.__authFixture.providerCalls.length), 0);
      assert.equal(await page.evaluate(() => window.__authFixture.logoutCalls), 0);
      assert.equal(await page.evaluate(() => window.__authFixture.termsEvents.length), 0);
      assert.deepEqual(outbound, []); assert.deepEqual(errors, []);
      results.push({ scenario: `isolated-journey-${language}-${width}-${provider}`, passed: true, realProductCalls: 0, realOAuth: 0 });
    } finally { await context.close(); }
  }
  // Direct entry, reload and live role/session checks use the unchanged gate.
  const context = await browser.newContext({ locale: 'en-US', viewport: { width: 360, height: 844 } });
  const page = await context.newPage();
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  try {
    for (const session of ['anonymous', 'user']) {
      await page.goto(`${origin}${ROUTE}?appFixture=1&sdkSession=${session}`);
      await page.waitForFunction(() => window.__appAuth && !window.__appAuth.isLoadingAuth && !window.__appAuth.isRefreshingAuth);
      if (session === 'user') await page.getByText('FORBIDDEN', { exact: true }).waitFor();
      else await page.locator('[data-auth-shell]').waitFor();
      assert.equal(await page.locator('[data-onboarding-test]').count(), 0);
      results.push({ scenario: `direct-${session}-denied`, passed: true });
    }
    await page.goto(`${origin}${ROUTE}${fixture}`); await page.locator('[data-onboarding-test]').waitFor();
    await page.getByRole('button', { name: 'Begin', exact: true }).click();
    await page.locator('#age-declaration').check();
    await page.reload(); await page.locator(`[data-onboarding-state="${INTRO}"]`).waitFor();
    await page.evaluate(() => { window.__authFixture.holdOperation('applicationSession'); void window.__appAuth.checkUserAuth(); });
    await page.waitForFunction(() => window.__appAuth.isRefreshingAuth);
    assert(!(await page.locator('[data-onboarding-test]').isVisible()));
    await page.evaluate(() => window.__authFixture.releaseOperation('applicationSession'));
    await page.locator('[data-onboarding-test]').waitFor({ state: 'visible' });
    await page.evaluate(async () => { window.__authFixture.setSession('user'); await window.__appAuth.checkUserAuth(); });
    await page.getByText('FORBIDDEN', { exact: true }).waitFor();
    assert.equal(await page.locator('[data-onboarding-test]').count(), 0);
    await page.evaluate(async () => { window.__authFixture.setSession('admin'); await window.__appAuth.checkUserAuth(); });
    await page.locator(`[data-onboarding-state="${INTRO}"]`).waitFor();
    await page.evaluate(async () => { window.__authFixture.sessionUnavailable(true); await window.__appAuth.checkUserAuth(); });
    await page.locator('[data-onboarding-test]').waitFor({ state: 'detached' });
    assert.equal(await page.locator('[data-onboarding-test]').count(), 0);
    await page.evaluate(async () => { window.__authFixture.sessionUnavailable(false); await window.__appAuth.checkUserAuth(); });
    await page.locator(`[data-onboarding-state="${INTRO}"]`).waitFor();
    results.push({ scenario: 'reload-pending-revocation-unavailable-retry', passed: true });
    await page.goto(`${origin}/${fixture}&themeFixture=1&theme=dark`);
    await page.locator('[data-profile-trigger]:not(:disabled)').waitFor();
    await page.locator('[data-profile-trigger]:visible').click();
    await page.locator('[data-you-root]').waitFor();
    await page.getByRole('link', { name: 'Admin Panel', exact: true }).click();
    await page.locator('[data-admin-panel] a[href="/internal/test-tools"]').click();
    await page.locator('[data-onboarding-test-entry]:not(:disabled)').waitFor();
    await page.waitForFunction(() => document.documentElement.classList.contains('dark'));
    const before = await snapshot(page);
    await page.locator('[data-onboarding-test-entry]').click();
    await page.locator(`[data-onboarding-state="${INTRO}"]`).waitFor();
    await page.evaluate(() => {
      document.documentElement.style.setProperty('--safe-top', '20px');
      document.documentElement.style.setProperty('--safe-bottom', '30px');
    });
    await page.getByRole('button', { name: 'Begin', exact: true }).click();
    await page.locator('#age-declaration').check();
    assert(await page.locator('.shinka-onboarding-test-content').evaluate(node => getComputedStyle(node).backgroundImage.includes('rgb(30, 20, 25)')));
    assert.equal(await page.locator('[data-onboarding-progress]').evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(30, 20, 25)');
    if (directory) await page.screenshot({ path: path.join(directory, 'dark-safe-area.png'), fullPage: true });
    await page.goBack(); await page.locator('[data-test-tools]').waitFor();
    await page.goForward(); await page.locator(`[data-onboarding-state="${INTRO}"]`).waitFor();
    await page.locator('[data-simulation-exit]').click(); await page.locator('[data-test-tools]').waitFor();
    const after = await snapshot(page);
    assert.equal(after.user, before.user); assert.equal(after.local, before.local); assert.equal(after.session, before.session);
    assert(await page.evaluate(() => document.documentElement.classList.contains('dark')));
    results.push({ scenario: 'safe-area-dark-history-exit-isolation', passed: true });
  } finally { await context.close(); }
  return results;
}
