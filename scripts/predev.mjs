import { rm } from 'node:fs/promises';
import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();
const targets = [
  path.join(rootDir, '.next'),
  path.join(rootDir, 'tsconfig.tsbuildinfo'),
];

async function exists(targetPath) {
  try {
    await access(targetPath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

for (const targetPath of targets) {
  if (!(await exists(targetPath))) {
    continue;
  }

  await rm(targetPath, { recursive: true, force: true });
  console.log(`[predev] removed ${path.basename(targetPath)}`);
}
