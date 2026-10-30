// INTERNAL TOOLING service boundary — read-only content artifact validation (no import).
import { invokeHealthRead } from './healthReadService';

export async function fetchArtifactValidation(mode, options) {
  return invokeHealthRead('validateContentArtifacts', { mode }, undefined, options);
}
