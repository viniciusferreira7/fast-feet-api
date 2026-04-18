import swc from 'unplugin-swc';
import tsConfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.int-spec.ts'],
    globals: true,
    root: './',
    setupFiles: ['./test/setup-for-infra-tests.ts'],
    testTimeout: 100_000, // 100 seconds
    hookTimeout: 100_000, // 100 seconds
  },
  plugins: [
    tsConfigPaths(),
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
});
