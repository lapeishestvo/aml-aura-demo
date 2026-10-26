import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
execFileSync('npm', ['run', 'build', '--', '--base-href', '/aml-aura-demo/'], { cwd: root, stdio: 'inherit' });
const destination = resolve(root, 'docs');
mkdirSync(destination, { recursive: true });
for (const name of readdirSync(destination)) {
  if (name !== 'design.md') rmSync(resolve(destination, name), { recursive: true, force: true });
}
cpSync(resolve(root, 'dist/aml/browser'), destination, { recursive: true });
writeFileSync(resolve(destination, '.nojekyll'), '');
