import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { privacyCopy } from '../src/foundation/i18n/privacyCopy.js';
export async function checkPrivacyFlow(page, origin, directory) {
  if (directory) await mkdir(directory, { recursive: true });
  const results = [];
  for (const width of [320, 360, 390, 430, 844]) for (const language of ['tr', 'en']) {
    await page.setViewportSize({ width, height: width === 844 ? 390 : 900 });
    await page.goto(`${origin}/account-privacy?appFixture=1&sdkSession=user&lang=${language}`);
    const deleteName = language === 'tr' ? 'Hesabımı sil' : 'Delete my account';
    await page.getByRole('button', { name: deleteName, exact: true }).waitFor();
    await page.waitForFunction(name => [...document.querySelectorAll('button')].some(b => b.textContent === name && !b.disabled), deleteName);
    await page.getByRole('button', { name: deleteName, exact: true }).click();
    await page.waitForSelector('dialog[open]');
    assert.equal(await page.evaluate(() => document.activeElement?.textContent), language === 'tr' ? 'Vazgeç' : 'Cancel');
    for (const scale of [1, 2]) {
      if (scale === 2) await page.evaluate(() => {
        const sizes = [...document.querySelectorAll('h1,h2,p,button,a')].map(el => [el, parseFloat(getComputedStyle(el).fontSize)]);
        for (const [el, size] of sizes) el.style.fontSize = `${size * 2}px`;
      });
      const geometry = await page.evaluate(() => {
        const d = document.querySelector('dialog');
        return { width: innerWidth, documentWidth: document.documentElement.scrollWidth, modalWidth: d.getBoundingClientRect().width, modalScroll: d.scrollWidth, modalClient: d.clientWidth, controls: [...d.querySelectorAll('button')].map(el => ({ width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height, label: !!el.textContent.trim() })) };
      });
      assert(geometry.documentWidth <= width + 1 && geometry.modalWidth <= width && geometry.modalScroll <= geometry.modalClient + 1);
      assert(geometry.controls.every(c => c.width >= 44 && c.height >= 44 && c.label));
      await page.keyboard.press('Tab'); assert(await page.evaluate(() => document.querySelector('dialog').contains(document.activeElement)));
      if (directory) await page.screenshot({ path: path.join(directory, `privacy-${width}-${language}-${scale}.png`), fullPage: true });
      results.push({ scenario: `privacy-${width}-${language}-${scale}`, passed: true, geometry, scope: 'LOCAL_BROWSER_SYNTHETIC' });
    }
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('dialog').count(), 0);
    assert(await page.evaluate(() => window.__privacyLab.state.calls.every(c => c.method === 'filter')));
  }
  await page.goto(`${origin}/account-privacy?appFixture=1&sdkSession=user&lang=en&intent=delete`);
  await page.getByRole('button', { name: 'Delete Account', exact: true }).waitFor();
  await page.evaluate(() => window.__privacyLab.once('after', c => c.name === 'User' && c.method === 'delete'));
  await page.getByRole('button', { name: 'Delete Account', exact: true }).click();
  await page.waitForSelector('[data-privacy-actions] [role=alert]');
  assert.equal(await page.locator('[data-privacy-platform-pending]').count(), 0);
  await page.getByRole('button', { name: 'Check status', exact: true }).click();
  await page.waitForSelector('[data-privacy-platform-pending]');
  assert(await page.locator('[data-privacy-platform-pending]').textContent().then(text => text.includes('remain pending')));
  assert.equal(await page.evaluate(() => window.__privacyLab.tables.User.some(row => row.id === 'ownerA')), false);
  results.push({ scenario: 'incomplete-native-removal-lost-response-readonly-recovery-logout', passed: true });
  await page.evaluate(() => sessionStorage.removeItem('shinka.privacy-recovery.v1'));
  await page.goto(`${origin}/delete-account?appFixture=1&sdkSession=anonymous&lang=en`);
  await page.getByRole('link', { name: 'Sign in with Apple or Google', exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Delete my account', exact: true }).count(), 0);
  results.push({ scenario: 'external-deletion-path-public-auth-required-no-password', passed: true });
  await page.goto(`${origin}/account-privacy?appFixture=1&sdkSession=admin&lang=en`);
  await page.waitForFunction(() => document.body.textContent.includes('last-admin protection'));
  assert(await page.getByRole('button', { name: 'Delete my account', exact: true }).isDisabled());
  results.push({ scenario: 'protected-current-native-admin', passed: true });
  for (const width of [320, 390]) for (const language of ['tr', 'en']) {
    // Each matrix cell is a separate synthetic account lifecycle. Preserve the
    // actual recovery within a cell, not across independently reset databases.
    await page.evaluate(() => sessionStorage.removeItem('shinka.privacy-recovery.v1'));
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`${origin}/account-privacy?appFixture=1&sdkSession=user&lang=${language}&intent=delete`);
    await page.getByRole('button', { name: privacyCopy('confirmDelete', language), exact: true }).waitFor();
    await page.evaluate(() => window.__privacyLab.once('before', c => c.method === 'delete'));
    await page.getByRole('button', { name: privacyCopy('confirmDelete', language), exact: true }).click();
    await page.waitForSelector('[data-privacy-actions] [role=alert]');
    await page.evaluate(() => window.__appAuth.logout(false, { preservePrivacyRecovery: true }));
    await page.getByText(privacyCopy('inProgress', language), { exact: true }).waitFor();
    assert.equal(await page.getByText(privacyCopy('loginBody', language), { exact: true }).count(), 0);
    const before = await page.evaluate(() => ({ writes: window.__privacyLab.state.calls.filter(c => c.method !== 'filter').length, ids: window.__privacyLab.tables.UserPrivacyRequest.map(r => r.id) }));
    for (const scale of [1, 2]) {
      if (scale === 2) await page.evaluate(() => {
        const sizes = [...document.querySelectorAll('h1,h2,p,button,a')].map(el => [el, parseFloat(getComputedStyle(el).fontSize)]);
        for (const [el, size] of sizes) el.style.fontSize = `${size * 2}px`;
        const style = document.createElement('style'); style.textContent = '[data-privacy-actions] :is(p,a,button){font-size:32px!important}'; document.head.appendChild(style);
      });
      for (const status of [429, 503]) {
        await page.evaluate(status => { window.__privacyLab.state.before = async c => { if (c.name === 'PrivacyRecoveryReceipt' && c.method === 'filter') throw { response: { status } }; }; }, status);
        await page.getByRole('button', { name: privacyCopy('check', language), exact: true }).click();
        await page.getByRole('alert').filter({ hasText: privacyCopy('unavailable', language) }).waitFor();
        assert.equal(await page.getByRole('link', { name: privacyCopy('login', language), exact: true }).count(), 0);
        assert(await page.getByRole('button', { name: privacyCopy('check', language), exact: true }).isEnabled());
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      }
      await page.evaluate(() => { window.__privacyLab.state.before = null; });
      await page.getByRole('button', { name: privacyCopy('check', language), exact: true }).click();
      await page.getByText(privacyCopy('inProgress', language), { exact: true }).waitFor();
      results.push({ scenario: `status-transient-retry-${width}-${language}-${scale}`, passed: true, physicalDevice: false });
    }
    await page.evaluate(() => { window.__privacyLab.state.time = '2026-10-23T12:00:00.000Z'; });
    await page.getByRole('button', { name: privacyCopy('check', language), exact: true }).click();
    await page.getByRole('alert').filter({ hasText: privacyCopy('signInRequired', language) }).waitFor();
    const login = page.getByRole('link', { name: privacyCopy('login', language), exact: true });
    assert.equal(await login.getAttribute('href'), `/login?returnTo=${encodeURIComponent(`/account-privacy?lang=${language}`)}`);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    assert(await page.evaluate(() => [...document.querySelectorAll('[data-privacy-actions] button, [data-privacy-actions] a')].every(el => el.getBoundingClientRect().width >= 44 && el.getBoundingClientRect().height >= 44 && parseFloat(getComputedStyle(el).fontSize) >= 32)));
    const after = await page.evaluate(() => ({ writes: window.__privacyLab.state.calls.filter(c => c.method !== 'filter').length, ids: window.__privacyLab.tables.UserPrivacyRequest.map(r => r.id) }));
    assert.deepEqual(after, before);
    if (directory) await page.screenshot({ path: path.join(directory, `privacy-status-expired-${width}-${language}-2.png`), fullPage: true });
    results.push({ scenario: `expired-anonymous-no-writes-${width}-${language}-2`, passed: true, physicalDevice: false });
  }
  return results;
}
