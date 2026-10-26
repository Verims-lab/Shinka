import { NOTIFICATION_COPY, notificationFail as fail } from './notificationPolicy.js';

// 030 input came from owner-relayed Base44 AI. In 034, owner-relayed Dmytro /
// Base44 Support also confirms the five field names, not the complete schema.
// Official built-in integration docs confirm 100/500/50 character limits and
// optional action/link with Home default. Full wire types/requiredness/nullability
// and Unicode counting remain unverified; this is not hosted/response proof.
/** @param {unknown} input @returns {import('./notificationProviderTypes.js').ReportedPushInput} */
export function validateReportedPushInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('PUSH_INPUT_INVALID',400);
  const value = /** @type {Record<string, unknown>} */ (input);
  if (Object.keys(value).some(key => !['user_id','title','content','action_label','action_url'].includes(key))) fail('PUSH_INPUT_INVALID',400);
  const text = (field, limit) => {
    const item = value[field];
    if (typeof item !== 'string' || !item.trim() || [...item].length > limit) fail('PUSH_INPUT_INVALID',400);
    return /** @type {string} */ (item);
  };
  /** @type {import('./notificationProviderTypes.js').ReportedPushInput} */
  const result = { user_id:text('user_id',Infinity),title:text('title',100),content:text('content',500) };
  if (value.action_label !== undefined) {
    if (value.action_label !== null && (typeof value.action_label !== 'string' || [...value.action_label].length > 50)) fail('PUSH_INPUT_INVALID',400);
    result.action_label = /** @type {string | null} */ (value.action_label);
  }
  // Home-only is app policy. Docs confirm the link is optional, not its null schema.
  // Omit the URL in the daily adapter; only the existing Home path is allowable.
  if (value.action_url !== undefined) {
    if (value.action_url !== null && value.action_url !== '/') fail('PUSH_DESTINATION_INVALID',400);
    result.action_url = /** @type {string | null} */ (value.action_url);
  }
  return result;
}

/** @param {import('./notificationProviderTypes.js').PushClient} client */
export function base44PushProvider(client) {
  return {
    async eligibility(_owner) {
      return { support:'UNKNOWN',permission:'UNKNOWN' };
    },
    async send({ owner, language }) {
      const copy = NOTIFICATION_COPY[language === 'tr' ? 'tr' : 'en'];
      // Docs specify Home when the optional link is omitted; device proof is open.
      // No daily date or personal snapshot enters this minimal notification.
      const params = validateReportedPushInput({ user_id:owner,title:copy.title,content:copy.message });
      try {
        // Owner-relayed support warns unknown/misnamed fields can be silently
        // dropped even on success. No concrete acceptance response is known;
        // a fulfilled promise proves neither field processing nor device display.
        await client.asServiceRole.integrations.Core.SendPushNotification(params);
      } catch { /* 403/502/timeout are not a complete no-send/error contract. */ }
      // Never forward raw output, infer SENT, or automatically retry this call.
      return { kind:'unknown' };
    },
  };
}
