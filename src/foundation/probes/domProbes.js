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

// Loads a same-origin route in a hidden fixed-width iframe and measures horizontal overflow. Bounded by timeout.
export function probeMobileOverflow(path, width = 360, timeoutMs = 15000) {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.setAttribute("title", "layout probe");
    iframe.tabIndex = -1;
    Object.assign(iframe.style, { position: "fixed", left: "-10000px", top: "0", width: `${width}px`, height: "720px", border: "0", visibility: "hidden" });
    const t0 = performance.now();
    let done = false;
    const finish = (r) => {
      if (done) return;
      done = true; clearInterval(poll); clearTimeout(timer); iframe.remove();
      resolve({ ...r, width, ms: Math.round(performance.now() - t0) });
    };
    // Lifecycle: LOADING → MEASURED (page root [data-probe-root] rendered) | TIMEOUT (with reason + landed path) | ERROR.
    const landed = () => { try { return iframe.contentWindow?.location?.pathname ?? null; } catch { return null; } };
    const timer = setTimeout(() => finish({ state: "TIMEOUT", reason: "PROBE_ROOT_NOT_RENDERED", path, landedPath: landed(), scrollWidth: null, overflow: null }), timeoutMs);
    const poll = setInterval(() => {
      try {
        const d = iframe.contentDocument;
        if (d?.querySelector("[data-probe-root]")) {
          const scrollWidth = Math.max(d.documentElement.scrollWidth, d.body.scrollWidth);
          finish({ state: "MEASURED", path, scrollWidth, overflow: scrollWidth > width + 1 });
        }
      } catch (e) { finish({ state: "ERROR", reason: "FRAME_INACCESSIBLE", path, detail: String(e?.name || e), scrollWidth: null, overflow: null }); }
    }, 200);
    iframe.src = path;
    document.body.appendChild(iframe);
  });
}