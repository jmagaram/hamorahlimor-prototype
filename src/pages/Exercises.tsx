import { KINDS, materialSummary, publishProblem } from '../model/derived';
import { mmss } from '../model/format';
import { createExercise, deleteExercise, duplicateExercises, publishExercise, updateDraft, useDb } from '../model/store';
import type { ExerciseKind } from '../model/types';
import { back, go } from '../nav/nav';
import { ConfirmDrawer, DrawerShell, InputDrawer, PickDrawer } from '../ui/Drawer';
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
          <h3>{g.label} ({g.items.length})</h3>
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

const TIME_LIMITS = [5, 10, 15, 20, 30];

export function Exercise({ id }: { id: string }) {
  const db = useDb();
  const drawer = useDrawer();
  const e = db.exercises.find(x => x.id === id);
  if (!e) return <NotFound />;
  const draft = e.status === 'draft';
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
      {!draft && <p><i>Published: locked. Duplicate it to make changes.</i></p>}
      <Field label="Title" value={e.title} onClick={edit(() => drawer.open(
        <InputDrawer title="Title" initial={e.title} onDone={v => {
          if (!v.trim()) return 'Enter a title.';
          updateDraft(id, x => { x.title = v.trim(); });
        }} />))} />
      <Field label="Kind" value={KINDS[e.kind].label} />
      {e.kind !== 'speaking' && <Field label="Material" value={materialSummary(e)} onClick={() => go({ page: 'material', id })} />}
      <Field label="Time limit" value={e.timeLimit ? `${e.timeLimit} min` : 'No limit'} onClick={edit(() => drawer.open(
        <PickDrawer<number | undefined> title="Time limit for the whole exercise" current={e.timeLimit}
          options={[{ label: 'No limit', value: undefined }, ...TIME_LIMITS.map(m => ({ label: `${m} min`, value: m }))]}
          onPick={v => updateDraft(id, x => { if (v) x.timeLimit = v; else delete x.timeLimit; })} />))} />
      <Field label="Re-recording" value={e.allowRerecord ? 'Allowed' : 'One take only'} onClick={edit(() => drawer.open(
        <PickDrawer title="Re-recording" current={e.allowRerecord} options={[
          { label: 'Allowed', value: true, sub: 'Students can re-record an answer before submitting.' },
          { label: 'One take only', value: false, sub: 'Like the real exam.' },
        ]} onPick={v => updateDraft(id, x => { x.allowRerecord = v; })} />))} />
      <Field label="Status" value={draft ? 'Draft' : 'Published'} />

      <h3>Questions</h3>
      {e.questions.length ? e.questions.map((q, i) => (
        <Row key={q.id} label={`${i + 1}. ${q.promptText || '(audio only)'}`}
          sub={[q.promptAudio ? 'Audio prompt' : '', q.targetSeconds ? `Target ${mmss(q.targetSeconds)}` : ''].filter(Boolean).join(' · ')}
          onClick={() => go({ page: 'question', exerciseId: id, questionId: q.id })} />
      )) : <Empty>No questions yet.</Empty>}
      {draft && <p><ActionLink onClick={() => go({ page: 'question', exerciseId: id })}>+ Add question</ActionLink></p>}

      {!draft && <>
        <h3>Assigned to</h3>
        <GroupedAssignments assignments={db.assignments.filter(a => a.exerciseId === id)}
          label={a => db.students.find(s => s.id === a.studentId)?.name}
          sub={a => `${db.students.find(s => s.id === a.studentId)?.className} · due ${a.dueDate}`} />
      </>}

      <Footer buttons={draft ? [
        { label: 'Delete', onClick: () => drawer.open(<ConfirmDrawer title="Delete this draft?" message="This cannot be undone."
          confirmLabel="Delete" onConfirm={() => { back(); deleteExercise(id); }} />) },
        { label: 'Publish', onClick: publish },
      ] : [
        { label: 'Duplicate', onClick: () => go({ page: 'exercise', id: duplicateExercises([id])[0] }) },
        { label: 'Assign', onClick: () => go({ page: 'assignToStudents', exerciseId: id }) },
      ]} />
    </>
  );
}
