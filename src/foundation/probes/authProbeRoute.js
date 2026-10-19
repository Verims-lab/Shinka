// Routing-only contract; no DOM measurement code in the application entry.
export const AUTH_PROBE_PATH = '/auth-shell-probe';
export const isAuthProbePath = path => path === AUTH_PROBE_PATH;
