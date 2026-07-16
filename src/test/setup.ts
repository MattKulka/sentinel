import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from '../mocks/server';
import { resetDb } from '../mocks/db';

// Start the MSW mock API before any test runs. `error` on unhandled requests
// keeps the test suite honest — an un-mocked call is a bug, not a silent pass.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetDb(); // restore the seed data so each test starts from a known state
});

afterAll(() => server.close());
