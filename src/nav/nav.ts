import { useSyncExternalStore } from 'react';
import { discardIfEmptyDraft, discardIfEmptyQuestion } from '../model/store';

export type Route =
  | { page: 'home' }
  | { page: 'students' }
  | { page: 'student'; id: string }
  | { page: 'exercises' }
  | { page: 'exercise'; id: string }
  | { page: 'material'; id: string }
  | { page: 'question'; exerciseId: string; questionId: string }
  /** Either can be preset by where you came from; both can be changed on the page. */
  | { page: 'assign'; exerciseId?: string; studentId?: string }
  | { page: 'chooseExercise' }
  | { page: 'assignments' }
  | { page: 'assignment'; id: string }
  | { page: 'answerFeedback'; assignmentId: string; questionId: string };

export interface StackEntry {
  route: Route;
  /** Same page + same params gives the same key. */
  key: string;
  /**
   * What the user has done on the page so far (choices, half-filled fields), by name. Lives as long
   * as the entry is in the stack: kept while you visit deeper pages, gone when you leave it upward.
   * Read and write it with usePageState.
   */
  state: Record<string, unknown>;
}

export function routeKey(r: Route): string {
  const rec = r as unknown as Record<string, unknown>;
  return JSON.stringify(Object.keys(rec).sort().filter(k => rec[k] !== undefined).map(k => [k, rec[k]]));
}

const entry = (route: Route): StackEntry => ({ route, key: routeKey(route), state: {} });

let stack: StackEntry[] = [entry({ page: 'home' })];
const listeners = new Set<() => void>();

function set(next: StackEntry[]) {
  const left = stack.filter(s => !next.some(n => n.key === s.key));
  stack = next;
  listeners.forEach(l => l());
  window.scrollTo(0, 0);
  // Pages you left upward (Back, Done, crumbs, Home): throw away an empty question or draft.
  // Deepest first, so removing an empty question can leave its exercise empty too.
  for (const s of left.reverse()) {
    if (s.route.page === 'question') discardIfEmptyQuestion(s.route.exerciseId, s.route.questionId);
    if (s.route.page === 'exercise') discardIfEmptyDraft(s.route.id);
  }
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
export const getStack = () => stack;
export const useStack = () => useSyncExternalStore(subscribe, getStack);

/** Whether the route is already in the trail. Links to such a page show as plain text: Back and the crumbs return to it. */
export const inTrail = (route: Route) => stack.some(s => s.key === routeKey(route));

/** A link's tap handler: go to the route, or undefined when it's already in the trail. */
export const linkTo = (route: Route): (() => void) | undefined => (inTrail(route) ? undefined : () => go(route));

/** Push the route, or cut the stack back to it if it's already in the trail. */
export function go(route: Route) {
  const e = entry(route);
  const i = stack.findIndex(s => s.key === e.key);
  set(i >= 0 ? stack.slice(0, i + 1) : [...stack, e]);
}
/** Write one value of an entry's page state. */
export function setPageState(e: StackEntry, name: string, value: unknown) {
  e.state[name] = value;
}

/** For picker pages: hand a value to the page below (into its page state under `name`), then go back to it. */
export function backWith(name: string, value: unknown) {
  const below = stack[stack.length - 2];
  if (below) setPageState(below, name, value);
  back();
}
export function back() {
  if (stack.length > 1) set(stack.slice(0, -1));
}
export function crumb(i: number) {
  set(stack.slice(0, i + 1));
}
