import { useState } from 'react';
import { audioSummary, clipRange, clipSummary, hasQuestionAudio, isEmptyDraft, MATERIAL_HEADING, QUESTION_MODES, questionModeLabel, KINDS, materialSummary, publishProblem } from '../model/derived';
import { minutes, mmss } from '../model/format';
import { addQuestion, createExercise, getDb, deleteExercise, duplicateExercises, publishExercise, updateDraft, useDb } from '../model/store';
import type { Exercise as ExerciseT, ExerciseKind, QuestionMode } from '../model/types';
import { back, go } from '../nav/nav';
import { ConfirmDrawer, DrawerShell, InputDrawer, MenuDrawer, PickDrawer } from '../ui/Drawer';
import { AudioDrawer } from '../ui/audio';
import { Badge } from '../ui/Badge';
import { useDrawer } from '../ui/drawerContext';
import { Footer } from '../ui/Footer';
import { AssignmentList } from '../ui/AssignmentList';
import { ActionLink, Empty, Facts, Field, Row } from '../ui/rows';
import { NotFound } from './NotFound';

export function Exercises() {
  const db = useDb();
  const drawer = useDrawer();
  const groups = (['draft', 'published'] as const).map(status => ({
    status, label: status === 'draft' ? 'Draft' : 'Published', items: db.exercises.filter(e => e.status === status),
  }));
  const newExercise = () => drawer.open(<NewExerciseDrawer />);
  return (
    <>
      {groups.map(g => (
        <section key={g.status}>
          <h3>{g.label}</h3>
          {g.items.length
            ? g.items.map(e => <ExerciseRow key={e.id} e={e} onClick={() => go({ page: 'exercise', id: e.id })} />)
            : <Empty>None</Empty>}
        </section>
      ))}
      <Footer buttons={[{ label: 'New exercise', onClick: newExercise }]} />
    </>
  );
}

/** An exercise in a list (Exercises, Choose exercise). */
export function ExerciseRow({ e, onClick }: { e: ExerciseT; onClick: () => void }) {
  const db = useDb();
  const assigned = db.assignments.filter(a => a.exerciseId === e.id).length;
  const sub = `${KINDS[e.kind].label} · ${e.questions.length} questions` + (e.status === 'published' ? ` · ${assigned} assigned` : '');
  return <Row label={e.title} sub={sub} onClick={onClick} />;
}

/** Pick a kind, then open the new draft. */
export function NewExerciseDrawer() {
  return (
    <PickDrawer<ExerciseKind> title="New exercise" showCurrent={false}
      options={(Object.keys(KINDS) as ExerciseKind[]).map(k => ({ label: KINDS[k].label, sub: KINDS[k].description, value: k }))}
      onPick={k => go({ page: 'exercise', id: createExercise(k) })} />
  );
}

const TIME_LIMITS = [1, 2, 3, 4, 5, 10, 15];

export function Exercise({ id }: { id: string }) {
  const db = useDb();
  const drawer = useDrawer();
  const e = db.exercises.find(x => x.id === id);
  if (!e) return <NotFound />;
  const draft = e.status === 'draft';
  if (!draft) return <LockedExercise e={e} />;
  const edit = (fn: () => void) => (draft ? fn : undefined);

  const publish = () => {
    const problem = publishProblem(e);
    if (problem) return drawer.open(<DrawerShell title="Can't publish yet"><p>{problem}</p></DrawerShell>);
    drawer.open(<ConfirmDrawer title="Publish exercise?" confirmLabel="Publish"
      message="Once published it is locked and can be assigned. To change it later, duplicate it."
      onConfirm={() => publishExercise(id)} />);
  };

  return (
    <>
      <h3>General</h3>
      <Field label="Title" value={e.title} onClick={edit(() => drawer.open(
        <InputDrawer title="Title" initial={e.title} onDone={v => {
          if (!v.trim()) return 'Enter a title.';
          updateDraft(id, x => { x.title = v.trim(); });
        }} />))} />
      <Field label="Time limit" value={e.timeLimit ? `${e.timeLimit} min` : 'No limit'} onClick={edit(() => drawer.open(
        <MenuDrawer<number | undefined> title="Time limit for the whole exercise"
          options={[{ label: 'No limit', value: undefined }, ...TIME_LIMITS.map(m => ({ label: `${m} min`, value: m }))]}
          onPick={v => updateDraft(id, x => { if (v) x.timeLimit = v; else delete x.timeLimit; })} />))} />
      <Field label="Re-recording" value={e.allowRerecord ? 'Allowed' : 'One take only'} onClick={edit(() => drawer.open(
        <MenuDrawer title="Re-recording" options={[
          { label: 'Allowed', value: true, sub: 'Students can re-record an answer before submitting.' },
          { label: 'One take only', value: false, sub: 'Like the real exam.' },
        ]} onPick={v => updateDraft(id, x => { x.allowRerecord = v; })} />))} />
      <Field label="Questions are" value={questionModeLabel(e.questionMode)} onClick={() => drawer.open(
        <MenuDrawer<QuestionMode> title="How students get each question"
          note="You always see the text when grading. When students hear the questions, every question needs audio."
          options={QUESTION_MODES} onPick={v => updateDraft(id, x => { x.questionMode = v; })} />)} />

      {e.kind !== 'speaking' && <h3>{MATERIAL_HEADING[e.kind]}</h3>}
      {e.kind === 'video' && <>
        <Field label="Video URL" value={e.material.url || 'Not provided'} onClick={() => drawer.open(
          <InputDrawer title="Video URL" type="url" initial={e.material.url} onDone={v => {
            updateDraft(id, x => { if (x.kind === 'video') x.material.url = v.trim(); });
          }} />)} />
        {e.material.url && <Field label="Clip" value={clipSummary(e.material)}
          onClick={() => drawer.open(<ClipDrawer id={id} />)} />}
      </>}
      {e.kind === 'listen' && (
        <Field label="Audio" value={audioSummary(e.material.audio)} onClick={() => drawer.open(
          <AudioDrawer title="Audio to listen to" value={e.material.audio} canDelete={false}
            onChange={clip => updateDraft(id, x => { if (x.kind === 'listen') x.material = clip ? { audio: clip } : {}; })} />)} />
      )}
      {e.kind === 'read' && (
        <Field label="Text" value={materialSummary(e)} onClick={() => go({ page: 'material', id })} />
      )}

      <h3>Questions</h3>
      {e.questions.length ? e.questions.map((q, i) => (
        <Row key={q.id} label={q.promptText ? `${i + 1}. ${q.promptText}` : <>{i + 1}. <Badge color="amber">No text yet</Badge></>}
          sub={[hasQuestionAudio(e) ? (q.promptAudio ? 'Audio recorded' : 'No audio yet') : '', q.targetSeconds ? `Target ${minutes(q.targetSeconds)}` : ''].filter(Boolean).join(' · ')}
          onClick={() => go({ page: 'question', exerciseId: id, questionId: q.id })} />
      )) : <Empty>No questions yet.</Empty>}
      <p><ActionLink onClick={() => go({ page: 'question', exerciseId: id, questionId: addQuestion(id) })}>Add question</ActionLink></p>

      <Footer buttons={[
        {
          // An empty draft goes without asking; leaving it would delete it anyway.
          label: 'Delete', onClick: () => isEmptyDraft(e) ? (back(), deleteExercise(id)) : drawer.open(
            <ConfirmDrawer title="Delete this draft?" message="This cannot be undone."
              confirmLabel="Delete" onConfirm={() => { back(); deleteExercise(id); }} />),
        },
        { label: 'Publish', onClick: publish },
      ]} />
    </>
  );
}

/** A published exercise, read-only and compact: what students get, then who it's assigned to. */
function LockedExercise({ e }: { e: ExerciseT }) {
  const db = useDb();
  const drawer = useDrawer();
  return (
    <>
      <p><small>Published exercises are locked. Duplicate it to make changes.</small></p>
      <Facts items={[
        ['Time limit', e.timeLimit ? `${e.timeLimit} min` : 'No limit'],
        ['Re-recording', e.allowRerecord ? 'Allowed' : 'One take only'],
        ['Questions are', questionModeLabel(e.questionMode)],
      ]} />

      {e.kind !== 'speaking' && <h3>{MATERIAL_HEADING[e.kind]}</h3>}
      {e.kind === 'video' && (
        <div className="thumb" role="button" tabIndex={0} onClick={() => drawer.open(
          <DrawerShell title="Video">
            <p>Students watch {clipRange(e.material)} of <a href={e.material.url} target="_blank" rel="noreferrer">this video</a>.</p>
          </DrawerShell>)}>
          <span className="thumb-play">{'\u25B6\uFE0E'}</span>
          <small>Tap to watch · {clipSummary(e.material)}</small>
        </div>
      )}
      {e.kind === 'read' && (
        <div className="card" role="button" tabIndex={0} onClick={() => drawer.open(
          <DrawerShell title="Text">
            <p style={{ whiteSpace: 'pre-wrap' }}>{e.material.text}</p>
          </DrawerShell>)}>
          {materialSummary(e)}
        </div>
      )}
      {e.kind === 'listen' && e.material.audio && (
        <div className="card" role="button" tabIndex={0} onClick={() => drawer.open(
          <AudioDrawer title="Audio to listen to" value={e.material.audio} readOnly />)}>
          {'\u25B6\uFE0E'} Recording · {mmss(e.material.audio.duration)}
        </div>
      )}

      <h3>Questions</h3>
      {e.questions.map((q, i) => {
        const audio = hasQuestionAudio(e) ? q.promptAudio : undefined;
        const open = audio ? () => drawer.open(
          <AudioDrawer title={`Question ${i + 1}`} value={audio} readOnly>
            {q.promptText && <p>{q.promptText}</p>}
          </AudioDrawer>) : undefined;
        return (
          <div key={q.id} className="card" {...(open && { role: 'button', tabIndex: 0, onClick: open })}>
            <small>Question {i + 1}</small><br />
            {q.promptText}
            {(audio || q.targetSeconds) && <><br /><small>
              {[audio && `\u25B6\uFE0E Audio ${mmss(audio.duration)}`, q.targetSeconds && `Target ${minutes(q.targetSeconds)}`].filter(Boolean).join(' · ')}
            </small></>}
          </div>
        );
      })}

      <h3>Assigned to</h3>
      <AssignmentList assignments={db.assignments.filter(a => a.exerciseId === e.id)}
        label={a => db.students.find(s => s.id === a.studentId)?.name}
        context={a => db.students.find(s => s.id === a.studentId)?.className} />

      <Footer buttons={[
        { label: 'Duplicate', onClick: () => go({ page: 'exercise', id: duplicateExercises([e.id])[0] }) },
        { label: 'Assign', onClick: () => go({ page: 'assign', exerciseId: e.id }) },
      ]} />
    </>
  );
}

/** Start and end of the part of the video students watch. Blank means the beginning or the end. */
function ClipDrawer({ id }: { id: string }) {
  const { close } = useDrawer();
  const [m] = useState(() => {
    const e = getDb().exercises.find(x => x.id === id);
    return e?.kind === 'video' ? e.material : { start: '', end: '' };
  });
  const [start, setStart] = useState(m.start ?? '');
  const [end, setEnd] = useState(m.end ?? '');
  const ok = () => {
    updateDraft(id, x => {
      if (x.kind !== 'video') return;
      if (start.trim()) x.material.start = start.trim(); else delete x.material.start;
      if (end.trim()) x.material.end = end.trim(); else delete x.material.end;
    });
    close();
  };
  return (
    <DrawerShell title="Clip" actions={<><button onClick={close}>Cancel</button><button onClick={ok}>OK</button></>}>
      <p>
        <label>Start <input size={6} placeholder="0:00" autoFocus value={start} onChange={ev => setStart(ev.target.value)} /></label>{' '}
        <label>End <input size={6} placeholder="end" value={end} onChange={ev => setEnd(ev.target.value)} /></label>
      </p>
      <p><small>Leave both blank for the whole video.</small></p>
    </DrawerShell>
  );
}
