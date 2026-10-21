import { cancelledTest } from '../testExecution';
// Capture counts, never arguments. Abort restores this fixture's hooks once;
// a late finally cannot overwrite the next fixture's console ownership.
export function captureFixtureConsole(methods, context = {}) {
  let count = 0, closed = false;
  const originals = methods.map(key => console[key]);
  const capture = () => { count++; };
  const dispose = () => {
    if (closed) return;
    closed = true;
    methods.forEach((key, index) => { if (console[key] === capture) console[key] = originals[index]; });
  };
  if (context.signal?.aborted) throw cancelledTest();
  methods.forEach(key => { console[key] = capture; });
  context.cleanup?.(dispose);
  return { count: () => count, dispose };
}
