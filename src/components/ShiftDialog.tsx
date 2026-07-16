import { useEffect, useId, useRef, useState } from 'react';
import { minutesToInputValue, parseTimeInput } from '../lib/time';
import type { Employee } from '../lib/types';
import styles from './ShiftDialog.module.css';

export interface ShiftValues {
  title: string;
  day: string;
  startMinutes: number;
  endMinutes: number;
  employeeId: string | null;
}

interface ShiftDialogProps {
  mode: 'create' | 'edit';
  initial: ShiftValues;
  employees: Employee[];
  onSubmit: (values: ShiftValues) => void;
  onClose: () => void;
  onDelete?: () => void;
}

export function ShiftDialog({
  mode,
  initial,
  employees,
  onSubmit,
  onClose,
  onDelete,
}: ShiftDialogProps) {
  const titleId = useId();
  const errorId = useId();
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initial.title);
  const [day, setDay] = useState(initial.day);
  const [start, setStart] = useState(minutesToInputValue(initial.startMinutes));
  const [end, setEnd] = useState(minutesToInputValue(initial.endMinutes));
  const [employeeId, setEmployeeId] = useState<string>(
    initial.employeeId ?? '',
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const startMinutes = parseTimeInput(start);
    const endMinutes = parseTimeInput(end);
    if (endMinutes <= startMinutes) {
      setError('End time must be after the start time.');
      return;
    }
    onSubmit({
      title: title.trim(),
      day,
      startMinutes,
      endMinutes,
      employeeId: employeeId === '' ? null : employeeId,
    });
  }

  return (
    <div
      className={styles.backdrop}
      onMouseDown={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className={styles.heading}>
          {mode === 'create' ? 'New shift' : 'Edit shift'}
        </h2>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <label className={styles.field}>
            <span>Title</span>
            <input
              ref={firstFieldRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>

          <label className={styles.field}>
            <span>Day</span>
            <input
              type="date"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              required
            />
          </label>

          <div className={styles.row}>
            <label className={styles.field}>
              <span>Start</span>
              <input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
              />
            </label>
            <label className={styles.field}>
              <span>End</span>
              <input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
              />
            </label>
          </div>

          <label className={styles.field}>
            <span>Assign to</span>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </label>

          {error && (
            <p id={errorId} className={styles.error} role="alert">
              {error}
            </p>
          )}

          <div className={styles.actions}>
            {mode === 'edit' && onDelete && (
              <button
                type="button"
                className={styles.delete}
                onClick={onDelete}
              >
                Delete
              </button>
            )}
            <span className={styles.spacer} />
            <button type="button" className={styles.cancel} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.save}>
              Save shift
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
