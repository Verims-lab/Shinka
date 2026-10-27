// 042 owner-relayed Fode/Base44 Support contract; not a hosted receipt.
// SDK integrations resolve the JSON body. Channel contents stay unknown.
/**
 * @typedef {object} ReportedPushInput
 * @property {string} user_id
 * @property {string} title
 * @property {string} content
 * @property {string | null} [action_label]
 * @property {string | null} [action_url]
 */
/**
 * @typedef {object} PushClient
 * @property {{integrations: {Core: {SendPushNotification: (input: ReportedPushInput) => Promise<unknown>}}}} asServiceRole
 */
export {};
