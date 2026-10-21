import { handleInternalRequest } from "../../shared/internalAuthorization.js";
// INTERNAL TOOLING — admin-only, read-only content artifact validation. Performs NO import.
import { createNativeClient } from '../../shared/nativeClient.ts';
import { artifactOperation } from "../../shared/contentArtifactOperation.ts";
export default (req) => handleInternalRequest(req, createNativeClient, artifactOperation);
