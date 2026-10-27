import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { FIRST_CONTENT_SOURCE } from '../base44/shared/firstContentSource.js';
// Actual source copy in isolated UI transport only; this is not a live daily record.
export async function checkDailyFlow(page, origin, directory) {
  if (directory) await mkdir(directory, { recursive: true });
  const pair = FIRST_CONTENT_SOURCE.pairs[0];
  const fixture = { state: 'ACTIVE_EXISTING_USER', persisted: true, profile: { display_name: 'Ada' }, timezone: 'Europe/Istanbul', daily: { id: 'local-ui-daily', shinka_date: '2026-10-20', message_pair_id: 'local-ui-pair', message_tr_snapshot: pair[2], suggestion_tr_snapshot: pair[3], message_en_snapshot: pair[4], suggestion_en_snapshot: pair[5] } };
  await page.addInitScript(value => { window.__dailyFixture = value; }, fixture);
  const results = [];
  for (const width of [360, 1280]) for (const language of ['tr', 'en']) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${origin}/?appFixture=1&sdkSession=admin&onboardingState=FIRST_SHINKA_DEPENDENCY&dailyScenario=retry&language=${language}`);
    await page.waitForSelector('[data-daily-state="notReady"]');
    assert.equal(await page.locator('[data-home-root]').count(), 0);
    if (directory) await page.screenshot({ path: path.join(directory, `on06-retry-${width}-${language}.png`), fullPage: true });
    await page.locator('[data-daily-state] button').click();
    await page.waitForSelector('[data-daily-id="local-ui-daily"]');
    assert.equal(await page.locator('[data-daily-message]').textContent(), language === 'tr' ? pair[2] : pair[4]);
    assert.equal(await page.locator('[data-daily-suggestion]').textContent(), language === 'tr' ? pair[3] : pair[5]);
    const before = await page.evaluate(() => window.__authFixture.calls.filter(c => c.name === 'dailyMessage').length);
    assert.equal(await page.locator('[data-home-root] header').getByRole('button', { name: /^(TR|EN)$/ }).count(), 0);
    assert.equal(await page.evaluate(() => window.__authFixture.calls.filter(c => c.name === 'dailyMessage').length), before);
    const geometry = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, controls: [...document.querySelectorAll('button')].map(e => ({ width: e.getBoundingClientRect().width, height: e.getBoundingClientRect().height })) }));
    assert(geometry.scrollWidth <= width + 1 && geometry.controls.every(c => c.width >= 44 && c.height >= 44));
    if (directory) await page.screenshot({ path: path.join(directory, `home-${width}-${language}.png`), fullPage: true });
    results.push({ scenario: `on06-retry-home-locale-${width}-${language}`, passed: true, geometry, sourcePairId: pair[0], scope: 'LOCAL_BROWSER_FIXTURE' });
  }
  await page.goto(`${origin}/?appFixture=1&sdkSession=user&onboardingState=ACTIVE_EXISTING_USER&dailyScenario=notReady`);
  await page.waitForSelector('[data-home-root] [data-daily-state="notReady"]');
  assert.equal(await page.locator('[data-onboarding-state]').count(), 0);
  results.push({ scenario: 'completed-user-failure-remains-home', passed: true });
  await page.setViewportSize({ width: 1280, height: 900 });
  return results;
}