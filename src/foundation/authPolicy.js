// OD-003 auth policy. Approved: Apple + Google only. The platform login-method configuration is not readable from the
// client at runtime, so the observed configuration is a RECORDED snapshot (read from the Base44 platform state).
// Update OBSERVED_AUTH_METHODS only after re-reading the platform state; never edit it to force a PASS.
export const APPROVED_AUTH_METHODS = Object.freeze(["apple", "google"]);
export const OBSERVED_AUTH_METHODS = Object.freeze({
  observedAt: "2026-10-21", source: "Read-only Base44 Dashboard > Settings > Authentication; Google/Apple ON, email/password/Microsoft/Facebook OFF",
  methods: ["google", "apple"],
});

/** @param {{methods: string[], observedAt?: string, source?: string}} [observed] */
export function checkAuthPolicy(observed = OBSERVED_AUTH_METHODS) {
  const unapproved = observed.methods.filter((m) => !APPROVED_AUTH_METHODS.includes(m));
  return { ok: unapproved.length === 0 && APPROVED_AUTH_METHODS.every((m) => observed.methods.includes(m)), passwordEnabled: observed.methods.includes("password"), unapproved,
    appleConfigured: observed.methods.includes("apple"), googleConfigured: observed.methods.includes("google") };
}