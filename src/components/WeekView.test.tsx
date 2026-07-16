import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WeekView } from './WeekView';
import { renderWithUser } from '../test/utils';
import { weekDays } from '../lib/date';
import type { Employee, Shift } from '../lib/types';

const employees: Employee[] = [
  { id: 'e1', name: 'Ada Lovelace', color: '#6366f1' },
  { id: 'e2', name: 'Grace Hopper', color: '#10b981' },
];

const days = weekDays('2026-07-13');

function shift(over: Partial<Shift>): Shift {
  return {
    id: 'a',
    employeeId: 'e1',
    day: '2026-07-13',
    startMinutes: 540,
    endMinutes: 720,
    title: 'Opening',
    ...over,
  };
}

function noop() {}

describe('WeekView', () => {
  it('renders a column for each of the seven days', () => {
    renderWithUser(
      <WeekView
        days={days}
        shifts={[]}
        employees={employees}
        conflicts={new Set()}
        onNewShift={noop}
        onEditShift={noop}
      />,
    );
    for (const label of ['Mon 13', 'Tue 14', 'Wed 15', 'Sun 19']) {
      expect(screen.getByRole('heading', { name: label })).toBeInTheDocument();
    }
  });

  it('places a shift under its day with time and employee', () => {
    renderWithUser(
      <WeekView
        days={days}
        shifts={[shift({ id: 'a', day: '2026-07-14', title: 'Midday' })]}
        employees={employees}
        conflicts={new Set()}
        onNewShift={noop}
        onEditShift={noop}
      />,
    );
    const card = screen.getByRole('button', { name: /Midday/ });
    expect(card).toHaveTextContent('9:00 AM');
    expect(card).toHaveTextContent('12:00 PM');
    expect(card).toHaveTextContent('Ada Lovelace');
  });

  it('marks conflicting shifts with an accessible conflict indicator', () => {
    renderWithUser(
      <WeekView
        days={days}
        shifts={[
          shift({ id: 'a', startMinutes: 540, endMinutes: 720 }),
          shift({ id: 'b', startMinutes: 660, endMinutes: 780 }),
        ]}
        employees={employees}
        conflicts={new Set(['a', 'b'])}
        onNewShift={noop}
        onEditShift={noop}
      />,
    );
    expect(screen.getAllByLabelText(/scheduling conflict/i)).toHaveLength(2);
  });

  it('labels an unassigned shift as such', () => {
    renderWithUser(
      <WeekView
        days={days}
        shifts={[shift({ id: 'a', employeeId: null, title: 'Open shift' })]}
        employees={employees}
        conflicts={new Set()}
        onNewShift={noop}
        onEditShift={noop}
      />,
    );
    expect(
      screen.getByRole('button', { name: /Open shift/ }),
    ).toHaveTextContent(/unassigned/i);
  });

  it('shows an empty-week message when there are no shifts', () => {
    renderWithUser(
      <WeekView
        days={days}
        shifts={[]}
        employees={employees}
        conflicts={new Set()}
        onNewShift={noop}
        onEditShift={noop}
      />,
    );
    expect(screen.getByText(/no shifts scheduled this week/i)).toBeInTheDocument();
  });

  it('invokes onNewShift with the column day when adding', async () => {
    const onNewShift = vi.fn();
    const { user } = renderWithUser(
      <WeekView
        days={days}
        shifts={[]}
        employees={employees}
        conflicts={new Set()}
        onNewShift={onNewShift}
        onEditShift={noop}
      />,
    );
    const monColumn = screen.getByRole('region', { name: 'Mon 13' });
    await user.click(
      within(monColumn).getByRole('button', { name: /add shift/i }),
    );
    expect(onNewShift).toHaveBeenCalledWith('2026-07-13');
  });

  it('invokes onEditShift when a card is clicked', async () => {
    const onEditShift = vi.fn();
    const { user } = renderWithUser(
      <WeekView
        days={days}
        shifts={[shift({ id: 'a', title: 'Opening' })]}
        employees={employees}
        conflicts={new Set()}
        onNewShift={noop}
        onEditShift={onEditShift}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Opening/ }));
    expect(onEditShift).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'a' }),
    );
  });
});
