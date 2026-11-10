import { filterExercises, isOpen, lastSubmitted, studentGroups, type ExerciseShow } from '../model/derived';
import { daysAgo, formatTimestamp, friendlyDay } from '../model/format';
import { assign, useDb } from '../model/store';
import { back, backWith, go, linkTo } from '../nav/nav';
import { usePageState } from '../nav/pageState';
import { Badge } from '../ui/Badge';
import { useDrawer } from '../ui/drawerContext';
import { DueDateDrawer } from '../ui/DueDateDrawer';
import { ExerciseCard } from '../ui/ExerciseCard';
import { Footer } from '../ui/Footer';
import { ActionLink, Empty, Field } from '../ui/rows';
import { ExerciseFilters, ExerciseRow, NewExerciseDrawer } from './Exercises';

/**
 * Give one exercise to some students. Where you came from can preset the exercise (from an exercise)
 * or tick a student (from a student). Choices live in page state, so they survive the exercise picker.
 */
export function Assign({ exerciseId: presetExercise, studentId }: { exerciseId?: string; studentId?: string }) {
  const db = useDb();
  const drawer = useDrawer();
  const [exerciseId] = usePageState('exerciseId', presetExercise);
  const [due, setDue] = usePageState<string | undefined>('due', undefined);
  const [picked, setPicked] = usePageState<string[]>('students', studentId ? [studentId] : []);

  const e = db.exercises.find(x => x.id === exerciseId && x.status === 'published');
  // Blocked: the student hasn't finished this exercise's current assignment. Submitted ones can be assigned again.
  const already = new Set(e ? db.assignments.filter(a => a.exerciseId === e.id && isOpen(a)).map(a => a.studentId) : []);
  const chosen = picked.filter(id => !already.has(id));
  const toggle = (ids: string[], on: boolean) =>
    setPicked(on ? [...new Set([...picked, ...ids])] : picked.filter(id => !ids.includes(id)));
  const ok = () => {
    if (!e) return;
    assign(chosen, e.id, due);
    back();
  };

  return (
    <>
      <h3>Exercise</h3>
      {e
        ? <>
          <ExerciseCard e={e} onClick={linkTo({ page: 'exercise', id: e.id })} />
          <ActionLink onClick={() => go({ page: 'chooseExercise' })}>Choose a different exercise</ActionLink>
        </>
        : <>
          <Empty>None</Empty>
          <ActionLink onClick={() => go({ page: 'chooseExercise' })}>Choose exercise</ActionLink>
        </>}
      <Field label="Due date" value={due ? friendlyDay(due) : 'No due date'}
        onClick={() => drawer.open(<DueDateDrawer onPick={setDue} />)} />

      <h3>Students</h3>
      <p><small>Tick a class to select all of it.</small></p>
      {studentGroups(db).map(g => {
        const free = g.students.filter(s => !already.has(s.id)).map(s => s.id);
        const all = free.length > 0 && free.every(id => picked.includes(id));
        return (
          <section key={g.label}>
            <h4><label>
              <input type="checkbox" disabled={!free.length} checked={all} onChange={ev => toggle(free, ev.target.checked)} /> {g.label}
            </label></h4>
            {g.students.map(s => {
              const before = e && !already.has(s.id) ? lastSubmitted(db, s.id, e.id) : undefined;
              return (
                <label key={s.id} className="row">
                  <input type="checkbox" disabled={already.has(s.id)} checked={chosen.includes(s.id)}
                    onChange={ev => toggle([s.id], ev.target.checked)} /> {s.name}
                  {already.has(s.id) && <> <Badge>Already assigned</Badge></>}
                  {before?.dateSubmitted && <><br /><small>Submitted {daysAgo(formatTimestamp(before.dateSubmitted))}</small></>}
                </label>
              );
            })}
          </section>
        );
      })}
      <Footer buttons={[
        { label: 'Cancel', onClick: back },
        { label: chosen.length ? `Assign (${chosen.length})` : 'Assign', onClick: ok, disabled: !e || !chosen.length },
      ]} />
    </>
  );
}

/** Pick a published exercise for Assign: one tap picks it and goes back. */
export function ChooseExercise() {
  const db = useDb();
  const drawer = useDrawer();
  const [search, setSearch] = usePageState('search', '');
  const [show, setShow] = usePageState<ExerciseShow>('show', 'all');
  const published = db.exercises.filter(e => e.status === 'published');
  const list = filterExercises(db, published, search, show);
  return (
    <>
      <ExerciseFilters search={search} setSearch={setSearch} show={show} setShow={setShow} />
      {list.length
        ? list.map(e => <ExerciseRow key={e.id} e={e} onClick={() => backWith('exerciseId', e.id)} />)
        : <Empty>{published.length ? 'No published exercise matches.' : 'No published exercises yet.'}</Empty>}
      <p><small>Only published exercises are listed. Drafts are in Exercises.</small></p>
      <ActionLink onClick={() => drawer.open(<NewExerciseDrawer />)}>New exercise</ActionLink>
    </>
  );
}
