import { useEffect, useReducer } from 'react';
import { answerFor, clipRange, feedbackFor, KINDS, MATERIAL_HEADING, timeTaken } from '../model/derived';
import { formatTimestamp, friendlyDay, minutes, mmss } from '../model/format';
import { markFeedbackSeen, pauseAssignment, setAnswer, startAssignment, submitAssignment, useDb } from '../model/store';
import { back, go } from '../nav/nav';
import type { Assignment, Comment, Exercise, Feedback } from '../model/types';
import { AudioDrawer } from '../ui/audio';
import { Badge } from '../ui/Badge';
import { ConfirmDrawer, DrawerShell } from '../ui/Drawer';
import { useDrawer } from '../ui/drawerContext';
import { CommentView } from '../ui/FeedbackRows';
import { Footer } from '../ui/Footer';
import { PLAY, useTicker } from '../ui/media';
import { Facts, Field, Row } from '../ui/rows';
import { NotFound } from './NotFound';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** One line on what the student will do, from the exercise's kind. */
function whatToDo(e: Exercise): string {
  const answer = `answer ${plural(e.questions.length, 'question')} out loud`;
  switch (e.kind) {
    case 'video': return `Watch the video, then ${answer}.`;
    case 'listen': return `Listen to the recording, then ${answer}.`;
    case 'read': return `Read the text, then ${answer}.`;
    case 'speaking': return `${answer[0].toUpperCase()}${answer.slice(1)}.`;
  }
}

/**
 * The student's assignment. Not started or paused: a summary and Start/Resume. Active: everything
 * unfolds (material, then each question with its answer), with Pause and Submit; the clock is in
 * the kicker line (WorkKicker). Submitted: the same, read-only, with the teacher's feedback once published.
 */
export function StudentAssignment({ id }: { id: string }) {
  const db = useDb();
  const a = db.assignments.find(x => x.id === id);
  const e = db.exercises.find(x => x.id === a?.exerciseId);
  if (!a || !e) return <NotFound />;
  if (a.state === 'active') return <Working a={a} e={e} />;
  if (a.state === 'submitted') return <Submitted a={a} e={e} />;
  return <Summary a={a} e={e} />;
}

function Summary({ a, e }: { a: Assignment; e: Exercise }) {
  const limit = e.timeLimit ? e.timeLimit * 60 : undefined;
  return (
    <>
      <p>{whatToDo(e)}</p>
      <Facts items={[
        ['Due', a.dueDate && friendlyDay(a.dueDate)],
        ['Time limit', e.timeLimit ? `${e.timeLimit} min` : 'None'],
        ['Re-recording', e.allowRerecord ? 'Allowed' : 'One take only'],
        ['Time used', a.dateStarted && `${mmss(timeTaken(a))}${limit ? ` of ${mmss(limit)}` : ''}`],
      ]} />
      {limit && !a.dateStarted && <p><small>The clock starts when you tap Start. You can pause it, and keep going past the time limit if you need to.</small></p>}
      <Footer buttons={[{ label: a.dateStarted ? 'Resume' : 'Start', onClick: () => startAssignment(a.id) }]} />
    </>
  );
}

function Working({ a, e }: { a: Assignment; e: Exercise }) {
  const db = useDb();
  const drawer = useDrawer();
  const missing = e.questions.filter(q => !answerFor(db, a.id, q.id)).length;
  const submit = () => drawer.open(<ConfirmDrawer title="Submit?" confirmLabel="Submit"
    message={`${missing ? `${plural(missing, 'question')} ${missing === 1 ? 'has' : 'have'} no answer. ` : ''}You can't change your answers after.`}
    onConfirm={() => { submitAssignment(a.id); back(); }} />);

  return (
    <>
      <Material e={e} />
      <Questions a={a} e={e} canRecord />
      <Footer buttons={[
        { label: 'Pause', onClick: () => { pauseAssignment(a.id); back(); } },
        { label: 'Submit', onClick: submit },
      ]} />
    </>
  );
}

/**
 * The line above the heading: the kind, and while working with a time limit, the clock.
 * The limit is soft: past it the clock keeps going and says how far over.
 */
export function WorkKicker({ id }: { id: string }) {
  const db = useDb();
  const [, tick] = useReducer((n: number) => n + 1, 0);
  const a = db.assignments.find(x => x.id === id);
  const e = db.exercises.find(x => x.id === a?.exerciseId);
  const active = a?.state === 'active';
  useTicker(active, tick);
  if (!a || !e) return null;
  const kind = KINDS[e.kind].kicker;
  if (!active || !e.timeLimit) return <p className="kicker">{kind}</p>;
  const limit = e.timeLimit * 60;
  const t = timeTaken(a);
  return (
    <p className="kicker">{kind} · {mmss(t)} of {mmss(limit)}
      {t > limit && <> <Badge color="amber">{mmss(t - limit)} over</Badge></>}
    </p>
  );
}

function Submitted({ a, e }: { a: Assignment; e: Exercise }) {
  const db = useDb();
  const f = feedbackFor(db, a.id);
  const published = f?.status === 'published' ? f : undefined;
  // Opening it is what makes "New feedback" go away on Home.
  useEffect(() => { if (published) markFeedbackSeen(a.id); }, [a.id, published]);
  return (
    <>
      <Facts items={[
        ['Submitted', a.dateSubmitted && friendlyDay(formatTimestamp(a.dateSubmitted))],
        ['Time taken', mmss(a.secondsTaken)],
      ]} />
      {!published && <p>Waiting for feedback from your teacher.</p>}
      <Material e={e} />
      <Questions a={a} e={e} feedback={published} />
      {published && hasContent(published.overall) && <>
        <h3>Overall feedback</h3>
        <CommentView c={published.overall} title="Overall feedback" />
      </>}
    </>
  );
}

const hasContent = (c: Comment) => !!(c.text || c.audio);

/** The exercise's material: a video to open, audio to play, or the text itself. */
function Material({ e }: { e: Exercise }) {
  const drawer = useDrawer();
  if (e.kind === 'speaking') return null;
  return <>
    <h3>{MATERIAL_HEADING[e.kind]}</h3>
    {e.kind === 'video' && (
      <div className="thumb" role="button" tabIndex={0} onClick={() => drawer.open(
        <DrawerShell title="Video to watch">
          <p>Watch {clipRange(e.material)} of <a href={e.material.url} target="_blank" rel="noreferrer">this video</a>.</p>
        </DrawerShell>)}>
        <span className="thumb-play">{PLAY}</span>
        <small>Watch {clipRange(e.material)}</small>
      </div>
    )}
    {e.kind === 'listen' && e.material.audio && (
      <Field label="Recording" value={`${PLAY} ${mmss(e.material.audio.duration)}`} onClick={() => drawer.open(
        <AudioDrawer title="Audio to listen to" value={e.material.audio} readOnly autoPlay />)} />
    )}
    {e.kind === 'read' && <p style={{ whiteSpace: 'pre-wrap' }}>{e.material.text}</p>}
  </>;
}

/** Each question (read and/or heard, per the exercise) and the student's answer. */
function Questions({ a, e, canRecord = false, feedback }: { a: Assignment; e: Exercise; canRecord?: boolean; feedback?: Feedback }) {
  const db = useDb();
  const drawer = useDrawer();
  const read = e.questionMode !== 'hear';
  const hear = e.questionMode !== 'read';
  return <>
    {e.questions.map((q, i) => {
      const n = i + 1;
      const ans = answerFor(db, a.id, q.id);
      const clip = ans && { path: ans.recording, duration: ans.duration };
      const t = q.targetSeconds;
      const af = feedback?.answerFeedback[q.id];
      // One take only: once recorded, it can only be played.
      const locked = !canRecord || (!!clip && !e.allowRerecord);
      return (
        <section key={q.id}>
          <h3>Question {n}</h3>
          {read && <p>{q.promptText}</p>}
          {hear && q.promptAudio && (
            <Field label={read ? 'Hear the question' : 'The question'} value={`${PLAY} ${mmss(q.promptAudio.duration)}`}
              onClick={() => drawer.open(<AudioDrawer title={`Question ${n}`} value={q.promptAudio} readOnly autoPlay />)} />
          )}
          <Field label="Your answer" value={clip
            ? <>Recorded · {mmss(clip.duration)}{t && <> (target {minutes(t)})</>}{t && clip.duration > t && <> <Badge color="amber">Over target</Badge></>}</>
            : <>Not recorded yet{t && <> (target {minutes(t)})</>}</>}
            onClick={clip || canRecord ? () => drawer.open(
              <AudioDrawer title={`Your answer to question ${n}`} value={clip} readOnly={locked} autoPlay={locked} target={t}
                canDelete={e.allowRerecord} canReplace={e.allowRerecord} onChange={c => setAnswer(a.id, q.id, c)} />) : undefined} />
          {/* The teacher's feedback on this answer, all in one place: the answer with its comments along it. */}
          {af && <Row label={<>Teacher comments{!af.dateSeen && <> <Badge color="blue">Unread</Badge></>}</>}
            onClick={() => go({ page: 'myFeedback', assignmentId: a.id, questionId: q.id })} />}
        </section>
      );
    })}
  </>;
}
