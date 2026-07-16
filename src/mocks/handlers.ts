import { http, HttpResponse } from 'msw';
import type { Shift } from '../lib/types';
import { db, nextShiftId } from './db';

type NewShift = Omit<Shift, 'id'>;

export const handlers = [
  http.get('/api/employees', () => HttpResponse.json(db.employees)),

  http.get('/api/shifts', () => HttpResponse.json(db.shifts)),

  http.post('/api/shifts', async ({ request }) => {
    const body = (await request.json()) as NewShift;
    const shift: Shift = { ...body, id: nextShiftId() };
    db.shifts.push(shift);
    return HttpResponse.json(shift, { status: 201 });
  }),

  http.patch('/api/shifts/:id', async ({ params, request }) => {
    const patch = (await request.json()) as Partial<Shift>;
    const index = db.shifts.findIndex((s) => s.id === params.id);
    if (index === -1) return new HttpResponse(null, { status: 404 });
    const updated = {
      ...db.shifts[index]!,
      ...patch,
      id: db.shifts[index]!.id,
    };
    db.shifts[index] = updated;
    return HttpResponse.json(updated);
  }),

  http.delete('/api/shifts/:id', ({ params }) => {
    const index = db.shifts.findIndex((s) => s.id === params.id);
    if (index === -1) return new HttpResponse(null, { status: 404 });
    db.shifts.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
