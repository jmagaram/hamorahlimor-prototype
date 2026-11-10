import { useSyncExternalStore } from 'react';
import { getDb, pauseAllFor } from './store';

// Who is signed in. The real app: Firebase anonymous auth, plus a security code that ties the
// anonymous user to the teacher or one student. Here the session is kept in localStorage so a
// reload keeps you signed in (the data itself still resets).

export type Session = { role: 'teacher' } | { role: 'student'; studentId: string } | null;

const KEY = 'prototype-session';
const listeners = new Set<() => void>();

function load(): Session {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Session;
    // A student added after load is gone after a reload: then nobody is signed in.
    if (s?.role === 'student' && !getDb().students.some(x => x.id === s.studentId)) return null;
    return s;
  } catch {
    return null;
  }
}

let session: Session = load();

function set(s: Session) {
  session = s;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Storage blocked: the session just won't survive a reload.
  }
  listeners.forEach(l => l());
}

export const getSession = () => session;
export const useSession = () => useSyncExternalStore(fn => { listeners.add(fn); return () => { listeners.delete(fn); }; }, getSession);

/** Codes match ignoring case, spaces and dashes. */
const norm = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, '');

/** Sign in with a code. Returns false when no one has it. */
export function signIn(code: string): boolean {
  const db = getDb();
  const c = norm(code);
  if (c === norm(db.teacher.securityCode)) { set({ role: 'teacher' }); return true; }
  const s = db.students.find(x => norm(x.securityCode) === c);
  if (s) { set({ role: 'student', studentId: s.id }); return true; }
  return false;
}

/** Signing out pauses whatever the student was working on: leaving without Pause mustn't leave the clock running. */
export function signOut() {
  if (session?.role === 'student') pauseAllFor(session.studentId);
  set(null);
}
