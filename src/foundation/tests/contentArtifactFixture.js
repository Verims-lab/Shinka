// Synthetic text only; never imports or replaces approved product content.
import { CONTENT_COLUMNS, MAPPING_COLUMNS, CATEGORY_COUNTS, SIGNS, MOONS, PHASES, UNKNOWN_PHASE } from '../../../base44/shared/contentArtifactValidator.ts';
export const contentRows = () => {
  let id = 0;
  return [CONTENT_COLUMNS, ...Object.entries(CATEGORY_COUNTS).flatMap(([category, count]) => Array.from({length:count}, () =>
    [`SHF-${String(++id).padStart(3,"0")}`,category,"fixture TR","fixture TR","fixture EN","fixture EN"]))];
};
export const mappingRows = (extended) => {
  const categories = Object.keys(CATEGORY_COUNTS);
  let i = 0;
  const base = SIGNS.flatMap((s) => MOONS.flatMap((m) => PHASES.map((p) => [s,m,p,categories[i++ % 6]])));
  return [MAPPING_COLUMNS, ...base, ...(extended ? SIGNS.flatMap((s)=>MOONS.map((m)=>[s,m,UNKNOWN_PHASE,categories[i++ % 6]])) : [])];
};
