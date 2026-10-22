import { DOMAIN_SCHEMAS } from './domainSchemas.js';
import { assertPrivacyAccess } from './privacyPolicy.js';
import { isOnboardingProfileReady } from './onboardingRoute.js';
import { serverLocalDate } from './onboardingValidation.js';
import { notificationFail as fail } from './notificationPolicy.js';

// Runs only after scheduler authorization. No invented user auth principal and
// no permission to update profile/consent/history. Rechecked before every write.
export function notificationOwner(client, owner, now, admitCaller = async () => {}) {
  const store = client.asServiceRole.entities;
  const one = async name => {
    const entity = name === 'UserProfile' ? 'user_profile' : 'user_preferences';
    const rows = await store[name].filter({ user_id: owner }, 'id', 2, 0, ['id', ...Object.keys(DOMAIN_SCHEMAS[entity].properties)]);
    if (!Array.isArray(rows) || rows.length !== 1 || rows[0].user_id !== owner) fail('NOTIFICATION_OWNER_UNCONFIRMED');
    return rows[0];
  };
  const admit = async () => {
    await admitCaller();
    const users = await store.User.filter({ id: owner }, 'id', 2, 0, ['id']);
    if (!Array.isArray(users) || users.length !== 1 || users[0].id !== owner) fail('AUTH_REQUIRED', 401);
    await assertPrivacyAccess(client, owner);
    const lifecycle = await store.AdminTestOperation.filter({ target_id: owner, $or: [{ operation: 'DELETE_USER' }, { status: { $ne: 'COMPLETED' } }] }, 'id', 1, 0, ['id']);
    if (!Array.isArray(lifecycle) || lifecycle.length) fail('ACCOUNT_LIFECYCLE_BLOCKED', 403);
    const [profile, preferences] = await Promise.all([one('UserProfile'), one('UserPreferences')]);
    if (profile.account_status !== 'ACTIVE') fail('ACCOUNT_INACTIVE', 403);
    const day = serverLocalDate(now(), preferences.timezone);
    if (!isOnboardingProfileReady(profile, preferences, day)) fail('PROFILE_COMPLETION_REQUIRED');
    const completed = await store.UserDailyMessage.filter({ user_id: owner }, 'id', 1, 0, ['id','user_id']);
    if (!Array.isArray(completed) || completed.length !== 1 || completed[0].user_id !== owner) fail('PROFILE_COMPLETION_REQUIRED');
    // Return this fresh phase's records for the common engine to validate/use.
    // Never retain an admission between calls, owners, writes or requests.
    return { profile, preferences };
  };
  const entities = new Proxy(store, { get(target, name) {
    const entity = target[name];
    if (!entity) return entity;
    return new Proxy(entity, { get(handler, method) {
      if (method === 'filter') return handler.filter.bind(handler);
      return async (...args) => {
        if (!((name === 'UserDailyMessage' && method === 'create') || (name === 'NotificationDelivery' && ['create','update'].includes(String(method))))) fail('NOTIFICATION_WRITE_FORBIDDEN', 403);
        await admit();
        if (method === 'create' && args[0]?.user_id !== owner) fail('FORGED_OWNER', 403);
        if (method === 'update') {
          const rows = await handler.filter({ id: args[0], user_id: owner }, 'id', 2, 0, ['id','user_id']);
          if (!Array.isArray(rows) || rows.length !== 1 || rows[0].user_id !== owner || args[1]?.user_id && args[1].user_id !== owner) fail('FORGED_OWNER', 403);
        }
        const result = await handler[method](...args);
        await admit();
        return result;
      };
    } });
  } });
  return { admit, client: { ...client, asServiceRole: { ...client.asServiceRole, entities }, shinkaAssertWritable: admit } };
}
