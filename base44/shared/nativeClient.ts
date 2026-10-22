import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { withUserLifecycle } from './userLifecycle.js';
import { withNativeWriteChecks } from './nativeWriteChecks.js';

// No global write-pause flag: the 017 decision removed mandatory deletion
// maintenance. Per-owner identity, lifecycle/tombstone, consent and privacy
// checks remain in withNativeWriteChecks on every product mutation.
export function createNativeClient(req) {
  return withNativeWriteChecks(withUserLifecycle(createClientFromRequest(req)));
}