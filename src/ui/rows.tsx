import { Fragment, type KeyboardEvent, type ReactNode } from 'react';

function clickable(onClick?: () => void) {
  return onClick
    ? { onClick, role: 'button', tabIndex: 0, onKeyDown: (e: KeyboardEvent) => { if (e.key === 'Enter') onClick(); } }
    : {};
}

/** A list row: label, optional line under it, `›` when tappable. */
export function Row({ label, sub, onClick }: { label: ReactNode; sub?: ReactNode; onClick?: () => void }) {
  return (
    <div className="row" {...clickable(onClick)}>
      {onClick && <span className="chev">›</span>}
      {label}
      {sub ? <><br /><small>{sub}</small></> : null}
    </div>
  );
}

/** A detail-page row: small label, value below, `›` when tappable. */
export function Field({ label, value, onClick }: { label: string; value: ReactNode; onClick?: () => void }) {
  return (
    <div className="row" {...clickable(onClick)}>
      {onClick && <span className="chev">›</span>}
      <small>{label}</small>
      <br />
      {value}
    </div>
  );
}

/** A link that runs an action, standing on its own (not inside a sentence), so it has no underline. */
export function ActionLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return <a href="#" className="standalone" onClick={e => { e.preventDefault(); onClick(); }}>{children}</a>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p><small>{children}</small></p>;
}

/**
 * Read-only facts as a compact two-column list ("Assigned   Today, Mon 9-Nov").
 * Facts with no value are left out, so only what has happened shows.
 */
export function Facts({ items }: { items: [label: string, value: ReactNode][] }) {
  const shown = items.filter(([, v]) => v !== undefined && v !== null && v !== false && v !== '');
  if (!shown.length) return null;
  return (
    <dl className="facts">
      {shown.map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>)}
    </dl>
  );
}
