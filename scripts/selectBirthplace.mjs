// Interact with the actual responsive UI; no hidden synthetic select shortcut.
export async function selectBirthplace(page, id, value) {
  const control = page.locator(`#${id}`);
  if (await control.evaluate(el => el.tagName === 'SELECT')) return control.selectOption(String(value));
  await control.click();
  await page.locator(`[data-place-option="${value}"]`).click();
  await page.locator('dialog[open]').waitFor({ state: 'detached' });
}
