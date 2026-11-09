import { displayStatus } from '../model/derived';
import { useDb } from '../model/store';
import { go } from '../nav/nav';
import { Row } from '../ui/rows';

export function Home() {
  const db = useDb();
  const needsReview = db.assignments.filter(a => displayStatus(db, a) === 'Needs review').length;
  return (
    <>
      <Row label="Needs review" sub={`${needsReview} submitted, waiting for feedback`} onClick={() => go({ page: 'assignments' })} />
      <Row label="Exercises" onClick={() => go({ page: 'exercises' })} />
      <Row label="Students" onClick={() => go({ page: 'students' })} />
      <Row label="Assignments" onClick={() => go({ page: 'assignments' })} />
    </>
  );
}
