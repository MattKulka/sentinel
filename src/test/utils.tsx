import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';

/**
 * Render a component and return the RTL result plus a pre-bound `userEvent`
 * instance. Kept deliberately thin — there are no global providers yet, so this
 * mainly exists to give tests a single, consistent entry point to grow into.
 */
export function renderWithUser(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'queries'>,
) {
  return {
    user: userEvent.setup(),
    ...render(ui, options),
  };
}
