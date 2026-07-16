import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ShiftDialog } from './ShiftDialog';
import { renderWithUser } from '../test/utils';
import type { Employee } from '../lib/types';

const employees: Employee[] = [
  { id: 'e1', name: 'Ada Lovelace', color: '#6366f1' },
  { id: 'e2', name: 'Grace Hopper', color: '#10b981' },
];

const baseProps = {
  employees,
  onSubmit: vi.fn(),
  onClose: vi.fn(),
};

describe('ShiftDialog', () => {
  it('renders as an accessible modal dialog with a title', () => {
    renderWithUser(
      <ShiftDialog
        {...baseProps}
        mode="create"
        initial={{
          day: '2026-07-15',
          startMinutes: 540,
          endMinutes: 720,
          title: '',
          employeeId: null,
        }}
      />,
    );
    const dialog = screen.getByRole('dialog', { name: /new shift/i });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('submits parsed values from the form', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithUser(
      <ShiftDialog
        {...baseProps}
        onSubmit={onSubmit}
        mode="create"
        initial={{
          day: '2026-07-15',
          startMinutes: 540,
          endMinutes: 720,
          title: '',
          employeeId: null,
        }}
      />,
    );

    await user.type(screen.getByLabelText(/title/i), 'Prep');
    await user.selectOptions(
      screen.getByLabelText(/assign to/i),
      'Grace Hopper',
    );
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Prep',
      day: '2026-07-15',
      startMinutes: 540,
      endMinutes: 720,
      employeeId: 'e2',
    });
  });

  it('blocks submission and shows an error when end is not after start', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithUser(
      <ShiftDialog
        {...baseProps}
        onSubmit={onSubmit}
        mode="create"
        initial={{
          day: '2026-07-15',
          startMinutes: 540,
          endMinutes: 720,
          title: 'X',
          employeeId: null,
        }}
      />,
    );

    // Set end (11:00) earlier than start (9:00 default) → set end to 08:00.
    const end = screen.getByLabelText(/^end$/i);
    await user.clear(end);
    await user.type(end, '08:00');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/end.*after.*start/i);
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    const { user } = renderWithUser(
      <ShiftDialog
        {...baseProps}
        onClose={onClose}
        mode="create"
        initial={{
          day: '2026-07-15',
          startMinutes: 540,
          endMinutes: 720,
          title: '',
          employeeId: null,
        }}
      />,
    );
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('offers delete in edit mode', async () => {
    const onDelete = vi.fn();
    const { user } = renderWithUser(
      <ShiftDialog
        {...baseProps}
        mode="edit"
        onDelete={onDelete}
        initial={{
          day: '2026-07-15',
          startMinutes: 540,
          endMinutes: 720,
          title: 'Opening',
          employeeId: 'e1',
        }}
      />,
    );
    expect(
      screen.getByRole('dialog', { name: /edit shift/i }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('Opening')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalled();
  });
});
