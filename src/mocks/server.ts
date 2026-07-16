import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// The MSW server used across the Vitest suite (Node environment).
export const server = setupServer(...handlers);
