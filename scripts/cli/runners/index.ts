import { type ExecResult, exec } from '../utils/exec.js';

export type FlowValue = 'lint' | 'type-check' | 'unit' | 'int' | 'e2e';

export interface FlowConfig {
  value: FlowValue;
  files?: string[];
}

export interface RunnerDef {
  value: FlowValue;
  label: string;
  hint: string;
  isTestRunner: boolean;
  run(config: FlowConfig): ExecResult;
}

const vitest = './node_modules/.bin/vitest';

export const runners: RunnerDef[] = [
  {
    value: 'lint',
    label: 'Lint',
    hint: 'biome lint',
    isTestRunner: false,
    run: () => exec('pnpm run lint'),
  },
  {
    value: 'type-check',
    label: 'Type Check',
    hint: 'tsc --noEmit',
    isTestRunner: false,
    run: () => exec('pnpm run check:type'),
  },
  {
    value: 'unit',
    label: 'Unit Tests',
    hint: 'vitest run',
    isTestRunner: true,
    run: ({ files }) =>
      files?.length
        ? exec(`${vitest} run ${files.join(' ')}`)
        : exec('pnpm run test:unit'),
  },
  {
    value: 'int',
    label: 'Integration Tests',
    hint: 'vitest run --config vitest.config.int.ts',
    isTestRunner: true,
    run: ({ files }) =>
      files?.length
        ? exec(
            `${vitest} run --config ./vitest.config.int.ts ${files.join(' ')}`
          )
        : exec('pnpm run test:int'),
  },
  {
    value: 'e2e',
    label: 'E2E Tests',
    hint: 'vitest run --config vitest.config.e2e.ts',
    isTestRunner: true,
    run: ({ files }) =>
      files?.length
        ? exec(
            `${vitest} run --config ./vitest.config.e2e.ts ${files.join(' ')}`
          )
        : exec('pnpm run test:e2e'),
  },
];

export function getRunner(value: FlowValue): RunnerDef {
  return runners.find((r) => r.value === value)!;
}
