import { useState, type MouseEvent } from 'react';
import { addDays, friendlyDay, today } from '../model/format';
import type { DateString } from '../model/types';
import { DrawerShell } from './Drawer';
import { useDrawer } from './drawerContext';

/**
 * A menu for setting a due date: today and the next four days (with weekday), Other (the
 * browser's calendar picker), or No due date. One tap applies and closes; like every menu
 * drawer, it doesn't show the current value.
 */
export function DueDateDrawer({ title = 'Due date', onPick }: {
  title?: string; onPick: (date: DateString | undefined) => void;
}) {
  const { close } = useDrawer();
  const [showOther, setShowOther] = useState(false);
  const pick = (d: DateString | undefined) => { onPick(d); close(); };
  const t = today();
  const days = [0, 1, 2, 3, 4].map(n => {
    const d = addDays(t, n);
    return { d, label: friendlyDay(d, true) };
  });
  // Open the browser's calendar on the hidden date input next to the menu.
  const other = (ev: MouseEvent) => {
    const el = ev.currentTarget.parentElement?.parentElement?.querySelector<HTMLInputElement>('input[type=date]');
    setShowOther(true);
    if (!el) return;
    try { el.showPicker(); } catch { el.focus(); }
  };
  const item = (key: string, label: string, onClick: (ev: MouseEvent) => void) => (
    <div key={key} className="row" role="button" tabIndex={0} onClick={onClick}>{label}</div>
  );
  return (
    <DrawerShell title={title} actions={false}>
      <div className="menu">
        {days.map(x => item(x.d, x.label, () => pick(x.d)))}
        {item('other', 'Other', other)}
        {item('none', 'No due date', () => pick(undefined))}
      </div>
      {/* The browser's own calendar, opened by Other. Out of sight until Other is tapped, then shown
          as a fallback for browsers that can't open the picker directly. */}
      <p className={showOther ? undefined : 'offscreen'}>
        <label>Other date <input type="date" min={t}
          onChange={e => { if (e.target.value) pick(e.target.value); }} /></label>
      </p>
    </DrawerShell>
  );
}
