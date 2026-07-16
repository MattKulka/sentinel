import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { useScheduler } from './useScheduler';
import { server } from '../mocks/server';
import { resetDb } from '../mocks/db';

describe('useScheduler', () => {
  it('starts loading, then becomes ready with the seeded data', async () => {
    const { result } = renderHook(() => useScheduler());

    expect(result.current.state.status).toBe('loading');

    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    expect(result.current.state.employees.length).toBeGreaterThan(0);
    expect(result.current.state.shifts.length).toBeGreaterThan(0);
  });

  it('surfaces an error status when the API fails', async () => {
    server.use(
      http.get('/api/shifts', () => new HttpResponse(null, { status: 500 })),
    );
    const { result } = renderHook(() => useScheduler());

    await waitFor(() => expect(result.current.state.status).toBe('error'));
    expect(result.current.state.error).toBeTruthy();
  });

  it('derives the set of conflicting shift ids from the loaded data', async () => {
    const { result } = renderHook(() => useScheduler());
    await waitFor(() => expect(result.current.state.status).toBe('ready'));

    // The seed double-books Ada on Wednesday (s4 & s5).
    expect(result.current.conflicts.has('s4')).toBe(true);
    expect(result.current.conflicts.has('s5')).toBe(true);
  });

  it('addShift posts to the API and appends the created shift', async () => {
    const { result } = renderHook(() => useScheduler());
    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    const before = result.current.state.shifts.length;

    await act(async () => {
      await result.current.addShift({
        employeeId: 'e2',
        day: result.current.state.anchor,
        startMinutes: 600,
        endMinutes: 660,
        title: 'Extra',
      });
    });

    expect(result.current.state.shifts).toHaveLength(before + 1);
    expect(
      result.current.state.shifts.some((s) => s.title === 'Extra'),
    ).toBe(true);
  });

  it('assignShift updates the employee on a shift', async () => {
    resetDb({
      shifts: [
        {
          id: 'x1',
          employeeId: null,
          day: '2026-07-13',
          startMinutes: 540,
          endMinutes: 600,
          title: 'Open',
        },
      ],
    });
    const { result } = renderHook(() => useScheduler());
    await waitFor(() => expect(result.current.state.status).toBe('ready'));

    await act(async () => {
      await result.current.assignShift('x1', 'e1');
    });

    expect(result.current.state.shifts[0]?.employeeId).toBe('e1');
  });

  it('removeShift deletes a shift', async () => {
    resetDb({
      shifts: [
        {
          id: 'x1',
          employeeId: 'e1',
          day: '2026-07-13',
          startMinutes: 540,
          endMinutes: 600,
          title: 'Open',
        },
      ],
    });
    const { result } = renderHook(() => useScheduler());
    await waitFor(() => expect(result.current.state.status).toBe('ready'));

    await act(async () => {
      await result.current.removeShift('x1');
    });

    expect(result.current.state.shifts).toHaveLength(0);
  });

  it('moveWeek shifts the anchor by whole weeks without refetching', async () => {
    const { result } = renderHook(() => useScheduler());
    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    const start = result.current.state.anchor;

    act(() => result.current.moveWeek(1));
    // 7 days later.
    expect(result.current.state.anchor).not.toBe(start);
  });
});
