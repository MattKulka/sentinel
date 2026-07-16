import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5182,
    strictPort: true,
  },
  preview: {
    port: 5182,
    strictPort: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // Unit/integration tests live in src/. Playwright owns everything in e2e/.
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/lib/**', 'src/state/**', 'src/hooks/**', 'src/api/**'],
      exclude: ['**/*.test.{ts,tsx}', 'src/**/types.ts'],
      thresholds: {
        // The business logic is the star: gate it hard.
        'src/lib/**': {
          statements: 90,
          branches: 90,
          functions: 90,
          lines: 90,
        },
        'src/state/**': {
          statements: 90,
          branches: 90,
          functions: 90,
          lines: 90,
        },
      },
    },
  },
});
