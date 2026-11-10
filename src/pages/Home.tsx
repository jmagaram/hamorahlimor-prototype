import { displayStatus, isOverdue } from '../model/derived';
import { today } from '../model/format';
import { useDb } from '../model/store';
import { go } from '../nav/nav';
import { Row } from '../ui/rows';

export function Home() {
  const db = useDb();
  const needsReview = db.assignments.filter(a => displayStatus(db, a) === 'Needs review').length;
  const drafts = db.exercises.filter(e => e.status === 'draft').length;
  const overdue = db.assignments.filter(a => isOverdue(a, today())).length;
  const attention = [needsReview && `${needsReview} need review`, overdue && `${overdue} overdue`].filter(Boolean).join(' · ');
  return (
    <>
      <Row label="Exercises" sub={drafts ? `${drafts} ${drafts === 1 ? 'draft' : 'drafts'}` : undefined} onClick={() => go({ page: 'exercises' })} />
      <Row label="Students" onClick={() => go({ page: 'students' })} />
      <Row label="Assignments" sub={attention || undefined} onClick={() => go({ page: 'assignments' })} />
    </>
  );
}
