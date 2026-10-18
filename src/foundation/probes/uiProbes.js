// Rendered UI measurements for H13 contract cases.
const PRIMARY_SELECTOR = "[data-variant=primary]";

export const primaryHeights = (root) =>
  [...root.querySelectorAll(PRIMARY_SELECTOR)].map((el) => Math.round(el.getBoundingClientRect().height));

export function headingAndLabel(root) {
  const h = root.querySelector("h1");
  const b = root.querySelector("button");
  return {
    headingWeight: h ? getComputedStyle(h).fontWeight : null,
    labelWeight: b ? getComputedStyle(b).fontWeight : null,
    labelFamily: b ? getComputedStyle(b).fontFamily : "",
  };
}