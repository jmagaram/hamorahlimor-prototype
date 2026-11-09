import type { DateString, Timestamp } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

export function toDateString(d: Date): DateString {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export const today = (): DateString => toDateString(new Date());
export const now = (): Timestamp => new Date().toISOString();

export function addDays(date: DateString, days: number): DateString {
  const [y, m, d] = date.split('-').map(Number);
  return toDateString(new Date(y, m - 1, d + days));
}

/** A timestamp shown as its local calendar day. */
export function formatTimestamp(t: Timestamp | undefined): string {
  return t ? toDateString(new Date(t)) : '—';
}

/** Seconds as m:ss. */
export function mmss(seconds: number | undefined): string {
  if (seconds == null) return '—';
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
}
