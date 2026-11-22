import assert from 'node:assert/strict';

// Real App and server progress handlers, with isolated provider and SDK IO.
export async function checkUnifiedAuthentication(browser, origin) {
  const results = [];
  const scenarios = [
    { name: 'new', progress: 'new', terms: true, step: 'AUTHENTICATED_NAME_REQUIRED' },
    { name: 'incomplete-name', progress: 'new', current: true, step: 'AUTHENTICATED_NAME_REQUIRED' },
    { name: 'incomplete-profile', progress: 'partial', current: true, step: 'AUTHENTICATED_PROFILE_REQUIRED' },
    { name: 'incomplete-cycle', progress: 'cycle', current: true, step: 'AUTHENTICATED_CYCLE_STEP' },
    { name: 'complete', progress: 'complete', current: true },
    { name: 'complete-null-name', progress: 'null-name', current: true },
    { name: 'complete-explicit-terms', progress: 'complete', current: true, terms: true },
    { name: 'missing-acceptance', progress: 'new', gate: true },
    { name: 'outdated-acceptance', progress: 'complete', gate: true, outdated: true },
    { name: 'unavailable-acceptance', progress: 'complete', gate: true, unavailable: true },
  ];

  for (const language of ['tr', 'en']) {
    for (const provider of ['apple', 'google']) {
      for (const scenario of scenarios) {
        const context = await browser.newContext({
          locale: language === 'tr' ? 'tr-TR' : 'en-US',
          viewport: { width: 360, height: 780 },
        });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/*', route =>
          new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
        try {
          const url = new URL('/login', origin);
          url.search = new URLSearchParams({
            appFixture: '1', sdkSession: 'anonymous', termsFixture: '1',
            holdHydration: '1', authFirst: scenario.progress, language,
          }).toString();
          await page.goto(url.href);
          await page.locator('[data-auth-shell]').waitFor();
          assert.equal(await page.locator('[data-auth-returning]').count(), 0);
          await page.locator('#age-declaration').check();
          if (scenario.terms) await page.locator('#terms-declaration').check();
          await page.evaluate(() => window.__authFixture.providerMode('redirect'));
          await page.locator(`[data-provider=${provider}]`).click();
          await page.waitForFunction(() => window.__authFixture.providerCalls.length === 1);

          await page.evaluate(scenario => {
            const fixture = window.__authFixture;
            const callback = new URL(fixture.providerCalls[0].returnTo, location.origin);
            const url = new URL(location.href);
            url.pathname = callback.pathname;
            url.searchParams.delete('terms_intent');
            if (callback.searchParams.has('terms_intent')) {
              url.searchParams.set('terms_intent', callback.searchParams.get('terms_intent'));
            }
            history.pushState(history.state, '', url);
            window.dispatchEvent(new PopStateEvent('popstate'));
            fixture.setSession('user');
            if (scenario.current) fixture.seedTerms();
            if (scenario.outdated) fixture.seedTerms('test-terms-v0');
            if (scenario.unavailable) fixture.termsReadFailure(true);
            return window.__appAuth.checkAppState();
          }, scenario);

          if (scenario.gate) {
            await page.locator('[data-terms-gate]').waitFor();
            assert.equal(await page.locator('[data-onboarding-state],[data-home-root]').count(), 0);
            assert.equal(await page.evaluate(() => window.__sdkLabCalls.filter(call =>
              ['onboarding', 'dailyMessage'].includes(call.name)).length), 0);
            assert.equal(await page.evaluate(() => window.__sdkLabCalls.filter(call =>
              call.name === 'termsAcceptance' && call.action === 'accept').length), 0);
            if (scenario.unavailable) {
              await page.locator('[data-terms-error=TERMS_STATE_UNAVAILABLE]').waitFor();
              assert.equal(await page.locator('[data-terms-accept]').count(), 0);
              await page.evaluate(() => window.__authFixture.termsReadFailure(false));
              await page.locator('[data-terms-check]').click();
            }
            await page.locator('[data-terms-accept]:not(:disabled)').waitFor();
            assert(!await page.locator('#age-declaration').isChecked());
            assert(!await page.locator('#terms-declaration').isChecked());
            await page.locator('#age-declaration').check();
            await page.locator('#terms-declaration').check();
            await page.locator('[data-terms-accept]').click();
          }

          await page.waitForFunction(() => window.__sdkLabCalls.some(call =>
            call.name === 'onboarding' && call.action === 'hydrate'));
          assert.equal(await page.locator('[data-onboarding-state],[data-home-root]').count(), 0,
            'unverified onboarding progress cannot open a screen');
          await page.evaluate(() => window.__authFixture.releaseHydration());
          const step = scenario.step || (scenario.progress === 'new' ? 'AUTHENTICATED_NAME_REQUIRED' : null);
          const destination = step
            ? `[data-onboarding-state="${step}"]`
            : '[data-home-root] [data-daily-id]';
          await page.locator(destination).waitFor();
          assert.equal(await page.locator('[data-auth-shell],[data-terms-gate]').count(), 0);
          assert.equal(await page.evaluate(() => window.__sdkLabCalls.filter(call =>
            call.name === 'termsAcceptance' && call.action === 'accept').length),
          scenario.current ? 0 : 1, 'existing acceptance is reused without another write');
          assert.equal(await page.evaluate(() => window.__sdkLabCalls.filter(call =>
            call.name === 'onboarding' && call.action !== 'hydrate').length), 0);
          if (['partial', 'cycle', 'null-name'].includes(scenario.progress)) {
            assert.equal(await page.evaluate(() =>
              window.__authFirstLab.rows.user_profile[0].display_name), null);
          }
          assert.deepEqual(errors, []);
          results.push({ language, provider, scenario: scenario.name, passed: true });
        } catch (error) {
          console.error(JSON.stringify({ unifiedAuthenticationFailure: {
            language, provider, scenario: scenario.name,
          } }));
          throw error;
        } finally {
          await context.close();
        }
      }
    }
  }
  return results;
}
