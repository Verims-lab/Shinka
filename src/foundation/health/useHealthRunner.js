import { useState, useCallback, useEffect } from "react";
import { runHealth } from "./runner";
import { saveHealthRun, listHealthRuns } from "@/services/internal/healthRunStore";
import { classifyError } from "@/foundation/errors";

// Health Center state hook — orchestrates runs; no Health logic lives in JSX.
export function useHealthRunner() {
  const [report, setReport] = useState(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState([0, 0]);
  const [saveError, setSaveError] = useState(null);
  const [history, setHistory] = useState({ state: "LOADING", items: [] });

  const loadHistory = useCallback(async () => {
    setHistory((h) => ({ ...h, state: "LOADING" }));
    try {
      const items = await listHealthRuns(20);
      setHistory({ state: items.length ? "SUCCESS" : "EMPTY", items });
    } catch (e) {
      setHistory({ state: "ERROR", items: [], code: classifyError(e) });
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const run = useCallback(async (suiteId = null) => {
    setRunning(true);
    setSaveError(null);
    const rep = await runHealth({ suiteId, onProgress: (d, t) => setProgress([d, t]) });
    setReport(rep);
    setRunning(false);
    try { await saveHealthRun(rep); await loadHistory(); } catch (e) { setSaveError(classifyError(e)); }
  }, [loadHistory]);

  return { report, running, progress, saveError, history, run, loadHistory };
}