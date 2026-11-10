import { displayStatus, EXERCISE_STATUS_COLOR, isOverdue, KINDS, repeatSuffix, STATUS_COLOR, type BadgeColor } from '../model/derived';
import { today } from '../model/format';
import type { Db } from '../model/types';
import type { Route } from './nav';

const NOT_FOUND = 'Not found';

/** The page title, also used as its breadcrumb. */
export function routeTitle(db: Db, r: Route): string {
  switch (r.page) {
    case 'home': return 'Home';
    case 'students': return 'Students';
    case 'student': return db.students.find(s => s.id === r.id)?.name ?? NOT_FOUND;
    case 'exercises': return 'Exercises';
    case 'exercise': return db.exercises.find(e => e.id === r.id)?.title ?? NOT_FOUND;
    case 'material': return 'Text to read';
    case 'question': {
      const e = db.exercises.find(x => x.id === r.exerciseId);
      if (!e) return NOT_FOUND;
      const i = e.questions.findIndex(q => q.id === r.questionId);
      return i < 0 ? NOT_FOUND : `Question ${i + 1}`;
    }
    case 'assign': return 'Assign';
    case 'chooseExercise': return 'Choose exercise';
    case 'assignments': return 'Assignments';
    case 'assignment': {
      const a = db.assignments.find(x => x.id === r.id);
      if (!a) return NOT_FOUND;
      const s = db.students.find(x => x.id === a.studentId);
      const e = db.exercises.find(x => x.id === a.exerciseId);
      return `${s?.name} · ${e?.title}${repeatSuffix(db, a)}`;
    }
    case 'overallFeedback': return 'Overall feedback';
    case 'answerFeedback': {
      const a = db.assignments.find(x => x.id === r.assignmentId);
      const i = db.exercises.find(x => x.id === a?.exerciseId)?.questions.findIndex(q => q.id === r.questionId) ?? -1;
      return i < 0 ? NOT_FOUND : `Question ${i + 1} feedback`;
    }
  }
}

/** The page's own heading (an h2 at the top of the content). Defaults to its title. */
export function routeHeading(db: Db, r: Route): string {
  const title = routeTitle(db, r);
  if (title === NOT_FOUND) return title;
  switch (r.page) {
    case 'home': return 'English practice';
    case 'answerFeedback': {
      const a = db.assignments.find(x => x.id === r.assignmentId);
      const name = db.students.find(s => s.id === a?.studentId)?.name.split(' ')[0];
      return `Feedback on ${name}'s answer`;
    }
    case 'overallFeedback': {
      const a = db.assignments.find(x => x.id === r.assignmentId);
      const name = db.students.find(s => s.id === a?.studentId)?.name.split(' ')[0];
      return `Overall feedback for ${name}`;
    }
    default: return title;
  }
}

/** Extras around a page's heading: a small line above it, and a badge after it. */
export interface HeadingExtras {
  kicker?: string;
  badges?: { label: string; color: BadgeColor }[];
}

export function routeHeadingExtras(db: Db, r: Route): HeadingExtras {
  if (r.page === 'exercise') {
    const e = db.exercises.find(x => x.id === r.id);
    if (!e) return {};
    return {
      kicker: KINDS[e.kind].kicker,
      badges: [{ label: e.status === 'draft' ? 'Draft' : 'Published', color: EXERCISE_STATUS_COLOR[e.status] }],
    };
  }
  if (r.page === 'answerFeedback') return { kicker: routeTitle(db, r).replace(' feedback', '') };
  if (r.page === 'assignment') {
    const a = db.assignments.find(x => x.id === r.id);
    if (!a) return {};
    const status = displayStatus(db, a);
    return {
      badges: [
        { label: status, color: STATUS_COLOR[status] },
        ...(isOverdue(a, today()) ? [{ label: 'Overdue', color: 'red' as const }] : []),
      ],
    };
  }
  return {};
}
