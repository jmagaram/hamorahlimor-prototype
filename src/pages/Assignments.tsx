import { answerFeedbackSummary, answerFor, audioSummary, hasQuestionAudio, clipRange, clipSummary, feedbackFor, groupedOrder, materialSummary, MATERIAL_HEADING, timeTaken } from '../model/derived';
import { daysBetween, dueText, friendlyDay, formatTimestamp, minutes, mmss } from '../model/format';
import { publishFeedback, setDueDate, unassign, useDb } from '../model/store';
import type { Assignment as AssignmentT, Exercise as ExerciseT } from '../model/types';
import { back, go, linkTo } from '../nav/nav';
import { AudioDrawer } from '../ui/audio';
import { PLAY } from '../ui/media';
import { Badge } from '../ui/Badge';
import { ConfirmDrawer, DrawerShell } from '../ui/Drawer';
import { DueDateDrawer } from '../ui/DueDateDrawer';
import { useDrawer } from '../ui/drawerContext';
import { Footer, type FooterButton } from '../ui/Footer';
import { GroupedAssignments } from '../ui/GroupedAssignments';
import { FeedbackRows } from '../ui/FeedbackRows';
import { Facts, Field } from '../ui/rows';
import { SelectAllBar } from '../ui/selection';
import { useSelection } from '../ui/useSelection';
import { NotFound } from './NotFound';

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
        sub={a => [student(a.studentId)?.className, dueText(a.dueDate)].filter(Boolean).join(' · ')} />
      <Footer buttons={sel.selecting ? [
        { label: 'Cancel', onClick: sel.cancel },
        {
          label: `Due date (${sel.count})`, disabled: !sel.count,
          onClick: () => drawer.open(<DueDateDrawer onPick={v => { setDueDate(sel.selected, v); sel.cancel(); }} />),
        },
        {
          label: `Unassign (${sel.count})`, disabled: !sel.count,
          onClick: () => drawer.open(<ConfirmDrawer title={`Unassign ${sel.count}?`} message="Any answers and feedback are deleted."
            confirmLabel="Unassign" onConfirm={() => { unassign(sel.selected); sel.cancel(); }} />),
        },
      ] : [{ label: 'Select', onClick: sel.start }, { label: 'New assignment', onClick: () => go({ page: 'assign' }) }]} />
    </>
  );
}

/** "On time" or "2 days late" after the submitted date; nothing without a due date. */
function Lateness({ a }: { a: AssignmentT }) {
  if (!a.dueDate || !a.dateSubmitted) return null;
  const late = daysBetween(a.dueDate, formatTimestamp(a.dateSubmitted));
  return late > 0
    ? <Badge color="amber">{late === 1 ? '1 day late' : `${late} days late`}</Badge>
    : <Badge color="green">On time</Badge>;
}

/** The exercise's material, so the teacher can check what the student responded to. Opens play-only. */
function MaterialRow({ e }: { e: ExerciseT }) {
  const drawer = useDrawer();
  if (e.kind === 'video') return <Field label="Video" value={clipSummary(e.material)} onClick={() => drawer.open(
    <DrawerShell title="Video to watch">
      <p>Students watch {clipRange(e.material)} of <a href={e.material.url} target="_blank" rel="noreferrer">this video</a>.</p>
    </DrawerShell>)} />;
  if (e.kind === 'listen') return <Field label="Audio" value={audioSummary(e.material.audio)} onClick={e.material.audio && (() => drawer.open(
    <AudioDrawer title="Audio to listen to" value={e.material.audio} readOnly autoPlay />))} />;
  if (e.kind === 'read') return <Field label="Text" value={materialSummary(e)} onClick={() => drawer.open(
    <DrawerShell title="Text to read"><p style={{ whiteSpace: 'pre-wrap' }}>{e.material.text}</p></DrawerShell>)} />;
  return null;
}

export function Assignment({ id }: { id: string }) {
  const db = useDb();
  const drawer = useDrawer();
  const a = db.assignments.find(x => x.id === id);
  const s = db.students.find(x => x.id === a?.studentId);
  const e = db.exercises.find(x => x.id === a?.exerciseId);
  if (!a || !s || !e) return <NotFound />;
  const f = feedbackFor(db, id);
  const submitted = a.state === 'submitted';
  const first = s.name.split(' ')[0];

  const footer: FooterButton[] = [{
    label: 'Unassign',
    onClick: () => drawer.open(<ConfirmDrawer title="Unassign?" message="Any answers and feedback are deleted."
      confirmLabel="Unassign" onConfirm={() => { back(); unassign([id]); }} />),
  }];
  if (submitted && f?.status !== 'published') {
    footer.push({
      label: 'Publish',
      onClick: () => drawer.open(f
        ? <ConfirmDrawer title="Publish feedback?" message={`${first} will see all of it. Later changes reach ${first} right away.`}
            confirmLabel="Publish" onConfirm={() => publishFeedback(id)} />
        : <DrawerShell title="Nothing to publish yet"><p>Add some feedback first.</p></DrawerShell>),
    });
  }

  return (
    <>
      <Field label="Student" value={s.className ? `${s.name} (${s.className})` : s.name} onClick={linkTo({ page: 'student', id: s.id })} />
      <Field label="Exercise" value={e.title} onClick={linkTo({ page: 'exercise', id: e.id })} />
      {/* Once submitted, the due date can't matter anymore: it moves into the facts. */}
      {!submitted && <Field label="Due" value={a.dueDate ? friendlyDay(a.dueDate) : 'No due date'}
        onClick={() => drawer.open(<DueDateDrawer onPick={v => setDueDate([id], v)} />)} />}
      <Facts items={[
        ['Due', submitted && a.dueDate && friendlyDay(a.dueDate)],
        ['Assigned', friendlyDay(a.dateAssigned)],
        ['Started', a.dateStarted && friendlyDay(formatTimestamp(a.dateStarted))],
        ['Time taken', a.dateStarted && mmss(timeTaken(a)) + (e.timeLimit ? ` of ${e.timeLimit}:00` : '')],
        ['Submitted', a.dateSubmitted && <>{friendlyDay(formatTimestamp(a.dateSubmitted))} <Lateness a={a} /></>],
        ['Feedback', f && (f.status === 'published'
          ? `Published ${f.datePublished ? friendlyDay(formatTimestamp(f.datePublished)) : ''}`
          : `Draft, ${first} can't see it yet`)],
      ]} />

      {e.kind !== 'speaking' && <>
        <h3>{MATERIAL_HEADING[e.kind]}</h3>
        <MaterialRow e={e} />
      </>}

      {e.questions.map((q, i) => {
        const answer = answerFor(db, id, q.id);
        const n = i + 1;
        const audio = hasQuestionAudio(e) ? q.promptAudio : undefined;
        const t = q.targetSeconds;
        return (
          <section key={q.id}>
            <h3>Question {n}</h3>
            <Field label="Question" value={<>
              {q.promptText || 'Audio only'}
              {audio && <><br /><small>{PLAY} Audio {mmss(audio.duration)}</small></>}
            </>} onClick={audio && (() => drawer.open(
              <AudioDrawer title={`Question ${n}`} value={audio} readOnly autoPlay>
                {q.promptText && <p>{q.promptText}</p>}
              </AudioDrawer>))} />
            <Field label={`${first}'s answer`} value={answer
              ? <>{PLAY} {mmss(answer.duration)}{t ? ` / target ${minutes(t)}` : ''}{t && answer.duration > t && <> <Badge color="amber">Over target</Badge></>}</>
              : 'No answer yet'}
              onClick={answer && (() => drawer.open(
                <AudioDrawer title={`${first}'s answer to question ${n}`} value={{ path: answer.recording, duration: answer.duration }} readOnly autoPlay />))} />
            {submitted && answer && <Field label="Your feedback" value={answerFeedbackSummary(f?.answerFeedback[q.id])}
              onClick={() => go({ page: 'answerFeedback', assignmentId: id, questionId: q.id })} />}
          </section>
        );
      })}

      {submitted && <section>
        <h3>Overall feedback</h3>
        <FeedbackRows assignmentId={id} place="overall" c={f?.overall ?? {}} what="the whole exercise" />
      </section>}

      <Footer buttons={footer} />
    </>
  );
}
