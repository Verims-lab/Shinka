import { InternalError, requireAuthenticatedUser, requireAdmin } from './internalAuthorization.js';
import { withUserLifecycle } from './userLifecycle.js';
import { readBoundedJson } from './boundedJson.js';
import { produceDailyForOwner } from './dailyMessageOperation.js';
import { notificationOwner } from './notificationOwner.js';
import { deliverDailyNotification } from './notificationDelivery.js';
import { NOTIFICATION_LIMITS, notificationWindow, notificationFail as fail } from './notificationPolicy.js';

let running = false;
export async function notificationTick(client, { provider = null, createProvider = null, library, now = () => new Date(), elapsed = () => performance.now(), admitCaller = async () => {} }) {
  await admitCaller();
  if (running) return { state:'BUSY',processed:0 };
  running = true;
  try {
    provider ??= createProvider?.(client);
    if (!provider) fail('NOTIFICATION_PROVIDER_REQUIRED');
    const store = client.asServiceRole.entities, checkpoints = store.NotificationSchedule;
    const states = await checkpoints.filter({ schedule_key:'DAILY_SHINKA' }, 'id', 2, 0, ['id','schedule_key','cursor']);
    if (!Array.isArray(states) || states.length > 1) fail('NOTIFICATION_CHECKPOINT_CONFLICT');
    let checkpoint = states[0];
    if (!checkpoint) {
      await admitCaller();
      await checkpoints.create({ schedule_key:'DAILY_SHINKA',cursor:'',last_tick_at:now().toISOString() });
      const created = await checkpoints.filter({ schedule_key:'DAILY_SHINKA' },'id',2,0,['id','schedule_key','cursor']);
      if (!Array.isArray(created) || created.length !== 1) fail('NOTIFICATION_CHECKPOINT_CONFLICT');
      checkpoint = created[0];
    }
    if (typeof checkpoint.cursor !== 'string' || checkpoint.cursor.length > 128 || !checkpoint.id) fail('NOTIFICATION_CHECKPOINT_CONFLICT');
    await admitCaller();
    const page = await store.UserPreferences.filter(checkpoint.cursor ? { id:{ $gt:checkpoint.cursor } } : {},'id',NOTIFICATION_LIMITS.pageSize,0,['id','user_id']);
    if (!Array.isArray(page) || page.length > NOTIFICATION_LIMITS.pageSize || page.some((row,i) => typeof row.id !== 'string' || !row.id || typeof row.user_id !== 'string' || !row.user_id || row.id <= checkpoint.cursor || i && row.id <= page[i-1].id)) fail('NOTIFICATION_PAGE_INVALID');
    const start = elapsed(), counts = {}, count = state => { counts[state] = (counts[state] || 0) + 1; };
    let processed = 0, cursor = checkpoint.cursor;
    for (const preference of page) {
      if (elapsed() - start >= NOTIFICATION_LIMITS.budgetMs) break;
      try {
        const owner = notificationOwner(client, preference.user_id, now, admitCaller);
        let window;
        const admitDaily = async () => {
          const state = await owner.admit();
          if (!window) {
            window = notificationWindow(now(), state.preferences.timezone);
            if (!window.due) fail('NOTIFICATION_OUTSIDE_WINDOW');
          }
          return state;
        };
        // The common engine owns initial admission; reuse its fresh records for
        // the window and daily state, without a second scheduler admission.
        const produced = await produceDailyForOwner(owner.client, preference.user_id, { action:'today' }, { native:true,now,library }, admitDaily);
        count((await deliverDailyNotification({ client:owner.client, owner:preference.user_id, daily:produced.daily, window, admit:owner.admit, provider, now })).state);
      } catch (error) {
        // No raw error/payload/owner ID enters the returned summary or logs.
        count(error instanceof InternalError && error.code === 'NOTIFICATION_OUTSIDE_WINDOW' ? 'OUTSIDE_WINDOW' : error instanceof InternalError && ['AUTH_REQUIRED','ACCOUNT_INACTIVE','ACCOUNT_DELETION_IN_PROGRESS','ACCOUNT_LIFECYCLE_BLOCKED','PROFILE_COMPLETION_REQUIRED'].includes(error.code) ? 'INELIGIBLE' : 'BLOCKED');
      }
      cursor = preference.id; processed++;
      await admitCaller();
      await checkpoints.update(checkpoint.id, { cursor,last_tick_at:now().toISOString() });
    }
    const complete = processed === page.length && page.length < NOTIFICATION_LIMITS.pageSize;
    if (complete) { await admitCaller(); await checkpoints.update(checkpoint.id, { cursor:'',last_tick_at:now().toISOString() }); }
    return { state:'COMPLETE',processed,counts,cycleComplete:complete };
  } finally { running = false; }
}
export async function handleNotificationSchedule(req, { createClient, enabled = false, createProvider, library, now = () => new Date(), elapsed = () => performance.now(), admitMachine = null }) {
  try {
    if (req.method !== 'POST') fail('METHOD_NOT_ALLOWED',405);
    let client, admitCaller;
    // Only a trusted server binding can select machine admission. Request data
    // cannot supply this callback; no fallback or synthetic user/admin identity.
    if (admitMachine !== null) {
      if (typeof admitMachine !== 'function') fail('NOTIFICATION_AUTH_UNAVAILABLE',503);
      await admitMachine();
      client = createClient(req);
      admitCaller = admitMachine;
    } else {
      const raw = createClient(req);
      // Authenticate before constructing a service-role lifecycle repository.
      const initial = await requireAuthenticatedUser(raw);
      client = withUserLifecycle(raw);
      admitCaller = async () => {
        // Shared guard + fresh native User/lifecycle read; cached role is not used.
        if ((await requireAdmin(client)).id !== initial.id) fail('AUTH_REQUIRED',401);
      };
      await admitCaller();
    }
    const body = await readBoundedJson(req,512,fail);
    if (body?.action !== 'tick' || Object.keys(body).some(key => key !== 'action')) fail('INVALID_REQUEST',400);
    if (!enabled) return Response.json({ state:'DISABLED',processed:0 });
    // Tick re-admits after body IO and before provider construction/job access.
    return Response.json(await notificationTick(client, { createProvider,library,now,elapsed,admitCaller }));
  } catch (error) {
    return Response.json({ error_code:error instanceof InternalError ? error.code : 'NOTIFICATION_SCHEDULE_FAILED' }, { status:error instanceof InternalError ? error.status : 503 });
  }
}
