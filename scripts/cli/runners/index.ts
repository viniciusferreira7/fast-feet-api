import { type ExecResult, execStream } from '../utils/exec.js'

export type FlowValue = 'lint' | 'type-check' | 'unit' | 'int' | 'e2e'

export interface FlowConfig {
  value: FlowValue
  files?: string[]
  watch?: boolean
}

export interface RunnerDef {
  value: FlowValue
  label: string
  hint: string
  isTestRunner: boolean
  run(config: FlowConfig): ExecResult
}

const vitest = './node_modules/.bin/vitest'

export const runners: RunnerDef[] = [
  {
    value: 'lint',
    label: 'Lint',
    hint: 'biome lint',
    isTestRunner: false,
    run: () => execStream('pnpm run lint'),
  },
  {
    value: 'type-check',
    label: 'Type Check',
    hint: 'tsc --noEmit',
    isTestRunner: false,
    run: () => execStream('pnpm run check:type'),
  },
  {
    value: 'unit',
    label: 'Unit Tests',
    hint: 'vitest run',
    isTestRunner: true,
    run: ({ files, watch }) =>
      watch
        ? execStream(files?.length ? `${vitest} ${files.join(' ')}` : vitest)
        : files?.length
          ? execStream(`${vitest} run ${files.join(' ')}`)
          : execStream('pnpm run test:unit'),
  },
  {
    value: 'int',
    label: 'Integration Tests',
    hint: 'vitest run --config vitest.config.int.ts',
    isTestRunner: true,
    run: ({ files, watch }) =>
      watch
        ? execStream(
            `${vitest} --config ./vitest.config.int.ts${files?.length ? ` ${files.join(' ')}` : ''}`,
          )
        : files?.length
          ? execStream(`${vitest} run --config ./vitest.config.int.ts ${files.join(' ')}`)
          : execStream('pnpm run test:int'),
  },
  {
    value: 'e2e',
    label: 'E2E Tests',
    hint: 'vitest run --config vitest.config.e2e.ts',
    isTestRunner: true,
    run: ({ files, watch }) =>
      watch
        ? execStream(
            `${vitest} --config ./vitest.config.e2e.ts${files?.length ? ` ${files.join(' ')}` : ''}`,
          )
        : files?.length
          ? execStream(`${vitest} run --config ./vitest.config.e2e.ts ${files.join(' ')}`)
          : execStream('pnpm run test:e2e'),
  },
]

export function getRunner(value: FlowValue): RunnerDef {
  // biome-ignore lint/style/noNonNullAssertion: value is always a known FlowValue
  return runners.find((r) => r.value === value)!
}
