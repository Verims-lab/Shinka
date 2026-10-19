// Local repository metadata writer only; no backend, deployment or Git operations.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BUILD_MARKER } from "../src/foundation/buildMarker.js";
import { BUILD_LEDGER } from "../src/foundation/buildLedger.js";
import {
  retainBuildPackages,
  renderBuildHistory,
} from "../src/foundation/buildHistoryPolicy.js";
import {
  validateLedger,
  validateTransition,
} from "../src/foundation/buildMarkerRules.js";
import { REQUIRED_DOCS } from "../src/foundation/inspection/docRules.js";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const input = process.argv[2];
if (!input)
  throw new Error("Usage: node scripts/recordBuild.mjs package.json | --check");
const entry =
  input === "--check"
    ? null
    : JSON.parse(fs.readFileSync(path.resolve(input), "utf8"));
const current = entry?.build_marker || BUILD_MARKER;
if (current !== BUILD_MARKER && !validateTransition(BUILD_MARKER, current).ok)
  throw new Error("BUILD_MARKER_TRANSITION_INVALID");
if (entry) {
  for (const key of [
    "package_name",
    "package_type",
    "created_at",
    "health_catalog_version",
    "short_summary",
    "full_health_status",
    "notes",
  ]) {
    if (typeof entry[key] !== "string" || !entry[key].trim())
      throw new Error(`BUILD_ENTRY_REQUIRED:${key}`);
  }
  if (entry.short_summary.length > 600 || entry.notes.length > 1600)
    throw new Error("BUILD_ENTRY_SUMMARY_TOO_LONG");
}
const active = entry
  ? retainBuildPackages([...BUILD_LEDGER, entry], current)
  : BUILD_LEDGER;
if (!validateLedger(active, current).ok)
  throw new Error("BUILD_LEDGER_INVALID");
const history = renderBuildHistory(active, current);
const historyPath = path.join(root, "docs/shinka/SHINKA_BUILD_HISTORY.md");
if (input === "--check") {
  if (fs.readFileSync(historyPath, "utf8") !== history)
    throw new Error("BUILD_HISTORY_NOT_GENERATED");
  console.log(`Active history verified: ${active.length} packages`);
} else {
  fs.writeFileSync(
    path.join(root, "src/foundation/buildLedgerData.js"),
    "// Generated active package data; update with scripts/recordBuild.mjs. Older entries remain in Git.\nexport default " +
      JSON.stringify(active, null, 2) +
      ";\n",
  );
  const markerPath = path.join(root, "src/foundation/buildMarker.js");
  fs.writeFileSync(
    markerPath,
    fs.readFileSync(markerPath, "utf8").replace(BUILD_MARKER, current),
  );
  for (const name of REQUIRED_DOCS) {
    const file = path.join(root, "docs/shinka", name);
    fs.writeFileSync(
      file,
      fs
        .readFileSync(file, "utf8")
        .replace(
          /\*\*Current BuildMarker:\*\* Buildmarker-\d{3}/,
          `**Current BuildMarker:** ${current}`,
        ),
    );
  }
  fs.writeFileSync(historyPath, history);
  console.log(`Recorded ${current}; retained ${active.length} unique packages`);
}
