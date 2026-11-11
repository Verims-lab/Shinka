import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';
import { BUILD_MARKER } from '../src/foundation/buildMarker.js';
import { checkSignInLayout } from './checkOnboardingLayers.mjs';

const origin = 'https://shinka-rhythm-flow.base44.app';
const appId = '6ad5190f4845d4e3af03b420';
const settingsPath = `/api/apps/public/prod/public-settings/by-id/${appId}`;
const sessionPath = `/api/apps/${appId}/functions/applicationSession`;
const viewports = [[320, 568], [360, 640], [390, 844], [430, 932]];
const engine = process.env.FOUNDATION_BROWSER || 'chromium';
const launcher = { chromium, webkit }[engine];
assert(launcher, 'FOUNDATION_BROWSER must be chromium or webkit');

async function checkPublishedWelcome(browser, language, width, height) {
  const context = await browser.newContext({
    viewport: { width, height }, locale: language === 'tr' ? 'tr-TR' : 'en-US',
    isMobile: true, hasTouch: true, serviceWorkers: 'block',
  });
  let sessionStatus = null;
  try {
    await context.route('**/*', async route => {
      const request = route.request();
      const url = new URL(request.url());
      const sameOrigin = url.origin === origin;
      const read = ['GET', 'HEAD'].includes(request.method());
      const staticPath = ['/', '/login', '/manifest.json'].includes(url.pathname) || url.pathname.startsWith('/assets/');
      const publicAsset = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'].includes(url.origin) ||
        url.origin === 'https://media.base44.com' && url.pathname.startsWith(`/files/public/${appId}/`);
      if (read && (sameOrigin && (staticPath || url.pathname === settingsPath) || publicAsset)) return route.continue();

      // The App reads native session state through this POST-only function.
      // Permit only an empty anonymous check and never follow a redirect.
      if (sameOrigin && url.pathname === sessionPath && !url.search &&
        request.method() === 'POST' && request.postData() === '{}') {
        const headers = await request.allHeaders();
        if (!headers.authorization && !headers.cookie) {
          const response = await route.fetch({ maxRedirects: 0 });
          sessionStatus = response.status();
          if (sessionStatus === 401) return route.fulfill({ response });
          await response.dispose();
        }
      }
      return route.abort();
    });

    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.name));
    const response = await page.goto(origin, { waitUntil: 'domcontentloaded' });
    assert.equal(response?.status(), 200, 'published app document');
    await page.locator('[data-onboarding-state="UNAUTHENTICATED_INTRO"]').waitFor();
    assert.equal(sessionStatus, 401, 'published session check must confirm an anonymous visitor');
    await page.getByRole('button', { name: language === 'tr' ? 'Başla' : 'Begin', exact: true }).click();
    await page.locator('[data-onboarding-state="UNAUTHENTICATED_SIGN_IN"]').waitFor();
    await page.waitForFunction(() => document.fonts.status === 'loaded');
    const welcome = await checkSignInLayout(page);
    assert.deepEqual(pageErrors, []);
    return {
      language, width, height, visible: true, buildMarker: welcome.buildMarker,
      expectedBuild: welcome.buildMarker === BUILD_MARKER, providers: welcome.providers,
    };
  } catch (error) {
    return { language, width, height, visible: false, expectedBuild: false, sessionStatus, error: error.message };
  } finally {
    await context.close();
  }
}

const browser = await launcher.launch({ headless: true });
try {
  const results = [];
  for (const language of ['tr', 'en']) {
    for (const [width, height] of viewports) results.push(await checkPublishedWelcome(browser, language, width, height));
  }
  console.log(JSON.stringify({
    scope: 'PUBLISHED_ANONYMOUS_ONBOARDING_VISIBILITY', origin, engine, expectedBuild: BUILD_MARKER, results,
  }, null, 2));
  if (results.some(result => !result.visible || !result.expectedBuild)) process.exitCode = 1;
} finally {
  await browser.close();
}
