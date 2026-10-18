import { redact } from "./report";

export const reportJson = (report) => JSON.stringify(redact(report), null, 2);

export async function copyReport(report) {
  await navigator.clipboard.writeText(reportJson(report));
}

export function downloadReport(report) {
  const blob = new Blob([reportJson(report)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `shinka-health-${report.buildMarker}-${report.scope.replace(":", "-")}-${report.startedAt}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Pending view of the catalog before any run.
export const pendingCase = (c) => ({ ...c, status: "NOT_RUN", attempted: false, executed: false, durationMs: 0, evidence: null });