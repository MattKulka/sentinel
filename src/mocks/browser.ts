import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// The MSW worker used in the browser (dev + Playwright E2E build).
export const worker = setupWorker(...handlers);
