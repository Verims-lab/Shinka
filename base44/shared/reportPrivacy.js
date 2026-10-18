const SENSITIVE_KEY = /token|password|secret|cookie|authorization|email|session|api[_-]?key|health[_-]?(data|records?)|symptoms?|message[_-]?body|birth[_-]?(date|time|place)|full[_-]?name/i;
const SENSITIVE_VALUES = [/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+/g, /Bearer\s+\S+/gi, /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g];

export function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, SENSITIVE_KEY.test(k) ? "[REDACTED]" : redact(v)]));
  }
  if (typeof value === "string") return SENSITIVE_VALUES.reduce((s, re) => s.replace(re, "[REDACTED]"), value);
  return value;
}