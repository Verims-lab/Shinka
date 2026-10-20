import { validateDomainRecord } from './domainValidation.js';
import { projectOperation, testToolError } from './adminTestPolicy.js';

// The existing 20-entity audit schema stays unchanged. Its target_record_id
// links the operation journal, which supplies the exact closed operation kind.
export function testAuditRecord(job, status, instant, errorCode = null) {
  const operation = projectOperation(job);
  if (!['SUCCESS', 'FAILED'].includes(status) || errorCode != null && !/^[A-Z][A-Z0-9_]{1,79}$/.test(errorCode)) testToolError('INVALID_TEST_AUDIT');
  return validateDomainRecord('admin_audit_log', {
    admin_user_id: operation.actor_id, target_user_id: operation.target_id,
    target_entity: 'AdminTestOperation', target_record_id: operation.operation_id,
    action_type: operation.operation === 'DELETE_USER' ? 'DELETE' : 'UPDATE',
    action_status: status, performed_at: instant, error_code: errorCode,
  });
}
