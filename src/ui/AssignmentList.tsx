import type { ReactNode } from 'react';
import { attentionOrder, displayStatus, isOverdue, repeatSuffix, STATUS_COLOR } from '../model/derived';
import { dueText, formatTimestamp, friendlyDayInline, today } from '../model/format';
import { useDb } from '../model/store';
import type { Assignment } from '../model/types';
import { linkTo } from '../nav/nav';
import { Badge } from './Badge';
import { Empty } from './rows';
import { SelectableRow } from './selection';
import type { Selection } from './useSelection';

/**
 * One flat list of assignments, "needs you first" (attentionOrder). Each row says its own status
 * with a badge, then the caller's context and the relevant date. Rows open Assignment detail.
 */
export function AssignmentList({ assignments, label, context, sel }: {
  assignments: Assignment[];
  label: (a: Assignment) => ReactNode;
  /** Extra words for the line under the label, e.g. the student's class. */
  context?: (a: Assignment) => string | undefined;
  sel?: Selection;
}) {
  const db = useDb();
  const t = today();
  if (!assignments.length) return <Empty>No assignments.</Empty>;
  return (
    <>
      {attentionOrder(db, assignments, t).map(a => {
        const status = displayStatus(db, a);
        const when = a.dateSubmitted ? `submitted ${friendlyDayInline(formatTimestamp(a.dateSubmitted))}` : dueText(a.dueDate);
        const words = [context?.(a), when].filter(Boolean).join(' · ');
        return (
          <SelectableRow key={a.id} sel={sel} id={a.id}
            label={<>{label(a)}{repeatSuffix(db, a)}</>}
            sub={<>
              <Badge color={STATUS_COLOR[status]}>{status}</Badge>
              {isOverdue(a, t) && <> <Badge color="red">Overdue</Badge></>}
              {words && <> {words}</>}
            </>}
            onClick={linkTo({ page: 'assignment', id: a.id })} />
        );
      })}
    </>
  );
}
