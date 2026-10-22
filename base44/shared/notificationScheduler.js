import { InternalError, requireAuthenticatedUser, requireAdmin } from './internalAuthorization.js';
import { withUserLifecycle } from './userLifecycle.js';
import { readBoundedJson } from './boundedJson.js';
import { produceDailyForOwner } from './dailyMessageOperation.js';
import { notificationOwner } from './notificationOwner.js';
import { deliverDailyNotification } from './notificationDelivery.js';
import { NOTIFICATION_LIMITS, notificationWindow, notificationFail as fail } from './notificationPolicy.js';

let running = false;
export async function notificationTick(client, { provider, library, now = () => new Date(), elapsed = () => performance.now(), admitCaller = async () => {} }) {
  if (running) return { state:'BUSY',processed:0 };
  running = true;
  try {
    await admitCaller();
    const store = client.asServiceRole.entities, checkpoints = store.NotificationSchedule;
    const states = await checkpoints.filter({ schedule_key:'DAILY_SHINKA' }, 'id', 2);
    if (!Array.isArray(states) || states.length > 1) fail('NOTIFICATION_CHECKPOINT_CONFLICT');
    let checkpoint = states[0];
    if (!checkpoint) {
      await admitCaller();
      await checkpoints.create({ schedule_key:'DAILY_SHINKA',cursor:'',last_tick_at:now().toISOString() });
      const created = await checkpoints.filter({ schedule_key:'DAILY_SHINKA' },'id',2);
      if (!Array.isArray(created) || created.length !== 1) fail('NOTIFICATION_CHECKPOINT_CONFLICT');
      checkpoint = created[0];
    }
    if (typeof checkpoint.cursor !== 'string' || checkpoint.cursor.length > 128 || !checkpoint.id) fail('NOTIFICATION_CHECKPOINT_CONFLICT');
    await admitCaller();
    const page = await store.UserPreferences.filter(checkpoint.cursor ? { id:{ $gt:checkpoint.cursor } } : {},'id',NOTIFICATION_LIMITS.pageSize);
    if (!Array.isArray(page) || page.length > NOTIFICATION_LIMITS.pageSize || page.some((row,i) => typeof row.id !== 'string' || !row.id || typeof row.user_id !== 'string' || !row.user_id || row.id <= checkpoint.cursor || i && row.id <= page[i-1].id)) fail('NOTIFICATION_PAGE_INVALID');
    const start = elapsed(), counts = {}, count = state => { counts[state] = (counts[state] || 0) + 1; };
    let processed = 0, cursor = checkpoint.cursor;
    for (const preference of page) {
      if (elapsed() - start >= NOTIFICATION_LIMITS.budgetMs) break;
      try {
        const owner = notificationOwner(client, preference.user_id, now, admitCaller);
        const current = await owner.admit(), window = notificationWindow(now(), current.timezone);
        if (!window.due) count('OUTSIDE_WINDOW');
        else {
          // Content production happens before any preference/device send gate.
          const produced = await produceDailyForOwner(owner.client, preference.user_id, { action:'today',timezone:current.timezone }, { native:true,now,library }, owner.admit);
          count((await deliverDailyNotification({ client:owner.client, owner:preference.user_id, daily:produced.daily, window, admit:owner.admit, provider, now })).state);
        }
      } catch (error) {
        // No raw error/payload/owner ID enters the returned summary or logs.
        count(error instanceof InternalError && ['AUTH_REQUIRED','ACCOUNT_INACTIVE','ACCOUNT_DELETION_IN_PROGRESS','ACCOUNT_LIFECYCLE_BLOCKED','PROFILE_COMPLETION_REQUIRED'].includes(error.code) ? 'INELIGIBLE' : 'BLOCKED');
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
export async function handleNotificationSchedule(req, { createClient, enabled = false, createProvider, library, now = () => new Date(), elapsed = () => performance.now() }) {
  try {
    if (req.method !== 'POST') fail('METHOD_NOT_ALLOWED',405);
    const raw = createClient(req);
    // Authenticate before even constructing a service-role lifecycle repository.
    const initial = await requireAuthenticatedUser(raw);
    const client = withUserLifecycle(raw);
    const admitCaller = async () => {
      // Shared guard + fresh native User/lifecycle read; cached role is not used.
      if ((await requireAdmin(client)).id !== initial.id) fail('AUTH_REQUIRED',401);
    };
    await admitCaller();
    const body = await readBoundedJson(req,512,fail);
    if (body?.action !== 'tick' || Object.keys(body).some(key => key !== 'action')) fail('INVALID_REQUEST',400);
    if (!enabled) return Response.json({ state:'DISABLED',processed:0 });
    await admitCaller();
    return Response.json(await notificationTick(client, { provider:createProvider(client),library,now,elapsed,admitCaller }));
  } catch (error) {
    return Response.json({ error_code:error instanceof InternalError ? error.code : 'NOTIFICATION_SCHEDULE_FAILED' }, { status:error instanceof InternalError ? error.status : 503 });
  }
}
