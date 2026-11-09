import { useSyncExternalStore } from 'react';

export type Route =
  | { page: 'home' }
  | { page: 'classes' }
  | { page: 'class'; name: string }
  | { page: 'students' }
  | { page: 'student'; id: string }
  | { page: 'exercises' }
  | { page: 'exercise'; id: string }
  | { page: 'material'; id: string }
  | { page: 'question'; exerciseId: string; questionId?: string }
  | { page: 'assignToStudents'; exerciseId: string }
  | { page: 'assignToStudent'; studentId: string }
  | { page: 'assignments' }
  | { page: 'assignment'; id: string }
  | { page: 'review'; id: string };

export interface StackEntry {
  route: Route;
  /** Same page + same params gives the same key. */
  key: string;
}

export function routeKey(r: Route): string {
  const rec = r as unknown as Record<string, unknown>;
  return JSON.stringify(Object.keys(rec).sort().filter(k => rec[k] !== undefined).map(k => [k, rec[k]]));
}

const entry = (route: Route): StackEntry => ({ route, key: routeKey(route) });

let stack: StackEntry[] = [entry({ page: 'home' })];
const listeners = new Set<() => void>();

function set(next: StackEntry[]) {
  stack = next;
  listeners.forEach(l => l());
  window.scrollTo(0, 0);
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
export const getStack = () => stack;
export const useStack = () => useSyncExternalStore(subscribe, getStack);

/** Push the route, or cut the stack back to it if it's already in the trail. */
export function go(route: Route) {
  const e = entry(route);
  const i = stack.findIndex(s => s.key === e.key);
  set(i >= 0 ? stack.slice(0, i + 1) : [...stack, e]);
}
export function back() {
  if (stack.length > 1) set(stack.slice(0, -1));
}
export function home() {
  set([entry({ page: 'home' })]);
}
export function crumb(i: number) {
  set(stack.slice(0, i + 1));
}
