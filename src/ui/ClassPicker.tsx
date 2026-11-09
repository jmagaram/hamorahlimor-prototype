import { useState } from 'react';
import { classNames } from '../model/derived';
import { useDb } from '../model/store';
import { NEW, NONE, type ClassChoice } from './classChoice';
import { DrawerShell } from './Drawer';
import { useDrawer } from './drawerContext';

/**
 * A class picker on its own in a drawer. Tapping an existing class or "No class"
 * applies it and closes; typing a new class and tapping OK applies that.
 */
export function ClassPickDrawer({ title = 'Class', current, showCurrent = true, onPick }: {
  title?: string; current?: string; showCurrent?: boolean; onPick: (className: string | undefined) => void;
}) {
  const db = useDb();
  const { close } = useDrawer();
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const pick = (c: string | undefined) => { onPick(c); close(); };
  const ok = () => {
    if (!text.trim()) return setError('Enter a class name.');
    pick(text);
  };
  const mark = (on: boolean) => (showCurrent ? (on ? '● ' : '○ ') : '');
  return (
    <DrawerShell title={title} error={error}
      actions={<><button onClick={close}>Cancel</button><button onClick={ok}>OK</button></>}>
      {classNames(db).map(c => (
        <div key={c} className="row" role="button" tabIndex={0} onClick={() => pick(c)}>{mark(c === current)}{c}</div>
      ))}
      <div className="row" role="button" tabIndex={0} onClick={() => pick(undefined)}>{mark(!current)}No class</div>
      <p><label>New class<br />
        <input className="wide" type="text" value={text}
          onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') ok(); }} />
      </label></p>
    </DrawerShell>
  );
}

/** Class radios for a drawer form: each class in use, "No class", and "New" with a text field. */
export function ClassRadios({ value, onChange }: { value: ClassChoice; onChange: (v: ClassChoice) => void }) {
  const db = useDb();
  const radio = (choice: string, label: string) => (
    <label key={choice} style={{ display: 'block', padding: '6px 0' }}>
      <input type="radio" name="class" checked={value.choice === choice} onChange={() => onChange({ ...value, choice })} /> {label}
    </label>
  );
  return (
    <fieldset>
      <legend>Class</legend>
      {classNames(db).map(c => radio(c, c))}
      {radio(NONE, 'No class')}
      <label style={{ display: 'block', padding: '6px 0' }}>
        <input type="radio" name="class" checked={value.choice === NEW} onChange={() => onChange({ ...value, choice: NEW })} /> New:{' '}
        <input type="text" value={value.text}
          onFocus={() => onChange({ ...value, choice: NEW })}
          onChange={e => onChange({ choice: NEW, text: e.target.value })} />
      </label>
    </fieldset>
  );
}
