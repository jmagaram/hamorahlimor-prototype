import { displayStatus } from '../model/derived';
import { useDb } from '../model/store';
import { go } from '../nav/nav';
import { Row } from '../ui/rows';

export function Home() {
  const db = useDb();
  const needsReview = db.assignments.filter(a => displayStatus(db, a) === 'Needs review').length;
  return (
    <>
      <h2>English practice</h2>
      <Row label="Needs review" sub={`${needsReview} submitted, waiting for feedback`} onClick={() => go({ page: 'assignments' })} />
      <Row label="Exercises" sub={`${db.exercises.length} exercises`} onClick={() => go({ page: 'exercises' })} />
      <Row label="Students" sub={`${db.students.length} students`} onClick={() => go({ page: 'students' })} />
      <Row label="Assignments" sub={`${db.assignments.length} assignments`} onClick={() => go({ page: 'assignments' })} />
      <Row label="Classes" sub={db.classes.map(c => c.name).join(', ')} onClick={() => go({ page: 'classes' })} />
    </>
  );
}
