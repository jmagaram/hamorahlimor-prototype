import { addClass, deleteClass, useDb } from '../model/store';
import { go } from '../nav/nav';
import { DrawerShell, InputDrawer } from '../ui/Drawer';
import { useDrawer } from '../ui/drawerContext';
import { Footer } from '../ui/Footer';
import { Empty, Row } from '../ui/rows';

export function Classes() {
  const db = useDb();
  const drawer = useDrawer();
  return (
    <>
      {db.classes.length ? db.classes.map(c => (
        <Row key={c.name} label={c.name}
          sub={`${db.students.filter(s => s.className === c.name).length} students`}
          onClick={() => drawer.open(<ClassDrawer name={c.name} />)} />
      )) : <Empty>No classes yet.</Empty>}
      <Footer buttons={[
        { label: 'Add class', onClick: () => drawer.open(<InputDrawer title="Add class" initial="" onDone={addClass} />) },
      ]} />
    </>
  );
}

function ClassDrawer({ name }: { name: string }) {
  const db = useDb();
  const { close } = useDrawer();
  const students = db.students.filter(s => s.className === name);
  return (
    <DrawerShell title={name}>
      {students.length
        ? <>
            {students.map(s => <Row key={s.id} label={s.name} onClick={() => go({ page: 'student', id: s.id })} />)}
            <p><small>Move students to another class before deleting this one.</small></p>
          </>
        : <>
            <p>No students in this class.</p>
            <p><button onClick={() => { deleteClass(name); close(); }}>Delete class</button></p>
          </>}
    </DrawerShell>
  );
}
