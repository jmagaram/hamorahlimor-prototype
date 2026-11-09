import { useState, type ReactNode } from 'react';
import { clipRange, clipSummary, KINDS, materialSummary, publishProblem } from '../model/derived';
import { dueText, minutes, mmss } from '../model/format';
import { addQuestion, createExercise, getDb, deleteExercise, duplicateExercises, publishExercise, updateDraft, useDb } from '../model/store';
import type { Exercise as ExerciseT, ExerciseKind } from '../model/types';
import { back, go } from '../nav/nav';
import { ConfirmDrawer, DrawerShell, InputDrawer, MenuDrawer, PickDrawer } from '../ui/Drawer';
import { AudioDrawer } from '../ui/audio';
import { useDrawer } from '../ui/drawerContext';
import { Footer } from '../ui/Footer';
import { GroupedAssignments } from '../ui/GroupedAssignments';
import { ActionLink, Empty, Field, Row } from '../ui/rows';
import { SelectAllBar, SelectableRow } from '../ui/selection';
import { useSelection } from '../ui/useSelection';
import { NotFound } from './NotFound';

export function Exercises() {
  const db = useDb();
  const drawer = useDrawer();
  const sel = useSelection();
  const groups = (['draft', 'published'] as const).map(status => ({
    status, label: status === 'draft' ? 'Draft' : 'Published', items: db.exercises.filter(e => e.status === status),
  }));
  const ids = groups.flatMap(g => g.items.map(e => e.id));
  const newExercise = () => drawer.open(
    <PickDrawer<ExerciseKind> title="New exercise" showCurrent={false}
      options={(Object.keys(KINDS) as ExerciseKind[]).map(k => ({ label: KINDS[k].label, sub: KINDS[k].description, value: k }))}
      onPick={k => go({ page: 'exercise', id: createExercise(k) })} />,
  );
  return (
    <>
      <SelectAllBar sel={sel} ids={ids} />
      {groups.map(g => (
        <section key={g.status}>
          <h3>{g.label}</h3>
          {g.items.length ? g.items.map(e => {
            const assigned = db.assignments.filter(a => a.exerciseId === e.id).length;
            const sub = `${KINDS[e.kind].label} · ${e.questions.length} questions` + (g.status === 'published' ? ` · ${assigned} assigned` : '');
            return <SelectableRow key={e.id} sel={sel} id={e.id} label={e.title} sub={sub} onClick={() => go({ page: 'exercise', id: e.id })} />;
          }) : <Empty>None</Empty>}
        </section>
      ))}
      <Footer buttons={sel.selecting ? [
        { label: 'Cancel', onClick: sel.cancel },
        { label: `Duplicate (${sel.count})`, disabled: !sel.count, onClick: () => { duplicateExercises(sel.selected); sel.cancel(); } },
      ] : [
        { label: 'Select', onClick: sel.start },
        { label: 'New exercise', onClick: newExercise },
      ]} />
    </>
  );
}

const TIME_LIMITS = [1, 2, 3, 4, 5, 10, 15];

/** The sentence under an exercise's heading that says what kind it is. */
const ABOUT_KIND: Record<ExerciseKind, ReactNode> = {
  video: <>An exercise for watching a <b>video</b> and answering questions about it.</>,
  read: <>An exercise for reading a <b>text</b> and answering questions about it.</>,
  listen: <>An exercise for listening to a <b>recording</b> and answering questions about it.</>,
  speaking: <>An exercise for answering <b>speaking questions</b> out loud.</>,
};

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
      <p>
        {ABOUT_KIND[e.kind]}{' '}
        This is a <b>draft</b>.
      </p>
      <Field label="Title" value={e.title} onClick={edit(() => drawer.open(
        <InputDrawer title="Title" initial={e.title} onDone={v => {
          if (!v.trim()) return 'Enter a title.';
          updateDraft(id, x => { x.title = v.trim(); });
        }} />))} />
      {e.kind === 'video' && <>
        <Field label="Video URL" value={e.material.url || 'Not set'} onClick={edit(() => drawer.open(
          <InputDrawer title="Video URL" type="url" initial={e.material.url} onDone={v => {
            updateDraft(id, x => { if (x.kind === 'video') x.material.url = v.trim(); });
          }} />))} />
        {e.material.url && <Field label="Clip" value={clipSummary(e.material)}
          onClick={edit(() => drawer.open(<ClipDrawer id={id} />))} />}
      </>}
      {(e.kind === 'read' || e.kind === 'listen') &&
        <Field label="Material" value={materialSummary(e)} onClick={() => go({ page: 'material', id })} />}
      <Field label="Time limit" value={e.timeLimit ? `${e.timeLimit} min` : 'No limit'} onClick={edit(() => drawer.open(
        <MenuDrawer<number | undefined> title="Time limit for the whole exercise"
          options={[{ label: 'No limit', value: undefined }, ...TIME_LIMITS.map(m => ({ label: `${m} min`, value: m }))]}
          onPick={v => updateDraft(id, x => { if (v) x.timeLimit = v; else delete x.timeLimit; })} />))} />
      <Field label="Re-recording" value={e.allowRerecord ? 'Allowed' : 'One take only'} onClick={edit(() => drawer.open(
        <MenuDrawer title="Re-recording" options={[
          { label: 'Allowed', value: true, sub: 'Students can re-record an answer before submitting.' },
          { label: 'One take only', value: false, sub: 'Like the real exam.' },
        ]} onPick={v => updateDraft(id, x => { x.allowRerecord = v; })} />))} />

      <h3>Questions</h3>
      {e.questions.length ? e.questions.map((q, i) => (
        <Row key={q.id} label={`${i + 1}. ${q.promptText || (q.promptAudio ? '(audio only)' : 'No prompt yet')}`}
          sub={[q.promptAudio ? 'Audio prompt' : '', q.targetSeconds ? `Target ${minutes(q.targetSeconds)}` : ''].filter(Boolean).join(' · ')}
          onClick={() => go({ page: 'question', exerciseId: id, questionId: q.id })} />
      )) : <Empty>No questions yet.</Empty>}
      <p><ActionLink onClick={() => go({ page: 'question', exerciseId: id, questionId: addQuestion(id) })}>Add question</ActionLink></p>

      <Footer buttons={[
        { label: 'Delete', onClick: () => drawer.open(<ConfirmDrawer title="Delete this draft?" message="This cannot be undone."
          confirmLabel="Delete" onConfirm={() => { back(); deleteExercise(id); }} />) },
        { label: 'Publish', onClick: publish },
        { label: 'Done', onClick: back },
      ]} />
    </>
  );
}

/** The heading over a locked exercise's material and questions. */
const CONTENT_HEADING: Record<ExerciseKind, string> = {
  video: 'Video and questions',
  read: 'Text and questions',
  listen: 'Recording and questions',
  speaking: 'Questions',
};

/** A published exercise, read-only and compact: what students get, then who it's assigned to. */
function LockedExercise({ e }: { e: ExerciseT }) {
  const db = useDb();
  const drawer = useDrawer();
  return (
    <>
      <p>{ABOUT_KIND[e.kind]} It is <b>published</b>, so it's locked. Duplicate it to make changes.</p>
      <p>
        Time limit: {e.timeLimit ? `${e.timeLimit} min` : 'No limit'}<br />
        Re-recording: {e.allowRerecord ? 'Allowed' : 'One take only'}
      </p>

      <h3>{CONTENT_HEADING[e.kind]}</h3>
      {e.kind === 'video' && (
        <div className="thumb" role="button" tabIndex={0} onClick={() => drawer.open(
          <DrawerShell title="Video" actions={<button onClick={drawer.close}>Done</button>}>
            <p>Students watch {clipRange(e.material)} of <a href={e.material.url} target="_blank" rel="noreferrer">this video</a>.</p>
          </DrawerShell>)}>
          <span className="thumb-play">{'\u25B6\uFE0E'}</span>
          <small>Tap to watch · {clipSummary(e.material)}</small>
        </div>
      )}
      {e.kind === 'read' && (
        <div className="card" role="button" tabIndex={0} onClick={() => drawer.open(
          <DrawerShell title="Text" actions={<button onClick={drawer.close}>Done</button>}>
            <p style={{ whiteSpace: 'pre-wrap' }}>{e.material.text}</p>
          </DrawerShell>)}>
          {materialSummary(e)}
        </div>
      )}
      {e.kind === 'listen' && e.material.audio && (
        <div className="card" role="button" tabIndex={0} onClick={() => drawer.open(
          <AudioDrawer title="Recording" value={e.material.audio} readOnly>
            {e.material.sourceText && <p><small>{e.material.sourceText}</small></p>}
          </AudioDrawer>)}>
          {'\u25B6\uFE0E'} Recording · {mmss(e.material.audio.duration)}
        </div>
      )}

      {e.questions.map((q, i) => {
        const open = q.promptAudio ? () => drawer.open(
          <AudioDrawer title={`Question ${i + 1}`} value={q.promptAudio} readOnly>
            {q.promptText && <p>{q.promptText}</p>}
          </AudioDrawer>) : undefined;
        return (
          <div key={q.id} className="card" {...(open && { role: 'button', tabIndex: 0, onClick: open })}>
            <small>Question {i + 1}</small><br />
            {q.promptText}
            {(q.promptAudio || q.targetSeconds) && <><br /><small>
              {[q.promptAudio && `\u25B6\uFE0E Audio ${mmss(q.promptAudio.duration)}`, q.targetSeconds && `Target ${minutes(q.targetSeconds)}`].filter(Boolean).join(' · ')}
            </small></>}
          </div>
        );
      })}

      <h3>Assigned to</h3>
      <GroupedAssignments nested assignments={db.assignments.filter(a => a.exerciseId === e.id)}
        label={a => db.students.find(s => s.id === a.studentId)?.name}
        sub={a => [db.students.find(s => s.id === a.studentId)?.className, dueText(a.dueDate)].filter(Boolean).join(' · ')} />

      <Footer buttons={[
        { label: 'Duplicate', onClick: () => go({ page: 'exercise', id: duplicateExercises([e.id])[0] }) },
        { label: 'Assign', onClick: () => go({ page: 'assignToStudents', exerciseId: e.id }) },
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
