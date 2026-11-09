import { Fragment } from 'react';
import { useDb } from '../model/store';
import { back, crumb, home, useStack } from '../nav/nav';
import { routeTitle } from '../nav/titles';
import { ActionLink } from './rows';

/** Home, Back, then the breadcrumb of the navigation stack. */
export function Header() {
  const stack = useStack();
  const db = useDb();
  const atHome = stack.length < 2;
  return (
    <header>
      <button onClick={home} disabled={atHome}>⌂ Home</button>
      <button onClick={back} disabled={atHome}>‹ Back</button>
      <span id="crumbs">
        {stack.map((s, i) => (
          <Fragment key={s.key}>
            {i > 0 && ' › '}
            {i < stack.length - 1
              ? <ActionLink onClick={() => crumb(i)}>{routeTitle(db, s.route)}</ActionLink>
              : <b>{routeTitle(db, s.route)}</b>}
          </Fragment>
        ))}
      </span>
    </header>
  );
}
