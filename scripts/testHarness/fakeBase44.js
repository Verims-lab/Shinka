// CLI-only dependency injection. This file is not imported by the application build.
export const base44 = {
  auth: { loginWithProvider: async () => { throw new Error("SYNTHETIC_AUTH_NO_REDIRECT"); } },
  functions: { invoke: async (_name, body) => {
    if (body.action === "list") return {data:{runs:[]}};
    throw new Error("LIVE_OPERATION_UNAVAILABLE_IN_CLI");
  } },
};
