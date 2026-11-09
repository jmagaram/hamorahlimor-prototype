import { useState } from 'react';
import { isOpen } from '../model/derived';
import { addStudent, deleteStudents, regenerateSecurityCode, renameStudent, setStudentsClass, useDb } from '../model/store';
import { go } from '../nav/nav';
import { ConfirmDrawer, DrawerShell, InputDrawer, PickDrawer } from '../ui/Drawer';
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
  const ids = db.classes.flatMap(c => db.students.filter(s => s.className === c.name).map(s => s.id));
  const classOptions = db.classes.map(c => ({ label: c.name, value: c.name }));
  return (
    <>
      <SelectAllBar sel={sel} ids={ids} />
      {db.classes.map(c => {
        const students = db.students.filter(s => s.className === c.name);
        return (
          <section key={c.name}>
            <h3>{c.name}</h3>
            {students.length ? students.map(s => {
              const open = db.assignments.filter(a => a.studentId === s.id && isOpen(a)).length;
              return <SelectableRow key={s.id} sel={sel} id={s.id} label={s.name}
                sub={open ? `${open} open assignments` : ''} onClick={() => go({ page: 'student', id: s.id })} />;
            }) : <Empty>No students</Empty>}
          </section>
        );
      })}
      <Footer buttons={sel.selecting ? [
        { label: 'Cancel', onClick: sel.cancel },
        {
          label: `Change class (${sel.count})`, disabled: !sel.count,
          onClick: () => drawer.open(<PickDrawer title="Move to class" options={classOptions} showCurrent={false}
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

function AddStudentDrawer() {
  const db = useDb();
  const { close } = useDrawer();
  const [name, setName] = useState('');
  const [className, setClassName] = useState(db.classes[0]?.name ?? '');
  const [error, setError] = useState('');
  const done = () => {
    if (!className) return setError('Add a class first.');
    const err = addStudent(name, className);
    if (err) setError(err); else close();
  };
  return (
    <DrawerShell title="Add student" error={error}
      actions={<><button onClick={close}>Cancel</button><button onClick={done}>Done</button></>}>
      <p><label>Name<br /><input className="wide" type="text" autoFocus value={name} onChange={e => setName(e.target.value)} /></label></p>
      <p><label>Class<br />
        <select value={className} onChange={e => setClassName(e.target.value)}>
          {db.classes.map(c => <option key={c.name}>{c.name}</option>)}
        </select>
      </label></p>
      <p><small>A security code is created automatically.</small></p>
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
      <Field label="Class" value={s.className}
        onClick={() => drawer.open(<PickDrawer title="Class" options={db.classes.map(c => ({ label: c.name, value: c.name }))}
          current={s.className} onPick={v => setStudentsClass([id], v)} />)} />
      <Field label="Security code" value="••••  (tap to show)" onClick={() => drawer.open(<SecurityCodeDrawer id={id} />)} />
      <Field label="Created" value={s.dateCreated} />
      <h3>Assignments</h3>
      <GroupedAssignments assignments={db.assignments.filter(a => a.studentId === id)}
        label={a => title(a.exerciseId)} sub={a => 'Due ' + a.dueDate} />
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
