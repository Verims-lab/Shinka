import { OnboardingError } from './onboardingValidation.js';

// Worker-local GeoNames burst control and short public-place cache.
// NOT a distributed quota: state is per Deno worker, resets on worker restart,
// and many workers/accounts can exceed the totals together.
export const GEONAMES_LIMITS = Object.freeze({
  windowMs: 60000,          // fixed window
  appRequests: 30,          // GeoNames-backed app requests per user per window
  upstreamCalls: 60,        // real provider fetches per user per window
  workerUpstreamCalls: 300, // real provider fetches per worker per window
  cacheTtlMs: 600000,       // 10 min, public place data only
  cacheEntries: 200,
  trackedUsers: 1000,
});

const copy = value => (value === undefined ? value : structuredClone(value));

export function createGeoNamesGuard({ limits = GEONAMES_LIMITS, now = () => Date.now(), fetcher = (...args) => fetch(...args) } = {}) {
  const users = new Map(), cache = new Map(), inflight = new Map();
  let worker = { start: 0, count: 0 };
  const limited = start => {
    const retryAfterSeconds = Math.max(1, Math.ceil((start + limits.windowMs - now()) / 1000));
    throw Object.assign(new OnboardingError('GEONAMES_RATE_LIMITED', 'birthplace', 429), { retryAfterSeconds });
  };
  const windowFor = owner => {
    const t = now(); let w = users.get(owner);
    if (!w || t - w.start >= limits.windowMs) {
      w = { start: t, app: 0, upstream: 0 }; users.delete(owner); users.set(owner, w);
      if (users.size > limits.trackedUsers) users.delete(users.keys().next().value);
    }
    return w;
  };
  // owner must come from the server-authenticated principal, never the request body.
  function forOwner(owner, createAdapter) {
    if (typeof owner !== 'string' || !owner) throw new OnboardingError('AUTH_REQUIRED', null, 401);
    let adapter = null; // created (and the secret read) only when a provider call is needed
    const counted = (url, init) => {
      const w = windowFor(owner), t = now();
      if (t - worker.start >= limits.windowMs) worker = { start: t, count: 0 };
      if (w.upstream >= limits.upstreamCalls) limited(w.start);
      if (worker.count >= limits.workerUpstreamCalls) limited(worker.start);
      w.upstream++; worker.count++;
      return fetcher(url, init);
    };
    const run = async (method, args) => {
      const w = windowFor(owner);
      if (w.app >= limits.appRequests) limited(w.start);
      w.app++;
      const key = JSON.stringify([method, args]), hit = cache.get(key);
      if (hit && hit.expires > now()) return copy(hit.value);
      if (hit) cache.delete(key);
      if (!inflight.has(key)) {
        adapter ??= createAdapter(counted);
        const pending = Promise.resolve().then(() => adapter[method](...args)).then(value => {
          cache.set(key, { value, expires: now() + limits.cacheTtlMs });
          while (cache.size > limits.cacheEntries) cache.delete(cache.keys().next().value);
          return value;
        }).finally(() => inflight.delete(key));
        inflight.set(key, pending);
      }
      return copy(await inflight.get(key));
    };
    return {
      search: (query, language) => run('search', [query, language]),
      countries: language => run('countries', [language]),
      regions: input => run('regions', [input]),
      places: input => run('places', [input]),
      resolve: id => run('resolve', [id]),
    };
  }
  return { forOwner, limits };
}