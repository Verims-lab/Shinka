// Active history only. The canonical current marker remains buildMarker.js.
import entries from './buildLedgerData.js';
export const BUILD_LEDGER = Object.freeze(entries.map(entry => Object.freeze(entry)));
export const currentLedgerEntry = () => BUILD_LEDGER.at(-1);
