// Plan morning-digest § 3: save one rig page as a single HTML file, the way the server renders it
// (ADR 0001: self-contained, no client JS). Usage: tsx scripts/save-page.ts <path> <out-file>
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { createApp } from '../src/app.js';

const [path, out] = process.argv.slice(2);
if (!path || !out) {
  console.error('usage: save-page <path> <out-file>');
  process.exit(2);
}
const res = await createApp().request(path);
if (res.status !== 200) {
  console.error(`${path} answered ${res.status}`);
  process.exit(1);
}
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, await res.text());
console.log(`saved ${path} → ${out}`);
