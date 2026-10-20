import { useState, useEffect, useRef } from "react";
import { FlaskConical } from "lucide-react";
import ShinkaCard from "@/components/shinka/ShinkaCard";
import ShinkaButton from "@/components/shinka/ShinkaButton";
import StatusBadge from "@/components/shinka/StatusBadge";

export default function TestsPanel() {
  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(false);
  const active = useRef(false),
    lock = useRef(false), controller = useRef(null);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false; controller.current?.abort();
    };
  }, []);
  const run = async () => {
    if (lock.current) return;
    lock.current = true;
    controller.current=new AbortController();
    setRunning(true);
    setError(false);
    try {
      const { runFoundationTests } = await import(
        "@/foundation/tests/foundationTests"
      );
      const measured = await runFoundationTests({signal:controller.current.signal});
      if (active.current) setResults(measured);
    } catch {
      if (active.current) setError(true);
    } finally {
      lock.current = false;
      if (active.current) setRunning(false);
    }
  };
  const passed = results?.filter((t) => t.passed).length;
  return (
    <ShinkaCard title="Foundation tests">
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <ShinkaButton
          variant="secondary"
          onClick={run}
          disabled={running}
          aria-label="Run foundation tests"
        >
          <FlaskConical className="h-4 w-4" />
          {running ? "Running…" : "Run tests"}
        </ShinkaButton>
        {results && (
          <span className="text-sm">
            {passed}/{results.length} passed
          </span>
        )}
      </div>
      {error && (
        <p role="alert">
          Tests could not run. Retry when the connection is available.
        </p>
      )}
      {results && (
        <ul className="space-y-1">
          {results.map((t) => (
            <li key={t.id} className="flex items-start gap-2 text-xs min-w-0">
              <StatusBadge status={t.passed ? "PASS" : "FAIL"} />
              <span className="font-mono shrink-0">{t.id}</span>
              <span className="min-w-0 break-words">
                {t.name}
                {!t.passed && ` — ${t.detail}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </ShinkaCard>
  );
}
