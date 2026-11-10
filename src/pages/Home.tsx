import { displayStatus } from '../model/derived';
import { useDb } from '../model/store';
import { go } from '../nav/nav';
import { Row } from '../ui/rows';

export function Home() {
  const db = useDb();
  const needsReview = db.assignments.filter(a => displayStatus(db, a) === 'Needs review').length;
  return (
    <>
      <Row label="Exercises" onClick={() => go({ page: 'exercises' })} />
      <Row label="Students" onClick={() => go({ page: 'students' })} />
      <Row label="Assignments" sub={needsReview ? `${needsReview} need review` : undefined} onClick={() => go({ page: 'assignments' })} />
    </>
  );
}
