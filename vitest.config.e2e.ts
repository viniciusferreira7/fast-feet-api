import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.e2e-spec.ts'],
    globals: true,
    root: './',
    setupFiles: ['./test/setup-for-infra-tests.ts', './test/seed-admin.ts'],
    fileParallelism: false,
    testTimeout: 1_000_000, // 1_000 seconds
    hookTimeout: 1_000_000, // 1_000 seconds
  },
  resolve: {
    tsconfigPaths: true,
  },
  oxc: false,
  plugins: [
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
});
