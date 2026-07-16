import { addDays } from '../lib/date';
import type { Employee, Shift } from '../lib/types';

export const seedEmployees: Employee[] = [
  { id: 'e1', name: 'Ada Lovelace', color: '#6366f1', role: 'Barista' },
  { id: 'e2', name: 'Grace Hopper', color: '#10b981', role: 'Barista' },
  { id: 'e3', name: 'Katherine Johnson', color: '#f59e0b', role: 'Shift Lead' },
  { id: 'e4', name: 'Alan Turing', color: '#ef4444', role: 'Barista' },
];

const h = (hour: number) => hour * 60;

/**
 * A demo week anchored to `monday`. Includes one deliberate double-booking
 * (Ada, Wednesday morning) so the conflict UI has something to show on load,
 * plus one unassigned shift to exercise assignment.
 */
export function buildSeedShifts(monday: string): Shift[] {
  const mon = monday;
  const tue = addDays(monday, 1);
  const wed = addDays(monday, 2);
  const thu = addDays(monday, 3);
  const fri = addDays(monday, 4);

  return [
    {
      id: 's1',
      employeeId: 'e1',
      day: mon,
      startMinutes: h(9),
      endMinutes: h(13),
      title: 'Opening',
    },
    {
      id: 's2',
      employeeId: 'e2',
      day: mon,
      startMinutes: h(13),
      endMinutes: h(17),
      title: 'Midday',
    },
    {
      id: 's3',
      employeeId: 'e3',
      day: tue,
      startMinutes: h(8),
      endMinutes: h(16),
      title: 'Lead cover',
    },
    // Ada is double-booked Wednesday morning — the two overlap.
    {
      id: 's4',
      employeeId: 'e1',
      day: wed,
      startMinutes: h(9),
      endMinutes: h(12),
      title: 'Opening',
    },
    {
      id: 's5',
      employeeId: 'e1',
      day: wed,
      startMinutes: h(11),
      endMinutes: h(15),
      title: 'Deliveries',
    },
    {
      id: 's6',
      employeeId: 'e4',
      day: thu,
      startMinutes: h(12),
      endMinutes: h(20),
      title: 'Evening',
    },
    {
      id: 's7',
      employeeId: null,
      day: fri,
      startMinutes: h(9),
      endMinutes: h(17),
      title: 'Open shift',
    },
  ];
}
