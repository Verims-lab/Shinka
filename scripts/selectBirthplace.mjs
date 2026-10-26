// Actual single-search combobox; only an explicit option click supplies an ID.
export async function selectBirthplace(page, query, value) {
  await page.locator('#birthplace').fill(query);
  await page.locator(`[data-place-option="${value}"]`).click();
  await page.locator('[data-place-popup]').waitFor({state:'detached'});
}
