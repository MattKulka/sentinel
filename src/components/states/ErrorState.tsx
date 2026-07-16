import styles from './states.module.css';

interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className={styles.wrap} role="alert">
      <p className={styles.message}>
        Couldn’t load the schedule.
        {message ? <span className={styles.detail}> {message}</span> : null}
      </p>
      <button type="button" className={styles.retry} onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
