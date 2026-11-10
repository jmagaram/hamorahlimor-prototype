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

/** A rounded length: "30 sec", "2 min", "1½ min", otherwise "1:20". */
export const minutes = (seconds: number) =>
  seconds < 60 ? `${seconds} sec`
    : seconds % 60 === 0 ? `${seconds / 60} min`
      : seconds % 60 === 30 ? `${Math.floor(seconds / 60)}½ min`
        : mmss(seconds);

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "4-Nov", for short labels. */
export function shortDay(date: DateString): string {
  const [, m, d] = date.split('-').map(Number);
  return `${d}-${MONTHS[m - 1]}`;
}

/** "Tue 4-Nov". */
export function dayLabel(date: DateString): string {
  const [y, m, d] = date.split('-').map(Number);
  return `${WEEKDAYS[new Date(y, m - 1, d).getDay()]} ${d}-${MONTHS[m - 1]}`;
}

/** "Today, Mon 9-Nov", "Tomorrow, Tue 10-Nov", "Yesterday, Sun 8-Nov", otherwise "Wed 11-Nov". */
export function friendlyDay(date: DateString): string {
  const t = today();
  const near = date === t ? 'Today' : date === addDays(t, 1) ? 'Tomorrow' : date === addDays(t, -1) ? 'Yesterday' : '';
  return near ? `${near}, ${dayLabel(date)}` : dayLabel(date);
}

/** "due today, Mon 9-Nov", "due Wed 11-Nov", or "" with no due date (for lines under a row). */
export const dueText = (dueDate: DateString | undefined) => {
  if (!dueDate) return '';
  const f = friendlyDay(dueDate);
  return `due ${f[0].toLowerCase()}${f.slice(1)}`;
};

/** Whole days from one calendar day to another (negative if `to` is earlier). */
export function daysBetween(from: DateString, to: DateString): number {
  const [y1, m1, d1] = from.split('-').map(Number);
  const [y2, m2, d2] = to.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}
