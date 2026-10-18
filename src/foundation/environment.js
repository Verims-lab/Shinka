export const APP_NAME = "Shinka";

// Resolves the runtime environment from the real browser location (no secrets, no PII).
export function resolveEnvironment(loc = window.location, win = window) {
  const host = loc.hostname || "";
  if (host === "localhost" || host === "127.0.0.1") return { id: "LOCAL", host };
  let framed = false;
  try { framed = win.self !== win.top; } catch { framed = true; }
  if (/preview|sandbox/i.test(host) || framed) return { id: "PREVIEW", host };
  return { id: "PUBLISHED", host };
}