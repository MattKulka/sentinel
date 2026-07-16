import styles from './states.module.css';

export function Loading() {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <p className={styles.message}>Loading the schedule…</p>
    </div>
  );
}
