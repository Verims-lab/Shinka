// Drives the You bottom-sheet preference picker (replaced native <select>).
export async function pickPreference(page, id, value) {
  await page.locator(`#${id}`).click();
  await page.locator(`[data-pref-sheet="${id}"] [data-option="${value}"]`).click();
  await page.locator(`[data-pref-sheet="${id}"]`).waitFor({ state: 'detached' });
}
export const preferenceValue = (page, id) => page.locator(`#${id}`).getAttribute('data-value');