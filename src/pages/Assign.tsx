import { useState } from 'react';
import { KINDS, studentGroups } from '../model/derived';
import { dayLabel } from '../model/format';
import { assign, useDb } from '../model/store';
import { back } from '../nav/nav';
import { DueDateDrawer } from '../ui/DueDateDrawer';
import { useDrawer } from '../ui/drawerContext';
import { Footer } from '../ui/Footer';
import { Field } from '../ui/rows';
import { NotFound } from './NotFound';

/** The due date for the new assignments: a row that opens the due date menu. */
function DueDate({ value, onChange }: { value: string | undefined; onChange: (v: string | undefined) => void }) {
  const drawer = useDrawer();
  return <Field label="Due date" value={value ? dayLabel(value) : 'No due date'}
    onClick={() => drawer.open(<DueDateDrawer onPick={onChange} />)} />;
}

/** From an exercise: pick students. */
export function AssignToStudents({ exerciseId }: { exerciseId: string }) {
  const db = useDb();
  const [due, setDue] = useState<string | undefined>();
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  const [error, setError] = useState('');
  const e = db.exercises.find(x => x.id === exerciseId);
  if (!e || e.status !== 'published') return <NotFound />;

  const already = new Set(db.assignments.filter(a => a.exerciseId === e.id).map(a => a.studentId));
  const toggle = (ids: string[], on: boolean) => setPicked(p => {
    const n = new Set(p);
    ids.forEach(id => (on ? n.add(id) : n.delete(id)));
    return n;
  });
  const ok = () => {
    if (!picked.size) return setError('Choose at least one student.');
    assign(picked, e.id, due);
    back();
  };

  return (
    <>
      <p>Exercise: <b>{e.title}</b></p>
      <DueDate value={due} onChange={setDue} />
      <p>Choose students. Tick a class to select all of it.</p>
      {studentGroups(db).map(g => {
        const students = g.students;
        const free = students.filter(s => !already.has(s.id)).map(s => s.id);
        const all = free.length > 0 && free.every(id => picked.has(id));
        return (
          <section key={g.label}>
            <h3><label>
              <input type="checkbox" disabled={!free.length} checked={all} onChange={ev => toggle(free, ev.target.checked)} /> {g.label}
            </label></h3>
            {students.map(s => (
              <label key={s.id} className="row">
                <input type="checkbox" disabled={already.has(s.id)} checked={picked.has(s.id)}
                  onChange={ev => toggle([s.id], ev.target.checked)} /> {s.name}
                {already.has(s.id) && <small> (already assigned)</small>}
              </label>
            ))}
          </section>
        );
      })}
      {error && <p className="err">{error}</p>}
      <Footer buttons={[{ label: 'Cancel', onClick: back }, { label: 'Assign', onClick: ok }]} />
    </>
  );
}

/** From a student: pick one published exercise. */
export function AssignToStudent({ studentId }: { studentId: string }) {
  const db = useDb();
  const [due, setDue] = useState<string | undefined>();
  const [exerciseId, setExerciseId] = useState('');
  const [error, setError] = useState('');
  const s = db.students.find(x => x.id === studentId);
  if (!s) return <NotFound />;

  const already = new Set(db.assignments.filter(a => a.studentId === s.id).map(a => a.exerciseId));
  const published = db.exercises.filter(e => e.status === 'published');
  const ok = () => {
    if (!exerciseId) return setError('Choose an exercise.');
    assign([s.id], exerciseId, due);
    back();
  };

  return (
    <>
      <p>Student: <b>{s.name}</b></p>
      <DueDate value={due} onChange={setDue} />
      <p>Choose a published exercise:</p>
      {published.length ? published.map(e => (
        <label key={e.id} className="row">
          <input type="radio" name="exercise" disabled={already.has(e.id)} checked={exerciseId === e.id}
            onChange={() => setExerciseId(e.id)} /> {e.title}
          <br /><small>{KINDS[e.kind].label}{already.has(e.id) && ' · already assigned'}</small>
        </label>
      )) : <p>No published exercises.</p>}
      {error && <p className="err">{error}</p>}
      <Footer buttons={[{ label: 'Cancel', onClick: back }, { label: 'Assign', onClick: ok }]} />
    </>
  );
}
