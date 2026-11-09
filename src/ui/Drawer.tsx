import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { DrawerContext, useDrawer } from './drawerContext';
import { getStack, useStack, type StackEntry } from '../nav/nav';

let openCount = 0;

/**
 * One drawer at a time. It belongs to the navigation stack it was opened on,
 * so any navigation (even back to the same page) closes it.
 */
export function DrawerProvider({ children }: { children: ReactNode }) {
  const stack = useStack();
  const [drawer, setDrawer] = useState<{ node: ReactNode; stack: StackEntry[]; n: number } | null>(null);
  const open = useCallback((node: ReactNode) => setDrawer({ node, stack: getStack(), n: ++openCount }), []);
  const close = useCallback(() => setDrawer(null), []);
  const api = useMemo(() => ({ open, close }), [open, close]);
  const shown = drawer && drawer.stack === stack ? drawer : null;
  return (
    <DrawerContext.Provider value={api}>
      {children}
      {shown && (
        <>
          <div id="bg" onClick={close} />
          {/* key: each open starts with fresh state */}
          <div id="drawer" key={shown.n}>{shown.node}</div>
        </>
      )}
    </DrawerContext.Provider>
  );
}

/** Title, content, inline error, then the action buttons. */
export function DrawerShell({ title, error, actions, children }: {
  title: ReactNode; error?: string; actions?: ReactNode; children?: ReactNode;
}) {
  const { close } = useDrawer();
  return (
    <>
      <h3>{title}</h3>
      {children}
      {error && <p className="err">{error}</p>}
      <div className="bar">{actions ?? <button onClick={close}>Close</button>}</div>
    </>
  );
}

/** A single input. onDone returns an error message to keep the drawer open. */
export function InputDrawer({ title, initial, type = 'text', doneLabel = 'Done', onDone }: {
  title: string; initial: string; type?: 'text' | 'date'; doneLabel?: string; onDone: (value: string) => string | void;
}) {
  const { close } = useDrawer();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState('');
  const done = () => {
    const err = onDone(value);
    if (err) setError(err);
    else close();
  };
  return (
    <DrawerShell title={title} error={error}
      actions={<><button onClick={close}>Cancel</button><button onClick={done}>{doneLabel}</button></>}>
      <input className="wide" type={type} value={value} autoFocus
        onChange={e => setValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') done(); }} />
    </DrawerShell>
  );
}

export interface PickOption<T> { label: string; sub?: string; value: T }

/** An option list. Tapping an option applies it and closes the drawer. */
export function PickDrawer<T>({ title, options, current, showCurrent = true, onPick }: {
  title: string; options: PickOption<T>[]; current?: T; showCurrent?: boolean; onPick: (value: T) => void;
}) {
  const { close } = useDrawer();
  return (
    <DrawerShell title={title} actions={<button onClick={close}>Cancel</button>}>
      {options.map((o, i) => (
        <div key={i} className="row" role="button" tabIndex={0}
          onClick={() => { onPick(o.value); close(); }}>
          {showCurrent && (o.value === current ? '● ' : '○ ')}{o.label}
          {o.sub && <><br /><small>{o.sub}</small></>}
        </div>
      ))}
    </DrawerShell>
  );
}

export function ConfirmDrawer({ title, message, confirmLabel, onConfirm }: {
  title: string; message?: string; confirmLabel: string; onConfirm: () => void;
}) {
  const { close } = useDrawer();
  return (
    <DrawerShell title={title}
      actions={<><button onClick={close}>Cancel</button><button onClick={() => { close(); onConfirm(); }}>{confirmLabel}</button></>}>
      {message && <p>{message}</p>}
    </DrawerShell>
  );
}
