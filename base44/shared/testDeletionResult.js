import { DELETED_ENTITIES, DELETE_STEPS } from './adminTestPolicy.js';
// Safe scope identifiers only. A failed read never becomes an empty scope.
export async function testDeletionResiduals(repository, target) {
  const residual=[];
  if(await repository.user(target))residual.push('USER');
  if(repository.calendarActions&&(await repository.calendarActions(target)).length)residual.push('user_period_record');
  for(const entity of DELETED_ENTITIES)if(repository.hasOwned?await repository.hasOwned(entity,target):(await repository.owned(entity,target)).length)residual.push(entity);
  if(repository.hasPendingNotifications?await repository.hasPendingNotifications(target):(await repository.owned('notification_delivery',target)).some(row=>['PENDING','FAILED'].includes(row.delivery_status)))residual.push('NOTIFICATIONS');
  return DELETE_STEPS.filter(stage=>residual.includes(stage));
}
// A missing User alone never establishes completion of operational cleanup.
export async function verifyTestDeletion(repository, target) {
  if (await repository.user(target)) return false;
  if (repository.calendarActions && (await repository.calendarActions(target)).length) return false;
  for (const entity of DELETED_ENTITIES) if (repository.hasOwned ? await repository.hasOwned(entity, target) : (await repository.owned(entity, target)).length) return false;
  if (repository.hasPendingNotifications) return !await repository.hasPendingNotifications(target);
  return !(await repository.owned('notification_delivery', target)).some(row => ['PENDING','FAILED'].includes(row.delivery_status));
}
export async function testOperationOutcome(repository, job) {
  if (!job) return null;
  if (job.status !== 'COMPLETED') return job.status === 'RESET_ACTIVE' ? 'RESET_ACTIVE' : 'PARTIAL';
  return job.operation !== 'DELETE_USER' || await verifyTestDeletion(repository, job.target_id) ? 'COMPLETED' : 'PARTIAL';
}
