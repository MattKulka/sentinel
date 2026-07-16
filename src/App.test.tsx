import {
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import App from './App';
import { renderWithUser } from './test/utils';
import { server } from './mocks/server';
import { resetDb } from './mocks/db';

describe('App', () => {
  it('shows a loading state, then the seeded schedule', async () => {
    renderWithUser(<App />);

    expect(screen.getByRole('status')).toHaveTextContent(/loading/i);

    await waitForElementToBeRemoved(() =>
      screen.queryByText(/loading the schedule/i),
    );
    // A seeded shift is visible.
    expect(
      await screen.findByRole('button', { name: /Lead cover/ }),
    ).toBeInTheDocument();
  });

  it('summarises the conflict count from the seed data', async () => {
    renderWithUser(<App />);
    // The seed double-books Ada on Wednesday → at least one conflict.
    expect(await screen.findByText(/\d+ conflict/i)).toBeInTheDocument();
  });

  it('shows the empty-week message when there are no shifts', async () => {
    resetDb({ shifts: [] });
    renderWithUser(<App />);

    expect(
      await screen.findByText(/no shifts scheduled this week/i),
    ).toBeInTheDocument();
  });

  it('flags a conflict on both cards after creating an overlapping shift', async () => {
    resetDb({ shifts: [] });
    const { user } = renderWithUser(<App />);
    await screen.findByText(/no shifts scheduled this week/i);

    // Create the first shift for Ada, this week.
    await user.click(screen.getByRole('button', { name: /new shift/i }));
    await user.type(screen.getByLabelText(/title/i), 'Alpha');
    await user.selectOptions(
      screen.getByLabelText(/assign to/i),
      'Ada Lovelace',
    );
    await user.click(screen.getByRole('button', { name: /save shift/i }));

    expect(
      await screen.findByRole('button', { name: /Alpha/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/scheduling conflict/i),
    ).not.toBeInTheDocument();

    // Create a second, overlapping shift for the same person on the same day.
    await user.click(screen.getByRole('button', { name: /new shift/i }));
    await user.type(screen.getByLabelText(/title/i), 'Beta');
    await user.selectOptions(
      screen.getByLabelText(/assign to/i),
      'Ada Lovelace',
    );
    await user.click(screen.getByRole('button', { name: /save shift/i }));

    // Both shifts are now double-booked.
    const badges = await screen.findAllByLabelText(/scheduling conflict/i);
    expect(badges).toHaveLength(2);
  });

  it('shows an error state with a working retry', async () => {
    server.use(
      http.get('/api/employees', () => new HttpResponse(null, { status: 500 })),
    );
    const { user } = renderWithUser(<App />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/couldn.t load the schedule/i);

    // Recover: default handlers are restored automatically per-test, but the
    // one-off override is still active until reset — remove it explicitly.
    server.resetHandlers();
    await user.click(screen.getByRole('button', { name: /try again/i }));

    await waitFor(() =>
      expect(screen.queryByRole('alert')).not.toBeInTheDocument(),
    );
    expect(
      await screen.findByRole('button', { name: /Lead cover/ }),
    ).toBeInTheDocument();
  });
});
