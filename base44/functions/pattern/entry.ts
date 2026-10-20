import { createNativeClient } from '../../shared/nativeClient.ts';
import { handlePatternRequest } from '../../shared/patternOperation.js';
export default async function (req) {
  return handlePatternRequest(req, createNativeClient);
}
