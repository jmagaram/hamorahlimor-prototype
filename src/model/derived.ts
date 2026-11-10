import { mmss } from './format';
import type { Answer, AnswerFeedback, Assignment, Db, Exercise, ExerciseKind, Feedback, Question, QuestionMode, Student } from './types';

/** `kicker` is the small line above an exercise's heading that says what kind it is. */
export const KINDS: Record<ExerciseKind, { label: string; description: string; kicker: string }> = {
  video: { label: 'Video', description: 'Students watch a video clip, then answer out loud.', kicker: 'Watch and answer' },
  read: { label: 'Read and respond', description: 'Students read a text, then answer out loud.', kicker: 'Read and answer' },
  listen: { label: 'Listen and respond', description: 'Students listen to your recording, then answer out loud.', kicker: 'Listen and answer' },
  speaking: { label: 'Speaking questions', description: 'Students just answer your questions out loud.', kicker: 'Speaking questions' },
};

/** Display statuses, in the order lists group them. */
export const DISPLAY_STATUSES = ['Needs review', 'Feedback draft', 'In progress', 'Paused', 'Not started', 'Done'] as const;
export type DisplayStatus = (typeof DISPLAY_STATUSES)[number];

export const feedbackFor = (db: Db, assignmentId: string): Feedback | undefined =>
  db.feedback.find(f => f.assignmentId === assignmentId);

export const answerFor = (db: Db, assignmentId: string, questionId: string): Answer | undefined =>
  db.answers.find(a => a.assignmentId === assignmentId && a.questionId === questionId);

export function displayStatus(db: Db, a: Assignment): DisplayStatus {
  switch (a.state) {
    case 'notStarted': return 'Not started';
    case 'active': return 'In progress';
    case 'paused': return 'Paused';
    case 'submitted': {
      const f = feedbackFor(db, a.id);
      return !f ? 'Needs review' : f.status === 'published' ? 'Done' : 'Feedback draft';
    }
  }
}

/** Seconds taken so far, including the current session while active. */
export function timeTaken(a: Assignment, nowMs = Date.now()): number {
  const running = a.state === 'active' && a.resumedAt ? (nowMs - Date.parse(a.resumedAt)) / 1000 : 0;
  return a.secondsTaken + Math.max(0, running);
}

export const isOpen = (a: Assignment) => a.state !== 'submitted';


export function hasMaterial(e: Exercise): boolean {
  switch (e.kind) {
    case 'video': return !!e.material.url;
    case 'read': return !!e.material.text;
    case 'listen': return !!e.material.audio;
    case 'speaking': return true;
  }
}

/** Why the exercise can't be published, or undefined if it can. */
export function publishProblem(e: Exercise): string | undefined {
  if (!e.questions.length) return 'Add at least one question.';
  const noText = e.questions.findIndex(q => !q.promptText);
  if (noText >= 0) return `Question ${noText + 1} needs its text.`;
  const noAudio = hasQuestionAudio(e) ? e.questions.findIndex(q => !q.promptAudio) : -1;
  if (noAudio >= 0) return `Question ${noAudio + 1} needs audio, because students hear the questions.`;
  if (hasMaterial(e)) return undefined;
  return { video: 'Add the video URL.', read: 'Add the text to read.', listen: 'Record the audio.', speaking: '' }[e.kind];
}

export function materialSummary(e: Exercise): string {
  switch (e.kind) {
    case 'video':
      return e.material.url || 'Not set';
    case 'read': {
      const t = e.material.text;
      return t ? t.slice(0, 60) + (t.length > 60 ? '…' : '') : 'Not set';
    }
    case 'listen':
      return e.material.audio ? 'Recording' : 'Not recorded';
    case 'speaking':
      return '';
  }
}

/** Assignment ids in the order grouped lists show them, for "Select all". */
export const groupedOrder = (db: Db, assignments: Assignment[]): string[] =>
  DISPLAY_STATUSES.flatMap(st => assignments.filter(a => displayStatus(db, a) === st).map(a => a.id));

/* ---------- classes (free text on Student, no entity) ---------- */

const byName = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' });

/** Every class in use, A–Z. */
export const classNames = (db: Db): string[] =>
  [...new Set(db.students.flatMap(s => (s.className ? [s.className] : [])))].sort(byName);

/** Trim; blank means no class; reuse an existing class's spelling when it matches ignoring case. */
export function normalizeClass(db: Db, raw: string | undefined): string | undefined {
  const t = raw?.trim();
  if (!t) return undefined;
  return classNames(db).find(c => c.toLowerCase() === t.toLowerCase()) ?? t;
}

export interface StudentGroup {
  /** Undefined for the "No class" group. */
  className?: string;
  label: string;
  students: Student[];
}

/** Students grouped by class A–Z, then "No class"; names A–Z within each group. Empty groups are left out. */
export function studentGroups(db: Db): StudentGroup[] {
  const sorted = [...db.students].sort((a, b) => byName(a.name, b.name));
  const groups: StudentGroup[] = classNames(db).map(c => ({ className: c, label: c, students: sorted.filter(s => s.className === c) }));
  const none = sorted.filter(s => !s.className);
  if (none.length) groups.push({ label: 'No class', students: none });
  return groups;
}

/** Seconds from "m:ss" or "h:mm:ss", or undefined if it doesn't parse. */
function toSeconds(t: string): number | undefined {
  if (!/^\d+(:\d{1,2}){1,2}$/.test(t)) return undefined;
  return t.split(':').reduce((sum, part) => sum * 60 + Number(part), 0);
}

/** The clip's length when both ends are known ("5:12"); otherwise which part plays. */
export function clipSummary(m: { start?: string; end?: string }): string {
  if (m.start && m.end) {
    const a = toSeconds(m.start), b = toSeconds(m.end);
    if (a !== undefined && b !== undefined && b > a) return mmss(b - a);
    return `${m.start} until ${m.end}`;
  }
  if (m.start) return `${m.start} until end`;
  if (m.end) return `beginning until ${m.end}`;
  return 'Whole video';
}

/** The value shown on a settings row for a recording: "Recorded · 0:22". */
export const audioSummary = (clip: { duration: number } | undefined, none = 'Not recorded yet') =>
  clip ? `Recorded · ${mmss(clip.duration)}` : none;

/** Which part of the video plays, for a sentence: "1:05 – 3:20", "from 1:05 to the end", "the whole". */
export function clipRange(m: { start?: string; end?: string }): string {
  if (m.start && m.end) return `${m.start} – ${m.end}`;
  if (m.start) return `from ${m.start} to the end`;
  if (m.end) return `the beginning to ${m.end}`;
  return 'all';
}

/** Named badge colors (CSS classes `.badge-<color>`). */
export type BadgeColor = 'gray' | 'blue' | 'green' | 'amber' | 'red' | 'purple';

/** The badge color for an assignment's display status: amber needs you, green is finished. */
export const STATUS_COLOR: Record<DisplayStatus, BadgeColor> = {
  'Needs review': 'amber',
  'Feedback draft': 'purple',
  'In progress': 'blue',
  'Paused': 'gray',
  'Not started': 'gray',
  'Done': 'green',
};

/** The badge color for an exercise's status. */
export const EXERCISE_STATUS_COLOR: Record<'draft' | 'published', BadgeColor> = { draft: 'gray', published: 'green' };

/** Past its due date and not submitted. */
export const isOverdue = (a: Assignment, todayDate: string) => !!a.dueDate && a.dueDate < todayDate && a.state !== 'submitted';

/** The title a new exercise starts with, e.g. "Untitled video". */
export const defaultTitle = (kind: ExerciseKind) =>
  `Untitled ${{ video: 'video', read: 'read and respond', listen: 'listen and respond', speaking: 'speaking questions' }[kind]}`;

/** A question with nothing in it: no prompt text, no audio, no target. */
export const isEmptyQuestion = (q: Question) => !q.promptText && !q.promptAudio && !q.targetSeconds;

/**
 * A draft nobody has put anything into: default title, no material, no questions with content.
 * Time limit and re-recording don't count. Empty drafts are deleted when you leave them, and
 * deleting one needs no confirmation.
 */
export function isEmptyDraft(e: Exercise): boolean {
  if (e.status !== 'draft' || e.title !== defaultTitle(e.kind)) return false;
  const noMaterial =
    e.kind === 'video' ? !e.material.url :
    e.kind === 'read' ? !e.material.text :
    e.kind === 'listen' ? !e.material.audio :
    true;
  return noMaterial && e.questions.every(isEmptyQuestion);
}

/** The heading of an exercise's material section; speaking exercises have none. */
export const MATERIAL_HEADING: Record<Exclude<ExerciseKind, 'speaking'>, string> = {
  video: 'Video to watch',
  listen: 'Audio to listen to',
  read: 'Text to read',
};

/** Whether students hear the questions, so each question has (and needs) audio. */
export const hasQuestionAudio = (e: Exercise) => e.questionMode !== 'read';

/** The choices for how students get each question, as labels and captions. */
export const QUESTION_MODES: { value: QuestionMode; label: string; sub: string }[] = [
  { value: 'read', label: 'Read it', sub: 'Students read each question.' },
  { value: 'hear', label: 'Hear it', sub: 'Students only hear each question, for listening practice or like the exam. You still see the text when grading.' },
  { value: 'readAndHear', label: 'Read and hear it', sub: 'Students read each question and can play it.' },
];
export const questionModeLabel = (m: QuestionMode) => QUESTION_MODES.find(x => x.value === m)!.label;

/** One line about an answer's feedback: "Comments at 0:06, 0:13 · Overall comment", or "None yet". */
export function answerFeedbackSummary(af: AnswerFeedback | undefined): string {
  if (!af) return 'None yet';
  const parts: string[] = [];
  if (af.comments.length) parts.push(`${af.comments.length === 1 ? 'Comment' : 'Comments'} at ${af.comments.map(c => mmss(c.atSeconds)).join(', ')}`);
  if (af.overall.text || af.overall.audio) parts.push('Overall comment');
  return parts.join(' · ') || 'None yet';
}
