import assert from 'node:assert/strict';
import { inspectDependencies } from './dependencyEvidence.mjs';

export function verifyDependencyRules() {
  const app = '/src/App.jsx', internal = '/src/pages/internal/Health.jsx';
  const fixture = { [app]: "export const page=()=>import('./pages/internal/Health.jsx');", [internal]: 'export default 1;' };
  assert.equal(inspectDependencies(fixture).ok, true);
  assert.equal(inspectDependencies({ ...fixture, [app]: "import page from './pages/internal/Health.jsx';" }).eagerInternal.length, 1);
  assert.equal(inspectDependencies({ ...fixture, '/base44/shared/a.js': "import page from '../../src/App.jsx';" }).violations.length, 1);
  assert.equal(inspectDependencies({ ...fixture, "/base44/shared/a.js": "export const bad=()=>import('../../src/App.jsx');" }).violations.length, 1);
  assert.equal(inspectDependencies({ [app]: "import './loop.js';", '/src/loop.js': "import './App.jsx';" }).cycles.length, 1);
}
