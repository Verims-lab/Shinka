// User-relayed Base44 AI input schema (030); not a live-verified SDK contract.
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
