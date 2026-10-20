// Saving and refreshing history are separate outcomes. A list failure cannot undo a verified save.
export async function persistCompletedRun(report, save, refresh) {
  try { await save(report); }
  catch (error) {
    const code=error?.code || 'HEALTH_HISTORY_PERSIST_FAILED';
    const unknown=['HEALTH_SAVE_RESPONSE_UNKNOWN','HEALTH_HISTORY_PERSIST_FAILED','HEALTH_HISTORY_CREATE_FAILED','HEALTH_HISTORY_LOOKUP_FAILED','HEALTH_HISTORY_READBACK_FAILED'].includes(code);
    return {report,saveState:unknown?'UNKNOWN':'FAILED',saveError:code,detail:error?.detail||null};
  }
  // Refresh has its own loading/error UI; it must not delay the confirmed save state.
  void Promise.resolve().then(refresh).catch(()=>undefined);
  return {report,saveState:'SAVED',saveError:null};
}
