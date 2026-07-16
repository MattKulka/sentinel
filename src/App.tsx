import { useMemo, useState } from 'react';
import styles from './App.module.css';
import { WeekNav } from './components/WeekNav';
import { WeekView } from './components/WeekView';
import { ShiftDialog, type ShiftValues } from './components/ShiftDialog';
import { ErrorState } from './components/states/ErrorState';
import { Loading } from './components/states/Loading';
import { weekDays } from './lib/date';
import type { Shift } from './lib/types';
import { useScheduler } from './hooks/useScheduler';

type DialogState =
  { mode: 'create'; day: string } | { mode: 'edit'; shift: Shift } | null;

const DEFAULT_START = 9 * 60;
const DEFAULT_END = 17 * 60;

export default function App() {
  const sched = useScheduler();
  const { state, conflicts } = sched;
  const [dialog, setDialog] = useState<DialogState>(null);

  const days = useMemo(() => weekDays(state.anchor), [state.anchor]);
  const weekShifts = useMemo(() => {
    const set = new Set(days);
    return state.shifts.filter((s) => set.has(s.day));
  }, [state.shifts, days]);
  const weekConflicts = useMemo(
    () =>
      new Set(
        [...conflicts].filter((id) => weekShifts.some((s) => s.id === id)),
      ),
    [conflicts, weekShifts],
  );

  function handleSubmit(values: ShiftValues) {
    if (dialog?.mode === 'create') {
      void sched.addShift(values);
    } else if (dialog?.mode === 'edit') {
      void sched.updateShift({ ...dialog.shift, ...values });
    }
    setDialog(null);
  }

  function handleDelete() {
    if (dialog?.mode === 'edit') void sched.removeShift(dialog.shift.id);
    setDialog(null);
  }

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
              onNewShift={() =>
                setDialog({ mode: 'create', day: state.anchor })
              }
            />
            <WeekView
              days={days}
              shifts={weekShifts}
              employees={state.employees}
              conflicts={weekConflicts}
              onNewShift={(day) => setDialog({ mode: 'create', day })}
              onEditShift={(shift) => setDialog({ mode: 'edit', shift })}
            />
          </>
        )}
      </main>

      {dialog && (
        <ShiftDialog
          mode={dialog.mode}
          employees={state.employees}
          initial={
            dialog.mode === 'create'
              ? {
                  title: '',
                  day: dialog.day,
                  startMinutes: DEFAULT_START,
                  endMinutes: DEFAULT_END,
                  employeeId: null,
                }
              : {
                  title: dialog.shift.title,
                  day: dialog.shift.day,
                  startMinutes: dialog.shift.startMinutes,
                  endMinutes: dialog.shift.endMinutes,
                  employeeId: dialog.shift.employeeId,
                }
          }
          onSubmit={handleSubmit}
          onClose={() => setDialog(null)}
          onDelete={dialog.mode === 'edit' ? handleDelete : undefined}
        />
      )}
    </div>
  );
}
