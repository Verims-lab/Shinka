import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { loadAppBackdrop } from './checkAppBackdrop.mjs';

// Actual logout and onboarding entry, with the existing isolated SDK transport.
export async function checkOnboardingFocus(browser, origin, directory) {
  if (directory) await mkdir(directory, { recursive: true });
  const results = [];
  for (const language of ['tr', 'en']) {
    for (const width of [320, 360, 390, 430]) {
      const context = await browser.newContext({
        locale: language === 'tr' ? 'tr-TR' : 'en-US',
        viewport: { width, height: 844 },
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/*', route =>
        new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
      const title = page.locator('main h1');
      const measureTitle = () => title.evaluate(element => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return {
          focused: document.activeElement === element,
          tabIndex: element.tabIndex,
          outline: style.outlineStyle,
          border: parseFloat(style.borderTopWidth),
          shadow: style.boxShadow,
          layout: {
            x: rect.x, y: rect.y + scrollY, width: rect.width, height: rect.height,
            font: style.fontFamily, size: style.fontSize,
            weight: style.fontWeight, lineHeight: style.lineHeight,
          },
        };
      });
      const unframed = value => {
        assert(value.focused && value.tabIndex === -1, 'heading keeps programmatic focus');
        assert.equal(value.outline, 'none', 'announced heading has no visible outline');
        assert.equal(value.border, 0);
        assert.equal(value.shadow, 'none');
      };
      const keyboardRing = async selector => {
        // This WebKit runner tabs between form controls. Keep keyboard modality
        // and focus its links directly to measure their visible indicator.
        const directLink = browser.browserType().name() === 'webkit' && selector.startsWith('a[');
        if (directLink) await page.locator(selector).focus();
        else await page.keyboard.press('Tab');
        const value = await page.locator(selector).evaluate(element => {
          const frame = element.closest('.shinka-framed-field');
          const style = getComputedStyle(frame || element);
          return {
            focused: document.activeElement === element,
            tabIndex: element.tabIndex,
            outline: style.outlineStyle,
            width: parseFloat(style.outlineWidth),
          };
        });
        assert(value.focused && value.tabIndex >= 0, selector + ' can receive keyboard focus');
        assert(value.outline !== 'none' && value.width >= 2,
          selector + ' retains a visible keyboard focus indicator');
        return { ...value, method: directLink ? 'keyboard-modality-link-focus' : 'Tab' };
      };
      try {
        await page.goto(`${origin}/login?appFixture=1&sdkSession=user&language=${language}&onboardingState=AUTHENTICATED_NAME_REQUIRED`);
        await page.locator('#display_name').waitFor();
        await page.waitForFunction(() => document.activeElement === document.querySelector('main h1'));
        const nameHeading = await measureTitle();
        await keyboardRing('#display_name');
        await page.getByRole('button', {
          name: language === 'tr' ? 'Çıkış yap' : 'Sign out', exact: true,
        }).click();
        await page.locator('[data-onboarding-state=UNAUTHENTICATED_SIGN_IN]').waitFor();
        await page.waitForFunction(() => document.activeElement === document.querySelector('main h1'));
        assert.equal(await page.getByRole('heading', {
          level: 1, name: language === 'tr' ? 'Hoş geldin' : 'Welcome', exact: true,
        }).count(), 1);
        if (directory) {
          await loadAppBackdrop(page);
          await page.screenshot({
            path: path.join(directory, `logout-welcome-${language}-${width}.png`),
          });
        }
        const welcomeHeading = await measureTitle();
        unframed(welcomeHeading);
        unframed(nameHeading);
        const controls = [];
        for (const selector of [
          '#age-declaration', '#terms-declaration',
          'a[href="https://shinkadaily.com/terms/"]',
          'a[href="https://shinkadaily.com/privacy/"]',
          '[data-provider=apple]', '[data-provider=google]',
        ]) controls.push(await keyboardRing(selector));
        assert.deepEqual((await measureTitle()).layout, welcomeHeading.layout,
          'heading geometry and typography remain stable as focus moves');
        assert.deepEqual(errors, []);
        results.push({ language, width, passed: true, welcomeHeading, nameHeading, controls });
      } finally {
        await context.close();
      }
    }
  }
  return results;
}
