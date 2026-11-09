import { Fragment } from 'react';
import { useDb } from '../model/store';
import { back, crumb, useStack } from '../nav/nav';
import { routeTitle } from '../nav/titles';
import { ActionLink } from './rows';

/**
 * The trail above the current page: small crumbs for everything above the parent,
 * then a Back button labeled with the parent. Not shown on Home.
 * The current page's own title is the page heading, not part of the header.
 */
export function Header() {
  const stack = useStack();
  const db = useDb();
  if (stack.length < 2) return null;
  const parent = stack[stack.length - 2];
  const above = stack.slice(0, -2);
  return (
    <header>
      {above.length > 0 && (
        <span id="crumbs">
          {above.map((s, i) => (
            <Fragment key={s.key}>
              {i > 0 && ' › '}
              <ActionLink onClick={() => crumb(i)}>{routeTitle(db, s.route)}</ActionLink>
            </Fragment>
          ))}
          {' ›'}
        </span>
      )}
      <button id="back" onClick={back}>‹ {routeTitle(db, parent.route)}</button>
    </header>
  );
}
