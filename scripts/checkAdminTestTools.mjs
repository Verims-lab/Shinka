import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

// Real App and service, SDK transport substituted by isolated metadata fixtures.
// Uses the actual native handler over isolated SDK rows; preview/cancel writes nothing.
export async function checkAdminTestTools(page, origin, directory) {
  const results = [];
  if (directory) await mkdir(directory, { recursive: true });
  for (const width of [360, 1280]) for (const language of ['tr', 'en']) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${origin}/?appFixture=1&sdkSession=admin&language=${language}&onboardingState=AUTHENTICATED_CYCLE_STEP`);
    await page.waitForSelector('[data-profile-trigger]:not(:disabled)');
    await page.locator('[data-profile-trigger]').click();
    await page.getByRole('menuitem', { name: 'Admin Panel' }).click();
    await page.locator('[data-admin-panel] a[href="/internal/test-tools"]').click();
    await page.waitForSelector('[data-test-tools]');
    assert(await page.locator('[data-destructive="true"]').isDisabled());
    await page.locator('#test-user-id').fill('ownerA');
    await page.locator('#test-user-id').press('Enter');
    await page.waitForSelector('[data-test-target]');
    await page.locator('[data-destructive="true"]').click();
    await page.waitForSelector('[data-test-preview]');
    assert(await page.locator('[data-test-preview] [data-variant="primary"]').isEnabled());
    assert.equal(await page.locator('#test-confirmation').count(),0);
    assert(await page.locator('[data-test-preview] h2').evaluate(node => node === document.activeElement));
    const metrics = await page.evaluate(() => ({
      width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
      controls: [...document.querySelectorAll('main button,main input,nav a')].map(node => {
        const box = node.getBoundingClientRect();
        return { width: box.width, height: box.height, named: !!(node.textContent?.trim() || node.labels?.length) };
      }),
    }));
    assert(metrics.scrollWidth <= width + 1);
    assert(metrics.controls.every(control => control.width >= 44 && control.height >= 44 && control.named));
    if (directory) await page.screenshot({ path: path.join(directory, `test-tools-${language}-${width}.png`), fullPage: true });
    await page.locator('[data-test-preview] [data-variant="secondary"]').click();
    assert(await page.locator('#test-user-id').evaluate(node => node === document.activeElement));
    const calls = await page.evaluate(() => window.__authFixture.calls);
    assert(calls.filter(call => call.name === 'adminTestTools').every(call => ['lookup','preview'].includes(call.action)));
    results.push({ scenario: `readonly-preview-cancel-${width}-${language}`, passed: true, metrics, productWrites: 0 });
  }
  return results;
}
