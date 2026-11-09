import type { Answer, Assignment, Comment, Db, Exercise, ExerciseKind, Feedback } from './types';

export const KINDS: Record<ExerciseKind, { label: string; description: string }> = {
  video: { label: 'Video', description: 'Students watch a video clip, then answer out loud.' },
  read: { label: 'Read and respond', description: 'Students read a text, then answer out loud.' },
  listen: { label: 'Listen and respond', description: 'Students listen to your recording, then answer out loud.' },
  speaking: { label: 'Speaking questions', description: 'Students just answer your questions out loud.' },
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

export const hasComment = (c: Comment | undefined): c is Comment => !!c && (!!c.text || !!c.audio);

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
  if (hasMaterial(e)) return undefined;
  return { video: 'Add the video URL.', read: 'Add the text to read.', listen: 'Record the audio.', speaking: '' }[e.kind];
}

export function materialSummary(e: Exercise): string {
  switch (e.kind) {
    case 'video': {
      const m = e.material;
      return m.url ? `${m.url} (${m.start || 'start'} – ${m.end || 'end'})` : 'Not set';
    }
    case 'read': {
      const t = e.material.text;
      return t ? t.slice(0, 60) + (t.length > 60 ? '…' : '') : 'Not set';
    }
    case 'listen':
      return e.material.audio ? 'Recording' + (e.material.sourceText ? ' + text' : '') : 'Not recorded';
    case 'speaking':
      return '';
  }
}

/** Assignment ids in the order grouped lists show them, for "Select all". */
export const groupedOrder = (db: Db, assignments: Assignment[]): string[] =>
  DISPLAY_STATUSES.flatMap(st => assignments.filter(a => displayStatus(db, a) === st).map(a => a.id));
