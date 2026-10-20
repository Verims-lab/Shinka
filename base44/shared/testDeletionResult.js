import { DELETED_ENTITIES } from './adminTestPolicy.js';
// A missing User alone never establishes completion of operational cleanup.
export async function verifyTestDeletion(repository, target) {
  if (await repository.user(target)) return false;
  if (repository.calendarActions && (await repository.calendarActions(target)).length) return false;
  for (const entity of DELETED_ENTITIES) if ((await repository.owned(entity, target)).length) return false;
  return !(await repository.owned('notification_delivery', target)).some(row => ['PENDING','FAILED'].includes(row.delivery_status));
}
export async function testOperationOutcome(repository, job) {
  if (!job) return null;
  if (job.status !== 'COMPLETED') return job.status === 'RESET_ACTIVE' ? 'RESET_ACTIVE' : 'PARTIAL';
  return job.operation !== 'DELETE_USER' || await verifyTestDeletion(repository, job.target_id) ? 'COMPLETED' : 'PARTIAL';
}
