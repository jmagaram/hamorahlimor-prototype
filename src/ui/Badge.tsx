import type { ReactNode } from 'react';
import type { BadgeColor } from '../model/derived';

/** A small pill for a status, e.g. "In progress". Colors are named; see `.badge-*` in index.css. */
export function Badge({ color = 'gray', children }: { color?: BadgeColor; children: ReactNode }) {
  return <span className={`badge badge-${color}`}>{children}</span>;
}
