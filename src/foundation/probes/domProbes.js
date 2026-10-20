// Real DOM probes (single implementation for Health and foundation tests).
const CONTROLS = 'button, a[href], input, select, textarea, [role="button"], [role="combobox"], [role="switch"]';
const isHidden = (el) => !!el.closest('[aria-hidden="true"]') || el.getAttribute("type") === "hidden";

export function accessibleName(el) {
  const doc = el.ownerDocument;
  const labelledBy = el.getAttribute("aria-labelledby");
  const fromLabelledBy = labelledBy ? labelledBy.split(" ").map((id) => doc.getElementById(id)?.textContent || "").join(" ") : "";
  const fromLabel = el.id ? doc.querySelector(`label[for="${el.id}"]`)?.textContent || "" : "";
  return (el.getAttribute("aria-label") || fromLabelledBy || fromLabel || el.textContent || el.getAttribute("title") || "").trim();
}

const describe = (el) => `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}`;

export function findUnlabeledControls(root) {
  if (!root) return null;
  return [...root.querySelectorAll(CONTROLS)].filter((el) => !isHidden(el) && !accessibleName(el)).map(describe);
}

export function findSmallTargets(root, min) {
  if (!root) return null;
  return [...root.querySelectorAll(CONTROLS)].filter((el) => {
    if (isHidden(el)) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && (r.width < min - 0.5 || r.height < min - 0.5);
  }).map((el) => `${describe(el)}:${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`);
}

// A real top-level browser viewport measurement is supplied by the browser runner.
// No hidden frames, iframe timers, CSP changes or container-width substitutions.
export async function probeMobileOverflow(path, width = 360, _timeoutMs = 15000) {
  const { browserMeasurement } = await import('./browserEvidence');
  return browserMeasurement('layout', path.split('?')[0], width);
}
