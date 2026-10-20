// Per-picker public provider lists only. Never persisted or shared across owners/screens.
export const PLACE_CACHE_LIMITS = Object.freeze({
  entries: 16,
  bytes: 1048576,
  ttlMs: 60000,
});
export function createPlaceListCache(now = () => performance.now()) {
  const entries = new Map();
  let bytes = 0;
  const remove = (key) => {
    bytes -= entries.get(key)?.bytes || 0;
    entries.delete(key);
  };
  const expire = () => {
    for (const [key, entry] of entries) if (entry.expires <= now()) remove(key);
  };
  return {
    get(key) {
      expire();
      const entry = entries.get(key);
      if (!entry) return null;
      entries.delete(key);
      entries.set(key, entry);
      return entry.data;
    },
    set(key, data) {
      expire();
      remove(key);
      const size = new TextEncoder().encode(JSON.stringify(data)).byteLength;
      if (size > PLACE_CACHE_LIMITS.bytes) return;
      while (
        entries.size >= PLACE_CACHE_LIMITS.entries ||
        bytes + size > PLACE_CACHE_LIMITS.bytes
      )
        remove(entries.keys().next().value);
      entries.set(key, {
        data,
        bytes: size,
        expires: now() + PLACE_CACHE_LIMITS.ttlMs,
      });
      bytes += size;
    },
    clear() {
      entries.clear();
      bytes = 0;
    },
    stats() {
      expire();
      return { entries: entries.size, bytes };
    },
  };
}
