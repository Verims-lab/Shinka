import { InternalError } from './internalAuthorization.js';
import { DOMAIN_SCHEMAS, SHARED_ENTITIES } from './domainSchemas.js';

export const testToolError = (code, status = 409) => { throw new InternalError(code, status); };
export const TEST_OPERATIONS = Object.freeze(['DELETE_USER']);
// Historical receipts remain readable and keep their lifecycle fences. They
// are not commands: no admin endpoint may create or resume a retired reset.
const READABLE_OPERATIONS = Object.freeze(['RESET_ONBOARDING', ...TEST_OPERATIONS]);
export function requireTestOperationWrite(operation) {
  if (operation === 'RESET_ONBOARDING') testToolError('TEST_RESET_RETIRED', 410);
  if (!TEST_OPERATIONS.includes(operation)) testToolError('INVALID_REQUEST', 400);
}
export const OPERATION_ENTITY = 'AdminTestOperation';
export const OPERATION_FIELDS = Object.freeze(['id', 'operation_id', 'actor_id', 'target_id', 'operation', 'status', 'stage', 'request_id', 'preview_hash', 'started_at', 'progressed_at', 'completed_at', 'error_code', 'checkpoints']);
export const OPERATION_STATUSES = Object.freeze(['RUNNING', 'RETRY_REQUIRED', 'AUDIT_PENDING', 'RESET_ACTIVE', 'COMPLETED']);
export const RESET_STAGES = Object.freeze(['PROFILE', 'CYCLE', 'FIRST_SHINKA']);
export const DELETE_STEPS = Object.freeze(['NOTIFICATIONS', 'user_cycle_phase_day', 'user_cycle_prediction', 'user_cycle_settings', 'user_period_record', 'user_pattern_summary', 'user_preferences', 'user_profile', 'USER', 'VERIFY']);
export const DELETED_ENTITIES = Object.freeze(DELETE_STEPS.filter(name => name in DOMAIN_SCHEMAS));
export const RETAINED_ENTITIES = Object.freeze(['user_health_consent', 'user_health_consent_event', 'user_daily_message', 'notification_delivery', 'admin_audit_log', 'health_data_deletion_job', 'data_protection_event', 'system_error_log']);
export { SHARED_ENTITIES };
export const validToolId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value);
export const hashToolValue = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(value)))), b => b.toString(16).padStart(2, '0')).join('');

const actions = {
  lookup: ['target_id'],
  preview: ['target_id', 'operation'],
  execute: ['target_id', 'operation', 'confirmation', 'preview_token', 'request_id'],
  status: ['target_id', 'operation_id'],
  resume: ['target_id', 'operation_id'],
};
export function validateTestRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || !Object.hasOwn(actions, body.action)) testToolError('INVALID_REQUEST', 400);
  if (Object.keys(body).some(key => !['action', ...actions[body.action]].includes(key)) || !validToolId(body.target_id)) testToolError('INVALID_REQUEST', 400);
  if (['preview', 'execute'].includes(body.action)) requireTestOperationWrite(body.operation);
  if (['status', 'resume'].includes(body.action) && !validToolId(body.operation_id)) testToolError('INVALID_REQUEST', 400);
  if (body.action === 'execute' && (!validToolId(body.request_id) || body.request_id.length < 16 || body.confirmation !== true || typeof body.preview_token !== 'string' || body.preview_token.length > 4000)) testToolError('CONFIRMATION_INVALID', 400);
}
export function projectOperation(row) {
  if (!row || !validToolId(row.operation_id) || !validToolId(row.target_id) || !validToolId(row.actor_id) || !READABLE_OPERATIONS.includes(row.operation) || !OPERATION_STATUSES.includes(row.status)) testToolError('TEST_OPERATION_STATE_INVALID');
  const instant = value => typeof value === 'string' && /(Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));
  if (row.request_id !== row.operation_id || !/^[a-f0-9]{64}$/.test(row.preview_hash) || !instant(row.started_at) || !instant(row.progressed_at) || row.completed_at != null && !instant(row.completed_at)) testToolError('TEST_OPERATION_STATE_INVALID');
  if (!['START', 'DONE', ...RESET_STAGES, ...DELETE_STEPS].includes(row.stage) || row.error_code != null && !/^[A-Z][A-Z0-9_]{1,79}$/.test(row.error_code)) testToolError('TEST_OPERATION_STATE_INVALID');
  if (!Array.isArray(row.checkpoints) || row.checkpoints.some(stage => !DELETE_STEPS.includes(stage)) || new Set(row.checkpoints).size !== row.checkpoints.length) testToolError('TEST_OPERATION_STATE_INVALID');
  if (row.operation === 'RESET_ONBOARDING' && row.status === 'RESET_ACTIVE' && !RESET_STAGES.includes(row.stage)) testToolError('TEST_OPERATION_STATE_INVALID');
  if (row.operation === 'DELETE_USER' && row.status === 'RESET_ACTIVE') testToolError('TEST_OPERATION_STATE_INVALID');
  if (row.status === 'COMPLETED' && (row.operation === 'DELETE_USER' ? row.stage !== 'VERIFY' || !DELETE_STEPS.every(stage => row.checkpoints.includes(stage)) : row.stage !== 'DONE')) testToolError('TEST_OPERATION_STATE_INVALID');
  return Object.fromEntries(OPERATION_FIELDS.filter(key => row[key] !== undefined).map(key => [key, row[key]]));
}
// Server-injected capability only. No environment flag or JSON field enables a writer.
export function requireTestCoordinator(coordinator) {
  if (!coordinator || coordinator.contract !== 'shinka.target-lifecycle/1' || typeof coordinator.run !== 'function') testToolError('ADMIN_TEST_DURABLE_CAPABILITY_REQUIRED', 503);
}
