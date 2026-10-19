// Incremental Build contract helpers (pure). No marker literals live here.
export const ACTIVE_PACKAGE_LIMIT = 5;
export const MARKER_PATTERN = /^Buildmarker-(\d{3})$/;

export const isValidMarker = (m) => typeof m === "string" && MARKER_PATTERN.test(m);

export function markerNumber(m) {
  if (!isValidMarker(m)) throw new Error("BUILD_MARKER_INVALID_FORMAT");
  return Number(m.match(MARKER_PATTERN)[1]);
}

export function nextMarker(m) {
  const n = markerNumber(m) + 1;
  if (n > 999) throw new Error("BUILD_MARKER_OVERFLOW");
  return `Buildmarker-${String(n).padStart(3, "0")}`;
}

export function validateTransition(prev, next) {
  const a = markerNumber(prev);
  const b = markerNumber(next);
  if (b < a) return { ok: false, code: "BUILD_MARKER_DECREMENT" };
  if (b === a) return { ok: false, code: "BUILD_MARKER_NOT_INCREMENTED" };
  if (b !== a + 1) return { ok: false, code: "BUILD_MARKER_SKIPPED" };
  return { ok: true };
}

// Active ledger: at most five unique, consecutive packages; head equals canonical marker.
// Older packages live in Git, so the retained sequence need not start at 001.
export function validateLedger(ledger, canonical) {
  const errors = [];
  if (!ledger.length) errors.push("LEDGER_EMPTY");
  if (ledger.length > ACTIVE_PACKAGE_LIMIT) errors.push("LEDGER_RETENTION_EXCEEDED");
  const seen = new Set();
  ledger.forEach((e, i) => {
    if (!isValidMarker(e.build_marker)) errors.push(`INVALID_FORMAT@${i}`);
    else if (seen.has(e.build_marker)) errors.push(`DUPLICATE:${e.build_marker}`);
    seen.add(e.build_marker);
    if (i > 0 && isValidMarker(e.build_marker) && isValidMarker(ledger[i - 1].build_marker)) {
      const t = validateTransition(ledger[i - 1].build_marker, e.build_marker);
      if (!t.ok) errors.push(`${t.code}@${i}`);
    }
  });
  const last = ledger[ledger.length - 1]?.build_marker;
  if (last !== canonical) errors.push("LEDGER_HEAD_NOT_CANONICAL");
  return { ok: errors.length === 0, errors };
}