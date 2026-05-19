import { execSync } from 'node:child_process';

export interface ExecResult {
  success: boolean;
  output: string;
}

export function exec(command: string): ExecResult {
  try {
    const stdout = execSync(command, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: '1' },
    });
    return { success: true, output: stdout };
  } catch (error: unknown) {
    const err = error as { stdout?: string; stderr?: string; message: string };
    return {
      success: false,
      output:
        [err.stdout, err.stderr].filter(Boolean).join('\n') || err.message,
    };
  }
}
