import { testToolError } from './adminTestPolicy.js';
// HMAC binds a short-lived read-only preview. Signing is not a write fence.
// The production entry supplies no coordinator, so a configured key cannot enable mutations.
export function createPreviewSigner(secret, now = () => new Date()) {
  if (typeof secret !== 'string' || secret.length < 32) return null;
  const encoder = new TextEncoder();
  const key = crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
  const hex = bytes => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
  return {
    async sign(value) {
      const data = JSON.stringify({ ...value, expires_at: now().getTime() + 5 * 60 * 1000 });
      return `${btoa(data)}.${hex(await crypto.subtle.sign('HMAC', await key, encoder.encode(data)))}`;
    },
    async verify(token, expected) {
      try {
        const [encoded, signature, extra] = token.split('.');
        if (extra || !/^[a-f0-9]{64}$/.test(signature)) throw new Error();
        const data = atob(encoded);
        const bytes = new Uint8Array(signature.match(/../g).map(part => parseInt(part, 16)));
        if (!await crypto.subtle.verify('HMAC', await key, bytes, encoder.encode(data))) throw new Error();
        const parsed = JSON.parse(data);
        if (parsed.expires_at <= now().getTime() || parsed.expires_at > now().getTime() + 300000 || Object.entries(expected).some(([key, value]) => parsed[key] !== value)) throw new Error();
        return parsed;
      } catch { testToolError('TEST_PREVIEW_INVALID', 409); }
    },
  };
}
