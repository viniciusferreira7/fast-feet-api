import { execSync } from 'node:child_process';
import path from 'node:path';

export interface TestFile {
  value: string;
  label: string;
  hint: string;
}

const root = process.cwd();

function findByPattern(cmd: string): string[] {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] })
      .trim()
      .split('\n')
      .filter(Boolean)
      .sort();
  } catch {
    return [];
  }
}

export function findTestFiles(type: 'unit' | 'int' | 'e2e'): TestFile[] {
  let files: string[];

  if (type === 'unit') {
    const all = findByPattern(`find ${root}/src -name "*.spec.ts"`);
    files = all.filter(
      (f) => !f.endsWith('.int-spec.ts') && !f.endsWith('.e2e-spec.ts')
    );
  } else if (type === 'int') {
    files = findByPattern(
      `find ${root} -name "*.int-spec.ts" -not -path "*/node_modules/*"`
    );
  } else {
    files = findByPattern(
      `find ${root} -name "*.e2e-spec.ts" -not -path "*/node_modules/*"`
    );
  }

  return files.map((absolute) => {
    const relative = path.relative(root, absolute);
    return {
      value: relative,
      label: path.basename(relative),
      hint: relative,
    };
  });
}
