// Ordinary SDK-shaped CRUD, no transaction, lock, CAS or rollback simulation.
// Clients are reconstructed over shared persisted rows; hooks inject races/loss.
import { dailyFixture, DAILY_NOW } from './dailyFixture';
import { DOMAIN_SCHEMAS, physicalName } from '../../../base44/shared/domainSchemas.js';
import { HEALTH_CONSENT_VERSION } from '../../../base44/shared/onboardingDependencies.js';
import { withUserLifecycle } from '../../../base44/shared/userLifecycle.js';
import { withNativeWriteChecks } from '../../../base44/shared/nativeWriteChecks.js';
import { calendarOperation } from '../../../base44/shared/calendarOperation.js';
import { dailyMessageOperation } from '../../../base44/shared/dailyMessageOperation.js';
import { nativeAdminTestOperation } from '../../../base44/shared/nativeAdminTestOperation.js';
import { createPreviewSigner } from '../../../base44/shared/adminTestPreview.js';
const clone = value => structuredClone(value);
const matches = (row, query) => Object.entries(query).every(([key, value]) => {
  if (key === '$or') return value.some(q => matches(row, q));
  if (value && typeof value === 'object') return Object.entries(value).every(([op, v]) => ({ $ne: () => row[key] !== v, $in: () => v.includes(row[key]), $gte: () => row[key] >= v, $lte: () => row[key] <= v })[op]?.());
  return row[key] === value;
});
export function nativeFixture({ granted = true } = {}) {
  const daily = dailyFixture();
  const tables = Object.fromEntries(Object.keys(DOMAIN_SCHEMAS).map(name => [physicalName(name), clone(daily.rows[name])]));
  Object.assign(tables, { User: [{ id: 'ownerA', role: 'user' }, { id: 'ownerB', role: 'user' }, { id: 'adminA', role: 'admin' }, { id: 'adminB', role: 'admin' }], AdminTestOperation: [], UserCalendarAction: [], InternalHealthRun: [] });
  if (granted) {
    tables.UserHealthConsent.push({ id: 'consent', user_id: 'ownerA', consent_status: 'GRANTED', consent_version: HEALTH_CONSENT_VERSION, granted_at: DAILY_NOW, withdrawn_at: null });
    tables.UserHealthConsentEvent.push({ id: 'grant', user_id: 'ownerA', event_type: 'GRANTED', consent_version: HEALTH_CONSENT_VERSION, occurred_at: DAILY_NOW });
  }
  for (const rows of Object.values(tables)) for (const row of rows) { row.created_date ??= DAILY_NOW; row.updated_date ??= DAILY_NOW; }
  const state = { before: null, after: null, paused: false, sequence: 0, calls: [], time: DAILY_NOW };
  const now = () => new Date(state.time);
  const entities = new Proxy({}, { get: (_, name) => {
    const run = async (method, args, work) => {
      const call = { name, method, args: clone(args) }; state.calls.push(call);
      await state.before?.(call); const result = work(); await state.after?.(call); return clone(result);
    };
    return {
      filter: (q, sort = 'id', limit = 100, offset = 0, fields) => run('filter', [q], () => tables[name].filter(row => matches(row, q)).sort((a,b) => { const key = sort.replace(/^-/, ''); return String(a[key] ?? '').localeCompare(String(b[key] ?? '')) * (sort.startsWith('-') ? -1 : 1); }).slice(offset, offset + limit).map(row => fields ? Object.fromEntries(fields.filter(key => row[key] !== undefined).map(key => [key, row[key]])) : row)),
      create: record => run('create', [record], () => { const row = { id: `native-${++state.sequence}`, created_date: '2026-10-20T12:00:00', ...clone(record) }; tables[name].push(row); return row; }),
      update: (id, patch) => run('update', [id, patch], () => { const row = tables[name].find(row => row.id === id); if (!row) throw new Error('MISSING_FIXTURE_ROW'); Object.assign(row, clone(patch)); return row; }),
      updateMany: (query, patch) => run('updateMany', [query, patch], () => { const rows = tables[name].filter(row => matches(row, query)); rows.forEach(row => Object.assign(row, clone(patch.$set))); return { success: true, updated: rows.length, has_more: false }; }),
      delete: id => run('delete', [id], () => { tables[name] = tables[name].filter(row => row.id !== id); return { success: true }; }),
      deleteMany: q => run('deleteMany', [q], () => { const deleted = tables[name].filter(row => matches(row, q)).length; tables[name] = tables[name].filter(row => !matches(row, q)); return { success: true, deleted }; }),
    };
  } });
  const raw = (owner = 'ownerA') => ({ auth: { me: async () => owner ? { id: owner, role: 'untrusted-cached-role' } : null }, asServiceRole: { entities }, getConfig: () => ({ appId: 'native-fixture', serverUrl: 'https://fixture.invalid' }) });
  const client = (owner = 'ownerA') => withNativeWriteChecks(withUserLifecycle(raw(owner)), { paused: () => state.paused });
  const cal = (body = { action: 'read' }, owner = 'ownerA') => calendarOperation(client(owner), { timezone: 'Europe/Istanbul', ...body }, { native: true, now });
  const change = async (action, extra = {}) => cal({ action, revision: (await cal()).revision, action_id: crypto.randomUUID(), ...extra });
  const library = async () => ({ plan: { ready: true }, actual: Object.fromEntries(Object.keys(DOMAIN_SCHEMAS).map(name => [name, clone(tables[physicalName(name)])])) });
  const today = () => dailyMessageOperation(client(), { action: 'today', timezone: 'Europe/Istanbul' }, { native: true, now, library, random: () => 0 });
  const maintenance = { get paused() { return state.paused; }, actorId: 'adminA', windowId: 'native-window-123456', drainAck: 'native-window-123456:adminA' };
  const tools = (body, owner = 'adminA') => nativeAdminTestOperation(withUserLifecycle(raw(owner)), body, { policy: { appId: 'native-fixture', label: 'TEST' }, signer: createPreviewSigner('synthetic-signing-key-at-least-32-characters', now), maintenance, now });
  const preview = (operation = 'RESET_ONBOARDING') => tools({ action: 'preview', target_id: 'ownerA', operation });
  const execute = view => tools({ action: 'execute', target_id: 'ownerA', operation: view.operation, confirmation: 'ownerA', preview_token: view.preview_token, request_id: crypto.randomUUID() });
  const once = (when, predicate) => { state[when] = async call => { if (predicate(call)) { state[when] = null; throw new Error('SYNTHETIC_LOST_RESPONSE'); } }; };
  return { tables, state, client, raw, now, cal, change, today, tools, preview, execute, maintenance, once };
}
export function barrier(count) {
  let arrived = 0, release;
  const promise = new Promise(resolve => { release = resolve; });
  return async () => { if (++arrived === count) release(); await promise; };
}
