import type { Db } from '../model/types';
import type { Route } from './nav';

const NOT_FOUND = 'Not found';

/** The page title, also used as its breadcrumb. */
export function routeTitle(db: Db, r: Route): string {
  switch (r.page) {
    case 'home': return 'Home';
    case 'classes': return 'Classes';
    case 'class': return db.classes.some(c => c.name === r.name) ? r.name : NOT_FOUND;
    case 'students': return 'Students';
    case 'student': return db.students.find(s => s.id === r.id)?.name ?? NOT_FOUND;
    case 'exercises': return 'Exercises';
    case 'exercise': return db.exercises.find(e => e.id === r.id)?.title ?? NOT_FOUND;
    case 'material': return 'Material';
    case 'question': {
      const e = db.exercises.find(x => x.id === r.exerciseId);
      if (!e) return NOT_FOUND;
      if (!r.questionId) return `Question ${e.questions.length + 1}`;
      const i = e.questions.findIndex(q => q.id === r.questionId);
      return i < 0 ? NOT_FOUND : `Question ${i + 1}`;
    }
    case 'assignToStudents':
    case 'assignToStudent': return 'Assign';
    case 'assignments': return 'Assignments';
    case 'assignment': {
      const a = db.assignments.find(x => x.id === r.id);
      if (!a) return NOT_FOUND;
      const s = db.students.find(x => x.id === a.studentId);
      const e = db.exercises.find(x => x.id === a.exerciseId);
      return `${s?.name} · ${e?.title}`;
    }
    case 'review': return 'Review';
  }
}
