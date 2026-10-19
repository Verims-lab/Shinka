import { mkdir } from "node:fs/promises";
import path from "node:path";

// Actual browser viewports, synthetic SDK/provider. Never labels this a physical
// keyboard, Safari, Android OS, bfcache guarantee, or background eviction test.
export async function checkMobile(browser, origin, directory) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage(),
    rows = [],
    errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", (route) =>
    new URL(route.request().url()).origin === origin
      ? route.continue()
      : route.abort(),
  );
  try {
    for (const [width, height] of [
      [320, 568],
      [390, 844],
      [844, 390],
    ]) {
      await page.setViewportSize({ width, height });
      await page.goto(
        `${origin}/onboarding-fixture?step=AUTHENTICATED_PROFILE_REQUIRED&language=tr`,
      );
      await page.locator("#place-countries").selectOption("100");
      await page.locator("#place-0").selectOption("1001");
      await page.locator("#birth_date").fill("1990-01-01");
      await page.locator("#birth_time").fill("08:30");
      await page.locator("button[type=submit]").scrollIntoViewIfNeeded();
      const layout = await page.evaluate(() => ({
        width: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        controls: [
          ...document.querySelectorAll(
            "select,input:not([type=checkbox]),button",
          ),
        ].map((el) => ({
          id: el.id,
          height: el.getBoundingClientRect().height,
        })),
        date: document.querySelector("#birth_date").value,
        time: document.querySelector("#birth_time").value,
        viewport: document.querySelector("meta[name=viewport]")?.content,
      }));
      rows.push({
        scenario: `touch-viewport-${width}x${height}`,
        ...layout,
        passed:
          layout.scrollWidth <= width + 1 &&
          layout.controls.every((c) => c.height >= 44) &&
          layout.date === "1990-01-01" &&
          layout.time === "08:30",
      });
      if (directory) {
        await mkdir(directory, { recursive: true });
        await page.screenshot({
          path: path.join(directory, `mobile-tr-${width}x${height}.png`),
          fullPage: true,
        });
      }
    }
    await page.goto(`${origin}/login?sdkSession=admin`);
    await page.waitForSelector(
      '[data-onboarding-state="AUTHENTICATED_PROFILE_REQUIRED"]',
    );
    await page.goto(`${origin}/login?sdkSession=anonymous`);
    await page.waitForSelector(
      '[data-onboarding-state="UNAUTHENTICATED_SIGN_IN"]',
    );
    await page.goBack();
    await page.waitForSelector(
      '[data-onboarding-state="AUTHENTICATED_PROFILE_REQUIRED"]',
    );
    await page.goForward();
    await page.waitForSelector(
      '[data-onboarding-state="UNAUTHENTICATED_SIGN_IN"]',
    );
    await page.reload();
    await page.waitForSelector(
      '[data-onboarding-state="UNAUTHENTICATED_SIGN_IN"]',
    );
    rows.push({
      scenario: "back-forward-reload-session-routing",
      passed: true,
    });
    rows.push({
      scenario: "javascript-errors",
      passed: errors.length === 0,
      errors,
    });
    return rows;
  } finally {
    await context.close();
  }
}
