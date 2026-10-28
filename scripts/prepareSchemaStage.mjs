// Generates a reviewable, complete schema snapshot. Never invokes the CLI or Git writes.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hash = value => createHash('sha256').update(value).digest('hex');
const [destination, baseline = 'origin/main', mode = 'final'] = process.argv.slice(2);
if (!['final','daily-compat'].includes(mode)) throw new Error('Unknown schema stage mode');
if (!destination || !path.isAbsolute(destination)) throw new Error('Provide a new absolute output directory and optional reviewed baseline Git ref');
const output = path.resolve(destination);
if (output === root || output.startsWith(`${root}${path.sep}`)) throw new Error('Output must be outside the checkout');
const baselineCommit = execFileSync('git', ['rev-parse', '--verify', `${baseline}^{commit}`], { cwd: root, encoding: 'utf8' }).trim();
const names = (await fs.readdir(path.join(root, 'base44/entities'))).filter(name => /\.jsonc?$/.test(name)).sort();
if (names.length !== 27 || !names.includes('AdminTestOperation.jsonc') || !names.includes('UserCalendarAction.jsonc') || !names.includes('UserPrivacyRequest.jsonc') || !names.includes('PrivacyRecoveryReceipt.jsonc')) throw new Error('Unexpected schema inventory; review before release');
const tracked = new Set(execFileSync('git', ['ls-files', '--', 'base44/entities'], { cwd: root, encoding: 'utf8' }).trim().split('\n'));
if (names.some(name => !tracked.has(`base44/entities/${name}`))) throw new Error('Stage reviewed new schemas in Git before generating a complete patch');
const files = await Promise.all(names.map(async name => {
  let bytes = await fs.readFile(path.join(root, 'base44/entities', name));
  if (mode === 'daily-compat' && name === 'UserDailyMessage.jsonc') {
    const schema = JSON.parse(bytes.toString());
    for (const key of ['message_tr_snapshot','suggestion_tr_snapshot','message_en_snapshot','suggestion_en_snapshot']) schema.properties[key] = {type:'string'};
    // Optional only: old writers still fit, new writes omit them, $unset removes.
    bytes = Buffer.from(JSON.stringify(schema,null,2)+'\n');
  }
  return { name, bytes, sha256: hash(bytes) };
}));
const lifecycle = JSON.parse(files.find(file => file.name === 'AdminTestOperation.jsonc').bytes.toString());
if (['read', 'create', 'update', 'delete'].some(key => lifecycle.rls[key] !== false)) throw new Error('Lifecycle direct access must stay denied');
const patch = execFileSync('git', ['diff', '--binary', baselineCommit, '--', 'base44/entities'], { cwd: root });
await fs.mkdir(output); // Refuse overwrite; never replace a reviewed artifact.
await fs.mkdir(path.join(output, 'base44/entities'), { recursive: true });
for (const file of files) await fs.writeFile(path.join(output, 'base44/entities', file.name), file.bytes);
await fs.writeFile(path.join(output, 'base44/config.jsonc'), JSON.stringify({ name: JSON.parse(await fs.readFile(path.join(root, 'base44/config.jsonc'), 'utf8')).name }, null, 2) + '\n');
await fs.writeFile(path.join(output, 'schema-stage.patch'), patch);
await fs.copyFile(path.join(root, 'scripts/base44ReleaseReadiness.ts'), path.join(output, 'readiness.ts'));
await fs.writeFile(path.join(output, 'manifest.json'), JSON.stringify({
  schema: 'shinka.schema-stage/1', baselineCommit, mode,
  patchScope: 'repository final-schema delta; manifest hashes describe the staged optional compatibility schema when mode=daily-compat',
  schemaDelta: patch.length > 0, patchSha256: hash(patch),
  files: files.map(({ name, sha256 }) => ({ name, sha256 })),
  includesFunctions: false, includesCredentials: false, executesDeployment: false,
  warning: 'entities push fully synchronizes ALL schemas. Compare full remote inventory first. Do not use deploy from this schema-only directory.',
}, null, 2) + '\n');
// Verify bytes independently after writing; no partial bundle is declared ready.
for (const file of files) if (hash(await fs.readFile(path.join(output, 'base44/entities', file.name))) !== file.sha256) throw new Error('SCHEMA_READBACK_MISMATCH');
console.log(JSON.stringify({ output, schemas: names.length, baselineCommit, schemaDelta: patch.length > 0, status: 'PREPARED_NOT_DEPLOYED' }));
