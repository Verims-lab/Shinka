import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import { withUserLifecycle } from './userLifecycle.js';
import { withNativeWriteChecks } from './nativeWriteChecks.js';

export function createNativeClient(req) {
  return withNativeWriteChecks(withUserLifecycle(createClientFromRequest(req)), {
    paused: () => secrets.get('SHINKA_WRITE_MODE') === 'PAUSED',
  });
}
