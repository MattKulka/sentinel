import type { Employee, Shift } from '../lib/types';

/** Payload for creating a shift — everything but the server-assigned id. */
export type NewShift = Omit<Shift, 'id'>;

async function json<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`Request to ${input} failed with ${res.status}`);
  }
  return (await res.json()) as T;
}

export function fetchEmployees(): Promise<Employee[]> {
  return json<Employee[]>('/api/employees');
}

export function fetchShifts(): Promise<Shift[]> {
  return json<Shift[]>('/api/shifts');
}

export function createShift(input: NewShift): Promise<Shift> {
  return json<Shift>('/api/shifts', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function patchShift(id: string, patch: Partial<Shift>): Promise<Shift> {
  return json<Shift>(`/api/shifts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function deleteShift(id: string): Promise<void> {
  const res = await fetch(`/api/shifts/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error(`Failed to delete shift ${id}: ${res.status}`);
  }
}
