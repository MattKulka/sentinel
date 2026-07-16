import { useMemo } from 'react';
import styles from './App.module.css';
import { WeekNav } from './components/WeekNav';
import { WeekView } from './components/WeekView';
import { ErrorState } from './components/states/ErrorState';
import { Loading } from './components/states/Loading';
import { weekDays } from './lib/date';
import { useScheduler } from './hooks/useScheduler';

export default function App() {
  const sched = useScheduler();
  const { state, conflicts } = sched;

  const days = useMemo(() => weekDays(state.anchor), [state.anchor]);
  const weekShifts = useMemo(() => {
    const set = new Set(days);
    return state.shifts.filter((s) => set.has(s.day));
  }, [state.shifts, days]);
  const weekConflicts = useMemo(
    () => new Set([...conflicts].filter((id) => weekShifts.some((s) => s.id === id))),
    [conflicts, weekShifts],
  );

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <img src="/sentinel.svg" alt="" width={28} height={28} />
          <div>
            <h1 className={styles.title}>Sentinel</h1>
            <p className={styles.tagline}>Team shift scheduler</p>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {state.status === 'loading' && <Loading />}
        {state.status === 'error' && (
          <ErrorState message={state.error} onRetry={sched.reload} />
        )}
        {state.status === 'ready' && (
          <>
            <WeekNav
              anchor={state.anchor}
              conflictCount={weekConflicts.size}
              onPrev={() => sched.moveWeek(-1)}
              onNext={() => sched.moveWeek(1)}
              onToday={() => sched.moveWeek(0)}
              onNewShift={() => {}}
            />
            <WeekView
              days={days}
              shifts={weekShifts}
              employees={state.employees}
              conflicts={weekConflicts}
              onNewShift={() => {}}
              onEditShift={() => {}}
            />
          </>
        )}
      </main>
    </div>
  );
}
