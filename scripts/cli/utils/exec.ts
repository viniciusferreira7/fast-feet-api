import { spawnSync } from 'node:child_process';

export interface ExecResult {
  success: boolean;
}

export function execStream(command: string): ExecResult {
  const result = spawnSync(command, {
    shell: true,
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: '1' },
  });
  return { success: (result.status ?? 1) === 0 };
}
