import type { KeyboardEvent, ReactNode } from 'react';

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

/** A link that runs an action. */
export function ActionLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return <a href="#" onClick={e => { e.preventDefault(); onClick(); }}>{children}</a>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p><small>{children}</small></p>;
}
