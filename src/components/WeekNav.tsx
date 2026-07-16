import { formatWeekRange } from '../lib/date';
import styles from './WeekNav.module.css';

interface WeekNavProps {
  anchor: string;
  conflictCount: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onNewShift: () => void;
}

export function WeekNav({
  anchor,
  conflictCount,
  onPrev,
  onNext,
  onToday,
  onNewShift,
}: WeekNavProps) {
  return (
    <div className={styles.bar}>
      <div className={styles.nav}>
        <button
          type="button"
          className={styles.arrow}
          onClick={onPrev}
          aria-label="Previous week"
        >
          ‹
        </button>
        <button type="button" className={styles.today} onClick={onToday}>
          Today
        </button>
        <button
          type="button"
          className={styles.arrow}
          onClick={onNext}
          aria-label="Next week"
        >
          ›
        </button>
        <h2 className={styles.range} aria-live="polite">
          {formatWeekRange(anchor)}
        </h2>
      </div>
      <div className={styles.actions}>
        {conflictCount > 0 && (
          <span className={styles.conflicts} role="status">
            {conflictCount} conflict{conflictCount === 1 ? '' : 's'}
          </span>
        )}
        <button type="button" className={styles.primary} onClick={onNewShift}>
          + New shift
        </button>
      </div>
    </div>
  );
}
