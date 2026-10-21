import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
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
  await page.getByRole('button', { name: 'Request account deletion', exact: true }).waitFor();
  await page.evaluate(() => window.__privacyLab.once('after', c => c.name === 'User' && c.method === 'delete'));
  await page.getByRole('button', { name: 'Request account deletion', exact: true }).click();
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
  return results;
}
