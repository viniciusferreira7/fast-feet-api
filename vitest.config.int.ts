import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.int-spec.ts'],
    globals: true,
    root: './',
    setupFiles: ['./test/setup-for-infra-tests.ts', './test/seed-admin.ts'],
    fileParallelism: false,
    testTimeout: 100_000,
    hookTimeout: 100_000,
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
