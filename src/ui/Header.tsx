import { Fragment } from 'react';
import { signOut, useSession } from '../model/session';
import { useDb } from '../model/store';
import { back, crumb, resetToHome, useStack } from '../nav/nav';
import { routeTitle } from '../nav/titles';
import { ConfirmDrawer } from './Drawer';
import { useDrawer } from './drawerContext';
import { ActionLink } from './rows';

/**
 * Top line: small crumbs for everything above the parent, and "Hi Noa" at the right (tap to sign out).
 * Then a Back button labeled with the parent. On Home, only the greeting.
 * The current page's own title is the page heading, not part of the header.
 */
export function Header() {
  const stack = useStack();
  const db = useDb();
  const session = useSession();
  const drawer = useDrawer();
  if (!session) return null;
  const me = session.role === 'student'
    ? db.students.find(s => s.id === session.studentId)
    : db.teachers.find(t => t.id === session.teacherId);
  const name = me?.name.split(' ')[0] ?? '';
  const code = me?.securityCode ?? '';
  const trail = stack;
  // While a student is working, leaving is Pause (or Submit), not Back.
  const top = stack[stack.length - 1].route;
  const working = top.page === 'work' && db.assignments.find(a => a.id === top.id)?.state === 'active';
  const parent = trail.length > 1 && !working ? trail[trail.length - 2] : undefined;
  const above = trail.slice(0, -2);
  return (
    <header>
      <div id="topline">
        <span id="crumbs">
          {above.map((s, i) => (
            <Fragment key={s.key}>
              {i > 0 && ' › '}
              <ActionLink onClick={() => crumb(i)}>{routeTitle(db, s.route)}</ActionLink>
            </Fragment>
          ))}
          {above.length > 0 && ' ›'}
        </span>
        <ActionLink onClick={() => drawer.open(
          <ConfirmDrawer title="Sign out?" message={`To sign in again you'll need your code: ${code}`}
            confirmLabel="Sign out" onConfirm={() => { signOut(); resetToHome(); }} />)}>Hi {name}</ActionLink>
      </div>
      {parent && <button id="back" onClick={back}>‹ {routeTitle(db, parent.route)}</button>}
    </header>
  );
}
