import { useSyncExternalStore } from 'react';
import { normalizeClass } from './derived';
import { now, today } from './format';
import { seed } from './seed';
import type { AudioRef, Comment, Db, Exercise, ExerciseKind, FeedbackStatus, Question } from './types';

// In-memory store. Every change goes through mutate(), which works on a copy,
// so React sees a new Db object each time.

let db: Db = seed();
const listeners = new Set<() => void>();

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
export const getDb = () => db;
export const useDb = () => useSyncExternalStore(subscribe, getDb);

function mutate(fn: (d: Db) => void) {
  const d = structuredClone(db);
  fn(d);
  db = d;
  listeners.forEach(l => l());
}

let nextId = 100;
const newId = (prefix: string) => `${prefix}${nextId++}`;
let nextAudio = 1;
/** A fake recording. */
export const fakeAudio = (): AudioRef => `fake-audio/rec-${nextAudio++}.webm`;

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function newSecurityCode(d: Db): string {
  for (;;) {
    const code = Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
    if (!d.students.some(s => s.securityCode === code)) return code;
  }
}

/* ---------- students ---------- */

const DUPLICATE_STUDENT = 'There is another student with the same name.';
const nameTaken = (name: string, exceptId?: string) =>
  db.students.some(s => s.id !== exceptId && s.name.toLowerCase() === name.toLowerCase());

export function addStudent(name: string, className?: string): string | undefined {
  name = name.trim();
  if (!name) return 'Enter a name.';
  if (nameTaken(name)) return DUPLICATE_STUDENT;
  mutate(d => {
    d.students.push({ id: newId('s'), name, className: normalizeClass(d, className), securityCode: newSecurityCode(d), dateCreated: today() });
  });
}

export function renameStudent(id: string, name: string): string | undefined {
  name = name.trim();
  if (!name) return 'Enter a name.';
  if (nameTaken(name, id)) return DUPLICATE_STUDENT;
  mutate(d => { d.students.find(s => s.id === id)!.name = name; });
}

export function setStudentsClass(ids: Iterable<string>, className: string | undefined) {
  const set = new Set(ids);
  mutate(d => {
    const c = normalizeClass(d, className);
    d.students.forEach(s => { if (set.has(s.id)) s.className = c; });
  });
}

export function regenerateSecurityCode(id: string) {
  mutate(d => {
    const s = d.students.find(x => x.id === id)!;
    s.securityCode = newSecurityCode(d);
  });
}

/** Also deletes their assignments, answers and feedback. */
export function deleteStudents(ids: Iterable<string>) {
  const set = new Set(ids);
  mutate(d => {
    d.students = d.students.filter(s => !set.has(s.id));
    removeAssignmentsWhere(d, a => set.has(a.studentId));
  });
}

/* ---------- exercises ---------- */

const EMPTY_MATERIAL: { [K in ExerciseKind]: () => Extract<Exercise, { kind: K }>['material'] } = {
  video: () => ({ url: '' }),
  read: () => ({ text: '' }),
  listen: () => ({}),
  speaking: () => ({}),
};

export function createExercise(kind: ExerciseKind): string {
  const id = newId('e');
  const label = { video: 'video', read: 'read and respond', listen: 'listen and respond', speaking: 'speaking questions' }[kind];
  mutate(d => {
    d.exercises.push({
      id, kind, title: `Untitled ${label}`, status: 'draft', allowRerecord: true,
      dateCreated: today(), questions: [], material: EMPTY_MATERIAL[kind](),
    } as Exercise);
  });
  return id;
}

/** Change a draft. Published exercises are locked, so this does nothing to them. */
export function updateDraft(id: string, fn: (e: Exercise) => void) {
  mutate(d => {
    const e = d.exercises.find(x => x.id === id);
    if (e?.status === 'draft') fn(e);
  });
}

export function publishExercise(id: string) {
  updateDraft(id, e => { e.status = 'published'; });
}

/** Only drafts can be deleted; drafts are never assigned. */
export function deleteExercise(id: string) {
  mutate(d => { d.exercises = d.exercises.filter(e => !(e.id === id && e.status === 'draft')); });
}

/** Creates a draft "Copy of …" and returns its id. */
export function duplicateExercises(ids: Iterable<string>): string[] {
  const made: string[] = [];
  mutate(d => {
    for (const id of ids) {
      const src = d.exercises.find(e => e.id === id);
      if (!src) continue;
      const copy = structuredClone(src);
      copy.id = newId('e');
      copy.title = 'Copy of ' + src.title;
      copy.status = 'draft';
      copy.dateCreated = today();
      copy.questions.forEach(q => { q.id = newId('q'); });
      d.exercises.push(copy);
      made.push(copy.id);
    }
  });
  return made;
}

/** Adds the question when it has no id yet. */
export function saveQuestion(exerciseId: string, q: Omit<Question, 'id'> & { id?: string }) {
  updateDraft(exerciseId, e => {
    const clean: Question = { id: q.id ?? newId('q') };
    if (q.promptText) clean.promptText = q.promptText;
    if (q.promptAudio) clean.promptAudio = q.promptAudio;
    if (q.targetSeconds) clean.targetSeconds = q.targetSeconds;
    const i = e.questions.findIndex(x => x.id === clean.id);
    if (i >= 0) e.questions[i] = clean;
    else e.questions.push(clean);
  });
}

export function deleteQuestion(exerciseId: string, questionId: string) {
  updateDraft(exerciseId, e => { e.questions = e.questions.filter(q => q.id !== questionId); });
}

/* ---------- assignments ---------- */

export function assign(studentIds: Iterable<string>, exerciseId: string, dueDate: string) {
  mutate(d => {
    for (const studentId of studentIds) {
      if (d.assignments.some(a => a.studentId === studentId && a.exerciseId === exerciseId)) continue;
      d.assignments.push({
        id: newId('a'), studentId, exerciseId, dateAssigned: today(), dueDate,
        state: 'notStarted', secondsTaken: 0,
      });
    }
  });
}

export function setDueDate(ids: Iterable<string>, dueDate: string) {
  const set = new Set(ids);
  mutate(d => { d.assignments.forEach(a => { if (set.has(a.id)) a.dueDate = dueDate; }); });
}

/** Deletes the assignments with their answers and feedback. */
export function unassign(ids: Iterable<string>) {
  const set = new Set(ids);
  mutate(d => removeAssignmentsWhere(d, a => set.has(a.id)));
}

function removeAssignmentsWhere(d: Db, pred: (a: Db['assignments'][number]) => boolean) {
  const gone = new Set(d.assignments.filter(pred).map(a => a.id));
  d.assignments = d.assignments.filter(a => !gone.has(a.id));
  d.answers = d.answers.filter(a => !gone.has(a.assignmentId));
  d.feedback = d.feedback.filter(f => !gone.has(f.assignmentId));
}

/* ---------- feedback ---------- */

function cleanComment(c: Comment): Comment {
  const out: Comment = {};
  if (c.text?.trim()) out.text = c.text.trim();
  if (c.audio) out.audio = c.audio;
  return out;
}

/** Published feedback stays published: saving it as a draft is refused. */
export function saveFeedback(assignmentId: string, overall: Comment, answerComments: Record<string, Comment>, status: FeedbackStatus) {
  mutate(d => {
    const old = d.feedback.find(f => f.assignmentId === assignmentId);
    if (old?.status === 'published' && status === 'draft') return;
    const comments: Record<string, Comment> = {};
    for (const [qid, c] of Object.entries(answerComments)) {
      const cc = cleanComment(c);
      if (cc.text || cc.audio) comments[qid] = cc;
    }
    const t = now();
    const f = {
      assignmentId,
      overall: cleanComment(overall),
      answerComments: comments,
      status,
      dateStarted: old?.dateStarted ?? t,
      ...(status === 'published' ? { datePublished: t } : {}),
    };
    d.feedback = [...d.feedback.filter(x => x.assignmentId !== assignmentId), f];
  });
}
