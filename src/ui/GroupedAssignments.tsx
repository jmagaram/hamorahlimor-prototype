import type { ReactNode } from 'react';
import { DISPLAY_STATUSES, displayStatus, isOverdue, repeatSuffix } from '../model/derived';
import { today } from '../model/format';
import { useDb } from '../model/store';
import type { Assignment } from '../model/types';
import { linkTo } from '../nav/nav';
import { Badge } from './Badge';
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
  const t = today();
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
              <SelectableRow key={a.id} sel={sel} id={a.id} sub={sub(a)}
                label={<>{label(a)}{repeatSuffix(db, a)}{isOverdue(a, t) && <> <Badge color="red">Overdue</Badge></>}</>}
                onClick={linkTo({ page: 'assignment', id: a.id })} />
            ))}
          </section>
        );
      })}
    </>
  );
}
