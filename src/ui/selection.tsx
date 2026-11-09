import type { ReactNode } from 'react';
import type { Selection } from './useSelection';
import { Row } from './rows';

/** "Select all · N selected" bar. Renders nothing outside select mode. */
export function SelectAllBar({ sel, ids }: { sel: Selection; ids: string[] }) {
  if (!sel.selecting) return null;
  const all = ids.length > 0 && ids.every(id => sel.selected.has(id));
  return (
    <p>
      <label><input type="checkbox" checked={all} onChange={e => sel.setAll(ids, e.target.checked)} /> Select all</label>
      {' · '}{sel.count} selected
    </p>
  );
}

/** A row that becomes a checkbox in select mode. */
export function SelectableRow({ sel, id, label, sub, onClick }: {
  sel?: Selection; id: string; label: ReactNode; sub?: ReactNode; onClick?: () => void;
}) {
  if (!sel?.selecting) return <Row label={label} sub={sub} onClick={onClick} />;
  return (
    <label className="row">
      <input type="checkbox" checked={sel.selected.has(id)} onChange={e => sel.toggle(id, e.target.checked)} />{' '}
      {label}
      {sub ? <><br /><small>{sub}</small></> : null}
    </label>
  );
}
