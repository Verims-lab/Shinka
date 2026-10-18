import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import { handleInternalRequest } from "../../shared/internalAuthorization.js";
import { internalHealthOperation } from "../../shared/internalHealthOperations.js";
export default (req) => handleInternalRequest(req, createClientFromRequest, internalHealthOperation);
