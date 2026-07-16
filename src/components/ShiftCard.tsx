import { durationLabel, minutesToLabel } from '../lib/time';
import type { Employee, Shift } from '../lib/types';
import styles from './ShiftCard.module.css';

interface ShiftCardProps {
  shift: Shift;
  employee: Employee | undefined;
  isConflicting: boolean;
  onEdit: (shift: Shift) => void;
}

export function ShiftCard({
  shift,
  employee,
  isConflicting,
  onEdit,
}: ShiftCardProps) {
  const who = employee?.name ?? 'Unassigned';
  const time = `${minutesToLabel(shift.startMinutes)} – ${minutesToLabel(
    shift.endMinutes,
  )}`;

  return (
    <button
      type="button"
      className={styles.card}
      data-conflict={isConflicting || undefined}
      style={
        { '--accent': employee?.color ?? '#94a3b8' } as React.CSSProperties
      }
      onClick={() => onEdit(shift)}
    >
      <span className={styles.title}>{shift.title}</span>
      <span className={styles.time}>
        {time}
        <span className={styles.duration}>
          {' '}
          ({durationLabel(shift.startMinutes, shift.endMinutes)})
        </span>
      </span>
      <span className={styles.who} data-unassigned={!employee || undefined}>
        <span className={styles.dot} aria-hidden="true" />
        {who}
      </span>
      {isConflicting && (
        <span className={styles.conflict} aria-label="Scheduling conflict">
          ⚠ Conflict
        </span>
      )}
    </button>
  );
}
