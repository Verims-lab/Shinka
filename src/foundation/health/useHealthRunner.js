import { useState, useCallback, useEffect, useRef } from "react";
import { runHealth } from "./runner";
import {
  saveHealthRun,
  listHealthRuns,
} from "@/services/internal/healthRunStore";
import { classifyError } from "@/foundation/errors";
import { persistCompletedRun } from "./completion";

const DEFAULT_OPERATIONS = {
  run: runHealth,
  save: saveHealthRun,
  list: listHealthRuns,
};
export function useHealthRunner(operations = DEFAULT_OPERATIONS) {
  const [report, setReport] = useState(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState([0, 0]);
  const [saveError, setSaveError] = useState(null);
  const [history, setHistory] = useState({
    state: "LOADING",
    items: [],
    code: null,
  });
  const mounted = useRef(false),
    lock = useRef(false),
    historyTicket = useRef(0);
  const loadHistory = useCallback(async () => {
    if (!mounted.current) return;
    const ticket = ++historyTicket.current;
    setHistory((h) => ({ ...h, state: "LOADING" }));
    try {
      const items = await operations.list();
      if (mounted.current && ticket === historyTicket.current)
        setHistory({
          state: items.length ? "SUCCESS" : "EMPTY",
          items,
          code: null,
        });
    } catch (error) {
      if (mounted.current && ticket === historyTicket.current)
        setHistory({ state: "ERROR", items: [], code: classifyError(error) });
    }
  }, [operations]);
  useEffect(() => {
    mounted.current = true;
    void loadHistory();
    return () => {
      mounted.current = false;
      historyTicket.current++;
    };
  }, [loadHistory]);
  const run = useCallback(
    async (suiteId = null) => {
      if (lock.current || !mounted.current) return;
      lock.current = true;
      setRunning(true);
      setSaveError(null);
      try {
        const completed = await operations.run({
          suiteId,
          onProgress: (done, total) => {
            if (mounted.current) setProgress([done, total]);
          },
        });
        if (mounted.current) setReport(completed);
        // A user-started run may finish after navigation. Preserve its audit record,
        // but never update a disposed screen or start another history request there.
        const outcome = await persistCompletedRun(
          completed,
          operations.save,
          loadHistory,
        );
        if (mounted.current) setSaveError(outcome.saveError);
      } catch (error) {
        if (mounted.current) setSaveError(classifyError(error));
      } finally {
        lock.current = false;
        if (mounted.current) setRunning(false);
      }
    },
    [loadHistory, operations],
  );
  return { report, running, progress, saveError, history, run, loadHistory };
}
