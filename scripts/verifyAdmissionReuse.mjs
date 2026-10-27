// Node runner for AR01–AR08 (synthetic SDK). Run: node scripts/verifyAdmissionReuse.mjs
import { build } from 'vite';
import { staticEvidencePlugin } from './staticEvidence.mjs';
import { writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
const root = process.cwd(), temp = await mkdtemp(path.join(tmpdir(), 'shinka-admission-'));
try {
  await writeFile(temp + '/entry.js', `import { ADMISSION_REUSE_TESTS } from ${JSON.stringify(path.join(root, 'scripts/testHarness/admissionReuseTests.js'))};
const results=[];for(const [id,name,fn] of ADMISSION_REUSE_TESTS){try{await fn();results.push([id,'PASS',name]);}catch(e){results.push([id,'FAIL',e.message]);}}
console.log(JSON.stringify(results,null,1));if(results.some(r=>r[1]!=='PASS'))process.exitCode=1;\n`);
  await build({ configFile: false, plugins: [staticEvidencePlugin(root)], logLevel: 'silent', resolve: { alias: { '@': root + '/src' } }, ssr: { noExternal: true }, build: { ssr: temp + '/entry.js', outDir: temp + '/out', rollupOptions: { output: { entryFileNames: 'entry.mjs' } } } });
  process.stdout.write(execFileSync(process.execPath, [temp + '/out/entry.mjs']));
} catch (e) { process.stdout.write(String(e.stdout || e.message)); process.exitCode = 1; }
finally { await rm(temp, { recursive: true, force: true }); }