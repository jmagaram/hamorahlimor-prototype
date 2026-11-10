import { createContext, useContext, useReducer } from 'react';
import { setPageState, type StackEntry } from './nav';

/** The stack entry the current page belongs to. */
export const PageEntryContext = createContext<StackEntry | null>(null);

/**
 * Like useState, but kept in the page's stack entry, so it survives visiting deeper pages
 * (e.g. a picker) and coming back. Gone once the page leaves the stack.
 */
export function usePageState<T>(name: string, initial: T): [T, (v: T) => void] {
  const entry = useContext(PageEntryContext);
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  if (!entry) throw new Error('usePageState needs a page');
  const value = (name in entry.state ? entry.state[name] : initial) as T;
  const set = (v: T) => { setPageState(entry, name, v); rerender(); };
  return [value, set];
}
