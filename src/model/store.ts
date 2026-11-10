import { useSyncExternalStore } from 'react';
import { defaultTitle, isEmptyDraft, isEmptyQuestion, normalizeClass } from './derived';
import { now, today } from './format';
import { seed } from './seed';
import type { AudioClip, Comment, Db, Exercise, ExerciseKind, Question } from './types';

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
/** A fake recording of the given length in seconds. */
export const fakeAudio = (duration: number): AudioClip => ({ path: `fake-audio/rec-${nextAudio++}.webm`, duration });

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const randomChars = (n: number) => Array.from({ length: n }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
/** "AZ54-93GW": 8 characters without look-alikes (0/O, 1/I/L), unique among students and the teacher. */
function newSecurityCode(d: Db): string {
  for (;;) {
    const code = `${randomChars(4)}-${randomChars(4)}`;
    if (!d.students.some(s => s.securityCode === code) && d.teacher.securityCode !== code) return code;
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
  mutate(d => {
    d.exercises.push({
      id, kind, title: defaultTitle(kind), status: 'draft', allowRerecord: true, questionMode: 'read',
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

/** Delete the draft if it's empty (see isEmptyDraft). Called when navigation leaves its page. */
export function discardIfEmptyDraft(id: string) {
  const e = db.exercises.find(x => x.id === id);
  if (e && isEmptyDraft(e)) deleteExercise(id);
}

/** Delete the question if it's empty and its exercise is a draft. Called when navigation leaves its page. */
export function discardIfEmptyQuestion(exerciseId: string, questionId: string) {
  const e = db.exercises.find(x => x.id === exerciseId);
  const q = e?.questions.find(x => x.id === questionId);
  if (e?.status === 'draft' && q && isEmptyQuestion(q)) deleteQuestion(exerciseId, questionId);
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
/** Add an empty question to a draft and return its id. Its fields are then set one at a time. */
export function addQuestion(exerciseId: string): string {
  const id = newId('q');
  updateDraft(exerciseId, e => { e.questions.push({ id }); });
  return id;
}

/** Change one question of a draft. Blank text and a zero target are stored as absent. */
export function updateQuestion(exerciseId: string, questionId: string, fn: (q: Question) => void) {
  updateDraft(exerciseId, e => {
    const q = e.questions.find(x => x.id === questionId);
    if (!q) return;
    fn(q);
    if (!q.promptText?.trim()) delete q.promptText; else q.promptText = q.promptText.trim();
    if (!q.promptAudio) delete q.promptAudio;
    if (!q.targetSeconds) delete q.targetSeconds;
  });
}

export function deleteQuestion(exerciseId: string, questionId: string) {
  updateDraft(exerciseId, e => { e.questions = e.questions.filter(q => q.id !== questionId); });
}

/* ---------- assignments ---------- */

/** Skips a student who still has an open (unsubmitted) assignment of this exercise. Once submitted, it can be assigned again. */
export function assign(studentIds: Iterable<string>, exerciseId: string, dueDate: string | undefined) {
  mutate(d => {
    for (const studentId of studentIds) {
      if (d.assignments.some(a => a.studentId === studentId && a.exerciseId === exerciseId && a.state !== 'submitted')) continue;
      d.assignments.push({
        id: newId('a'), studentId, exerciseId, dateAssigned: today(), ...(dueDate && { dueDate }),
        state: 'notStarted', secondsTaken: 0,
      });
    }
  });
}

export function setDueDate(ids: Iterable<string>, dueDate: string | undefined) {
  const set = new Set(ids);
  mutate(d => { d.assignments.forEach(a => { if (!set.has(a.id)) return; if (dueDate) a.dueDate = dueDate; else delete a.dueDate; }); });
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

const hasContent = (c: Comment) => !!(c.text || c.audio);

/** Copy a comment's content, let fn change it, and tidy it. */
function applyTo(c: Comment, fn: (c: Comment) => void): Comment {
  const x: Comment = { text: c.text, audio: c.audio };
  fn(x);
  return cleanComment(x);
}

/**
 * Which comment to change: the assignment's overall one, an answer's overall one ({ questionId }),
 * or a timed comment on an answer ({ questionId, comment }); a new id adds that comment.
 */
export type CommentPlace = 'overall' | { questionId: string; comment?: { id: string; atSeconds: number } };

/** An id for a new timed comment. */
export const newCommentId = () => newId('c');

/**
 * Change one comment of an assignment's feedback. A comment left with neither text nor audio is removed.
 * Saves right away. The first change starts the feedback as a draft; published feedback stays
 * published, so edits reach the student immediately (and update datePublished).
 * A draft left with no comments at all is removed, so the assignment is back to "Needs review".
 */
export function updateFeedback(assignmentId: string, place: CommentPlace, fn: (c: Comment) => void) {
  mutate(d => {
    const t = now();
    let f = d.feedback.find(x => x.assignmentId === assignmentId);
    if (!f) {
      f = { assignmentId, overall: {}, answerFeedback: {}, status: 'draft', dateStarted: t };
      d.feedback.push(f);
    }
    if (place === 'overall') f.overall = applyTo(f.overall, fn);
    else {
      const q = place.questionId;
      const af = f.answerFeedback[q] ?? { comments: [], overall: {} };
      if (!place.comment) af.overall = applyTo(af.overall, fn);
      else {
        const { id, atSeconds } = place.comment;
        const old = af.comments.find(c => c.id === id) ?? { id, atSeconds };
        const c = { id, atSeconds: old.atSeconds, ...applyTo(old, fn) };
        af.comments = af.comments.filter(x => x.id !== id);
        if (hasContent(c)) af.comments = [...af.comments, c].sort((x, y) => x.atSeconds - y.atSeconds);
      }
      if (af.comments.length || hasContent(af.overall)) f.answerFeedback[q] = af;
      else delete f.answerFeedback[q];
    }
    if (f.status === 'published') f.datePublished = t;
    const empty = !hasContent(f.overall) && !Object.keys(f.answerFeedback).length;
    if (empty && f.status === 'draft') d.feedback = d.feedback.filter(x => x.assignmentId !== assignmentId);
  });
}

/** Make the feedback visible to the student. */
export function publishFeedback(assignmentId: string) {
  mutate(d => {
    const f = d.feedback.find(x => x.assignmentId === assignmentId);
    if (!f) return;
    f.status = 'published';
    f.datePublished = now();
  });
}

/* ---------- the student's work ---------- */

/** Start or resume: the timer runs from now. */
export function startAssignment(id: string) {
  mutate(d => {
    const a = d.assignments.find(x => x.id === id);
    if (!a || a.state === 'active' || a.state === 'submitted') return;
    const t = now();
    a.state = 'active';
    a.dateStarted ??= t;
    a.resumedAt = t;
  });
}

/** Stop the timer, adding this session's time. */
function stopClock(a: Db['assignments'][number]) {
  if (a.state === 'active' && a.resumedAt) a.secondsTaken += Math.max(0, (Date.now() - Date.parse(a.resumedAt)) / 1000);
  delete a.resumedAt;
}

export function pauseAssignment(id: string) {
  mutate(d => {
    const a = d.assignments.find(x => x.id === id);
    if (!a || a.state !== 'active') return;
    stopClock(a);
    a.state = 'paused';
  });
}

/** Hand it in. Answers can't change after this. */
export function submitAssignment(id: string) {
  mutate(d => {
    const a = d.assignments.find(x => x.id === id);
    if (!a || a.state === 'submitted') return;
    stopClock(a);
    a.secondsTaken = Math.round(a.secondsTaken);
    a.state = 'submitted';
    a.dateSubmitted = now();
  });
}

/** Save (or with no clip, remove) the student's answer to one question. */
export function setAnswer(assignmentId: string, questionId: string, clip: AudioClip | undefined) {
  mutate(d => {
    d.answers = d.answers.filter(x => !(x.assignmentId === assignmentId && x.questionId === questionId));
    if (clip) d.answers.push({ assignmentId, questionId, recording: clip.path, duration: clip.duration, dateRecorded: now() });
  });
}

/** The student opened their published feedback: it's no longer new. */
export function markFeedbackSeen(assignmentId: string) {
  const f = db.feedback.find(x => x.assignmentId === assignmentId);
  if (!f || f.status !== 'published' || f.dateSeen) return;
  mutate(d => {
    const g = d.feedback.find(x => x.assignmentId === assignmentId);
    if (g) g.dateSeen = now();
  });
}

/** The student opened one answer's comments: no longer unread. */
export function markAnswerFeedbackSeen(assignmentId: string, questionId: string) {
  const f = db.feedback.find(x => x.assignmentId === assignmentId);
  if (!f || f.status !== 'published' || !f.answerFeedback[questionId] || f.answerFeedback[questionId].dateSeen) return;
  mutate(d => {
    const af = d.feedback.find(x => x.assignmentId === assignmentId)?.answerFeedback[questionId];
    if (af) af.dateSeen = now();
  });
}
