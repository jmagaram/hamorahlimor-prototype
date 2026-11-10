import { feedbackFor, isOpen, isOverdue } from '../model/derived';
import { dueText, formatTimestamp, friendlyDayInline, today } from '../model/format';
import { useSession } from '../model/session';
import { useDb } from '../model/store';
import type { Assignment } from '../model/types';
import { go } from '../nav/nav';
import { Badge } from '../ui/Badge';
import { Empty, Row } from '../ui/rows';

/**
 * The student's Home: To do (unfinished, due soonest first) and Done (submitted, newest first).
 * Rows open the assignment.
 */
export function StudentHome() {
  const db = useDb();
  const session = useSession();
  const studentId = session?.role === 'student' ? session.studentId : '';
  const t = today();
  const mine = db.assignments.filter(a => a.studentId === studentId);
  const title = (a: Assignment) => db.exercises.find(e => e.id === a.exerciseId)?.title;
  const toDo = mine.filter(isOpen)
    .sort((x, y) => (x.dueDate ?? '9999').localeCompare(y.dueDate ?? '9999') || x.dateAssigned.localeCompare(y.dateAssigned));
  const done = mine.filter(a => !isOpen(a))
    .sort((x, y) => (y.dateSubmitted ?? '').localeCompare(x.dateSubmitted ?? ''));

  return (
    <>
      <h3>To do</h3>
      {toDo.length ? toDo.map(a => (
        <Row key={a.id} label={title(a)} onClick={() => go({ page: 'work', id: a.id })} sub={<>
          {isOverdue(a, t) && <><Badge color="red">Overdue</Badge> </>}
          {a.state === 'active' && <><Badge color="blue">In progress</Badge> </>}
          {a.state === 'paused' && <><Badge>Paused</Badge> </>}
          {dueText(a.dueDate) || 'No due date'}
        </>} />
      )) : <Empty>Nothing to do right now.</Empty>}

      <h3>Done</h3>
      {done.length ? done.map(a => {
        const f = feedbackFor(db, a.id);
        const submitted = a.dateSubmitted ? `submitted ${friendlyDayInline(formatTimestamp(a.dateSubmitted))}` : '';
        return (
          <Row key={a.id} label={title(a)} onClick={() => go({ page: 'work', id: a.id })} sub={
            f?.status !== 'published' ? `Waiting for feedback · ${submitted}`
              : !f.dateSeen ? <><Badge color="blue">New feedback</Badge> {submitted}</>
                : submitted.replace(/^s/, 'S')
          } />
        );
      }) : <Empty>Nothing yet.</Empty>}
    </>
  );
}
