import { useId } from 'react';
import { shortDayLabel, weekdayName } from '../lib/date';
import type { Employee, Shift } from '../lib/types';
import { ShiftCard } from './ShiftCard';
import styles from './WeekView.module.css';

interface WeekViewProps {
  days: string[];
  shifts: Shift[];
  employees: Employee[];
  conflicts: Set<string>;
  onNewShift: (day: string) => void;
  onEditShift: (shift: Shift) => void;
}

export function WeekView({
  days,
  shifts,
  employees,
  conflicts,
  onNewShift,
  onEditShift,
}: WeekViewProps) {
  const headingBase = useId();
  const byId = new Map(employees.map((e) => [e.id, e]));
  const byDay = new Map<string, Shift[]>();
  for (const shift of shifts) {
    const list = byDay.get(shift.day) ?? [];
    list.push(shift);
    byDay.set(shift.day, list);
  }
  for (const list of byDay.values()) {
    list.sort((a, b) => a.startMinutes - b.startMinutes);
  }

  return (
    <div>
      {shifts.length === 0 && (
        <p className={styles.empty} role="note">
          No shifts scheduled this week. Use “Add shift” under any day to get
          started.
        </p>
      )}
      <div className={styles.grid}>
        {days.map((day, i) => {
          const headingId = `${headingBase}-${i}`;
          const dayShifts = byDay.get(day) ?? [];
          return (
            <section
              key={day}
              className={styles.column}
              aria-labelledby={headingId}
            >
              <h3 id={headingId} className={styles.dayHeading}>
                {shortDayLabel(day)}
              </h3>
              <div className={styles.cards}>
                {dayShifts.map((shift) => (
                  <ShiftCard
                    key={shift.id}
                    shift={shift}
                    employee={
                      shift.employeeId
                        ? byId.get(shift.employeeId)
                        : undefined
                    }
                    isConflicting={conflicts.has(shift.id)}
                    onEdit={onEditShift}
                  />
                ))}
              </div>
              <button
                type="button"
                className={styles.add}
                onClick={() => onNewShift(day)}
              >
                + Add shift
                <span className={styles.srOnly}>
                  {' '}
                  on {weekdayName(day)}
                </span>
              </button>
            </section>
          );
        })}
      </div>
    </div>
  );
}
