import { isOpen } from '../model/derived';
import { addClass, deleteClass, useDb } from '../model/store';
import { back, go } from '../nav/nav';
import { InputDrawer } from '../ui/Drawer';
import { useDrawer } from '../ui/drawerContext';
import { Footer } from '../ui/Footer';
import { Empty, Row } from '../ui/rows';
import { NotFound } from './NotFound';
import { AddStudentDrawer } from './Students';

export function Classes() {
  const db = useDb();
  const drawer = useDrawer();
  return (
    <>
      {db.classes.length ? db.classes.map(c => (
        <Row key={c.name} label={c.name}
          sub={`${db.students.filter(s => s.className === c.name).length} students`}
          onClick={() => go({ page: 'class', name: c.name })} />
      )) : <Empty>No classes yet.</Empty>}
      <Footer buttons={[
        { label: 'Add class', onClick: () => drawer.open(<InputDrawer title="Add class" initial="" doneLabel="OK" onDone={addClass} />) },
      ]} />
    </>
  );
}

export function Class({ name }: { name: string }) {
  const db = useDb();
  const drawer = useDrawer();
  if (!db.classes.some(c => c.name === name)) return <NotFound />;
  const students = db.students.filter(s => s.className === name).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <>
      <h3>Students</h3>
      {students.length ? students.map(s => {
        const open = db.assignments.filter(a => a.studentId === s.id && isOpen(a)).length;
        return <Row key={s.id} label={s.name} sub={open ? `${open} open assignments` : ''}
          onClick={() => go({ page: 'student', id: s.id })} />;
      }) : <Empty>No students in this class.</Empty>}
      <Footer buttons={[
        { label: 'Add student', onClick: () => drawer.open(<AddStudentDrawer className={name} />) },
        ...(students.length ? [] : [{
          label: 'Delete class',
          onClick: () => { deleteClass(name); back(); },
        }]),
      ]} />
    </>
  );
}
