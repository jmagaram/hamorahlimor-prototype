import { useState } from 'react';
import { classNames, isOpen, studentGroups } from '../model/derived';
import { addStudent, deleteStudents, getDb, regenerateSecurityCode, renameStudent, setStudentsClass, useDb } from '../model/store';
import { go } from '../nav/nav';
import { ClassPickDrawer, ClassRadios } from '../ui/ClassPicker';
import { initialClassChoice, resolveClassChoice } from '../ui/classChoice';
import { dayLabel } from '../model/format';
import { ConfirmDrawer, DrawerShell, InputDrawer } from '../ui/Drawer';
import { useDrawer } from '../ui/drawerContext';
import { Footer } from '../ui/Footer';
import { GroupedAssignments } from '../ui/GroupedAssignments';
import { Empty, Field } from '../ui/rows';
import { SelectAllBar, SelectableRow } from '../ui/selection';
import { useSelection } from '../ui/useSelection';
import { NotFound } from './NotFound';

export function Students() {
  const db = useDb();
  const drawer = useDrawer();
  const sel = useSelection();
  const groups = studentGroups(db);
  const ids = groups.flatMap(g => g.students.map(s => s.id));
  return (
    <>
      <SelectAllBar sel={sel} ids={ids} />
      {groups.length ? groups.map(g => (
        <section key={g.label}>
          <h3>{g.label}</h3>
          {g.students.map(s => {
            const open = db.assignments.filter(a => a.studentId === s.id && isOpen(a)).length;
            return <SelectableRow key={s.id} sel={sel} id={s.id} label={s.name}
              sub={open ? `${open} open assignments` : ''} onClick={() => go({ page: 'student', id: s.id })} />;
          })}
        </section>
      )) : <Empty>No students yet.</Empty>}
      <Footer buttons={sel.selecting ? [
        { label: 'Cancel', onClick: sel.cancel },
        {
          label: `Change class (${sel.count})`, disabled: !sel.count,
          onClick: () => drawer.open(<ClassPickDrawer title="Move to class" showCurrent={false}
            onPick={v => { setStudentsClass(sel.selected, v); sel.cancel(); }} />),
        },
        {
          label: `Delete (${sel.count})`, disabled: !sel.count,
          onClick: () => drawer.open(<ConfirmDrawer title={`Delete ${sel.count} students?`}
            message="Their assignments, answers and feedback are deleted too." confirmLabel="Delete"
            onConfirm={() => { deleteStudents(sel.selected); sel.cancel(); }} />),
        },
      ] : [
        { label: 'Select', onClick: sel.start },
        { label: 'Add student', onClick: () => drawer.open(<AddStudentDrawer />) },
      ]} />
    </>
  );
}

/** The class picked for the last student added, offered first for the next one. */
let lastClass: string | undefined;

function AddStudentDrawer() {
  const { close } = useDrawer();
  const [name, setName] = useState('');
  // The last class may have emptied out since; then start with "No class".
  const [cls, setCls] = useState(() => initialClassChoice(classNames(getDb()).find(c => c === lastClass)));
  const [error, setError] = useState('');
  const done = () => {
    const { className, error: classError } = resolveClassChoice(cls);
    if (classError) return setError(classError);
    const err = addStudent(name, className);
    if (err) return setError(err);
    lastClass = getDb().students.at(-1)?.className;
    close();
  };
  return (
    <DrawerShell title="Add student" error={error}
      actions={<><button onClick={close}>Cancel</button><button onClick={done}>OK</button></>}>
      <p><label>Name<br /><input className="wide" type="text" autoFocus value={name} onChange={e => setName(e.target.value)} /></label></p>
      <ClassRadios value={cls} onChange={setCls} />
    </DrawerShell>
  );
}

export function Student({ id }: { id: string }) {
  const db = useDb();
  const drawer = useDrawer();
  const s = db.students.find(x => x.id === id);
  if (!s) return <NotFound />;
  const title = (exerciseId: string) => db.exercises.find(e => e.id === exerciseId)?.title;
  return (
    <>
      <Field label="Name" value={s.name}
        onClick={() => drawer.open(<InputDrawer title="Name" initial={s.name} onDone={v => renameStudent(id, v)} />)} />
      <Field label="Class" value={s.className ?? 'No class'}
        onClick={() => drawer.open(<ClassPickDrawer current={s.className} onPick={v => setStudentsClass([id], v)} />)} />
      <Field label="Security code" value="••••  (tap to show)" onClick={() => drawer.open(<SecurityCodeDrawer id={id} />)} />
      <Field label="Created" value={s.dateCreated} />
      <h3>Assignments</h3>
      <GroupedAssignments assignments={db.assignments.filter(a => a.studentId === id)}
        label={a => title(a.exerciseId)} sub={a => (a.dueDate ? `Due ${dayLabel(a.dueDate)}` : '')} />
      <Footer buttons={[{ label: 'Assign exercise', onClick: () => go({ page: 'assignToStudent', studentId: id }) }]} />
    </>
  );
}

function SecurityCodeDrawer({ id }: { id: string }) {
  const s = useDb().students.find(x => x.id === id);
  if (!s) return null;
  return (
    <DrawerShell title="Security code">
      <p style={{ fontSize: 36, letterSpacing: 6, margin: '8px 0' }}><b>{s.securityCode}</b></p>
      <p><small>{s.name} signs in with this code.</small></p>
      <button onClick={() => regenerateSecurityCode(id)}>Generate new code</button>
    </DrawerShell>
  );
}
