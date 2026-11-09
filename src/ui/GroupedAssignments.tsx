import type { ReactNode } from 'react';
import { DISPLAY_STATUSES, displayStatus } from '../model/derived';
import { useDb } from '../model/store';
import type { Assignment } from '../model/types';
import { go } from '../nav/nav';
import { Empty } from './rows';
import { SelectableRow } from './selection';
import type { Selection } from './useSelection';

/** Assignments grouped by display status, in the standard order. Rows open Assignment detail. */
export function GroupedAssignments({ assignments, label, sub, sel, nested }: {
  assignments: Assignment[];
  label: (a: Assignment) => ReactNode;
  sub: (a: Assignment) => ReactNode;
  sel?: Selection;
  /** Under another heading: status groups use a smaller heading. */
  nested?: boolean;
}) {
  const db = useDb();
  if (!assignments.length) return <Empty>No assignments.</Empty>;
  return (
    <>
      {DISPLAY_STATUSES.map(status => {
        const xs = assignments.filter(a => displayStatus(db, a) === status);
        if (!xs.length) return null;
        return (
          <section key={status}>
            {nested ? <h4>{status}</h4> : <h3>{status}</h3>}
            {xs.map(a => (
              <SelectableRow key={a.id} sel={sel} id={a.id} label={label(a)} sub={sub(a)}
                onClick={() => go({ page: 'assignment', id: a.id })} />
            ))}
          </section>
        );
      })}
    </>
  );
}
