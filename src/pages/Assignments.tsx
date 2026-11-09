import { answerFor, displayStatus, feedbackFor, groupedOrder, hasComment, timeTaken } from '../model/derived';
import { addDays, formatTimestamp, mmss, today } from '../model/format';
import { setDueDate, unassign, useDb } from '../model/store';
import type { Answer, Question } from '../model/types';
import { back, go } from '../nav/nav';
import { PlayButton } from '../ui/audio';
import { ConfirmDrawer, InputDrawer } from '../ui/Drawer';
import { useDrawer } from '../ui/drawerContext';
import { Footer, type FooterButton } from '../ui/Footer';
import { GroupedAssignments } from '../ui/GroupedAssignments';
import { Field } from '../ui/rows';
import { SelectAllBar } from '../ui/selection';
import { useSelection } from '../ui/useSelection';
import { NotFound } from './NotFound';

const dueDateDrawer = (initial: string, apply: (v: string) => void) => (
  <InputDrawer title="Due date" type="date" initial={initial}
    onDone={v => { if (!v) return 'Choose a date.'; apply(v); }} />
);

export function Assignments() {
  const db = useDb();
  const drawer = useDrawer();
  const sel = useSelection();
  const student = (id: string) => db.students.find(s => s.id === id);
  const exercise = (id: string) => db.exercises.find(e => e.id === id);
  return (
    <>
      <SelectAllBar sel={sel} ids={groupedOrder(db, db.assignments)} />
      <GroupedAssignments assignments={db.assignments} sel={sel}
        label={a => `${student(a.studentId)?.name} · ${exercise(a.exerciseId)?.title}`}
        sub={a => [student(a.studentId)?.className, `due ${a.dueDate}`].filter(Boolean).join(' · ')} />
      <Footer buttons={sel.selecting ? [
        { label: 'Cancel', onClick: sel.cancel },
        {
          label: `Due date (${sel.count})`, disabled: !sel.count,
          onClick: () => drawer.open(dueDateDrawer(addDays(today(), 7), v => { setDueDate(sel.selected, v); sel.cancel(); })),
        },
        {
          label: `Unassign (${sel.count})`, disabled: !sel.count,
          onClick: () => drawer.open(<ConfirmDrawer title={`Unassign ${sel.count}?`} message="Any answers and feedback are deleted."
            confirmLabel="Unassign" onConfirm={() => { unassign(sel.selected); sel.cancel(); }} />),
        },
      ] : [{ label: 'Select', onClick: sel.start }]} />
    </>
  );
}

/** "▶ Play 1:12 / target 1:00 (over)", or "No answer yet". */
export function AnswerLine({ answer, question, none = 'No answer yet' }: { answer?: Answer; question: Question; none?: string }) {
  if (!answer) return <small>{none}</small>;
  const t = question.targetSeconds;
  return <><PlayButton /> {mmss(answer.duration)}{t ? ` / target ${mmss(t)}${answer.duration > t ? ' (over)' : ''}` : ''}</>;
}

export function Assignment({ id }: { id: string }) {
  const db = useDb();
  const drawer = useDrawer();
  const a = db.assignments.find(x => x.id === id);
  const s = db.students.find(x => x.id === a?.studentId);
  const e = db.exercises.find(x => x.id === a?.exerciseId);
  if (!a || !s || !e) return <NotFound />;
  const f = feedbackFor(db, id);

  const footer: FooterButton[] = [{
    label: 'Unassign',
    onClick: () => drawer.open(<ConfirmDrawer title="Unassign?" message="Any answers and feedback are deleted."
      confirmLabel="Unassign" onConfirm={() => { back(); unassign([id]); }} />),
  }];
  if (a.state === 'submitted') {
    footer.push({
      label: !f ? 'Review' : f.status === 'published' ? 'Edit feedback' : 'Continue review',
      onClick: () => go({ page: 'review', id }),
    });
  }

  return (
    <>
      <Field label="Student" value={s.className ? `${s.name} (${s.className})` : s.name} onClick={() => go({ page: 'student', id: s.id })} />
      <Field label="Exercise" value={e.title} onClick={() => go({ page: 'exercise', id: e.id })} />
      <Field label="Status" value={displayStatus(db, a)} />
      <Field label="Due" value={a.dueDate} onClick={() => drawer.open(dueDateDrawer(a.dueDate, v => setDueDate([id], v)))} />
      <Field label="Assigned" value={a.dateAssigned} />
      <Field label="Started" value={formatTimestamp(a.dateStarted)} />
      <Field label="Time taken" value={mmss(timeTaken(a)) + (e.timeLimit ? ` of ${e.timeLimit}:00` : '')} />
      <Field label="Submitted" value={formatTimestamp(a.dateSubmitted)} />

      <h3>Answers</h3>
      {e.questions.map((q, i) => {
        const c = f?.answerComments[q.id];
        return (
          <div key={q.id} className="row">
            <small>Q{i + 1}</small> {q.promptText || '(audio prompt)'}
            <br />
            <AnswerLine answer={answerFor(db, id, q.id)} question={q} />
            {hasComment(c) && <><br /><small>Your comment: {c.text}{c.audio && ' [audio]'}</small></>}
          </div>
        );
      })}

      <h3>Feedback</h3>
      {f ? (
        <p>
          {f.status === 'published' ? `Published ${formatTimestamp(f.datePublished)}` : 'Draft (student cannot see it)'}
          {hasComment(f.overall) && <><br /><small>Overall: {f.overall.text}{f.overall.audio && ' [audio]'}</small></>}
        </p>
      ) : <p><small>Not started.</small></p>}

      <Footer buttons={footer} />
    </>
  );
}
