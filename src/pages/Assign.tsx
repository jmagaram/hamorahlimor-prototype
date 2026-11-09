import { useState } from 'react';
import { KINDS } from '../model/derived';
import { addDays, today } from '../model/format';
import { assign, useDb } from '../model/store';
import { back } from '../nav/nav';
import { Footer } from '../ui/Footer';
import { NotFound } from './NotFound';

function DueDate({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <p><label>Due date <input type="date" value={value} onChange={e => onChange(e.target.value)} /></label></p>;
}

/** From an exercise: pick students. */
export function AssignToStudents({ exerciseId }: { exerciseId: string }) {
  const db = useDb();
  const [due, setDue] = useState(() => addDays(today(), 7));
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
    if (!due) return setError('Choose a due date.');
    assign(picked, e.id, due);
    back();
  };

  return (
    <>
      <p>Exercise: <b>{e.title}</b></p>
      <DueDate value={due} onChange={setDue} />
      <p>Choose students. Tick a class to select all of it.</p>
      {db.classes.map(c => {
        const students = db.students.filter(s => s.className === c.name);
        const free = students.filter(s => !already.has(s.id)).map(s => s.id);
        const all = free.length > 0 && free.every(id => picked.has(id));
        return (
          <section key={c.name}>
            <h3><label>
              <input type="checkbox" disabled={!free.length} checked={all} onChange={ev => toggle(free, ev.target.checked)} /> {c.name}
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
  const [due, setDue] = useState(() => addDays(today(), 7));
  const [exerciseId, setExerciseId] = useState('');
  const [error, setError] = useState('');
  const s = db.students.find(x => x.id === studentId);
  if (!s) return <NotFound />;

  const already = new Set(db.assignments.filter(a => a.studentId === s.id).map(a => a.exerciseId));
  const published = db.exercises.filter(e => e.status === 'published');
  const ok = () => {
    if (!exerciseId) return setError('Choose an exercise.');
    if (!due) return setError('Choose a due date.');
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
