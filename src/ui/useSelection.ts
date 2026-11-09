import { useState } from 'react';

/** Select mode for a list page. State lives in the page, so leaving the page exits it. */
export function useSelection() {
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  return {
    selecting,
    selected,
    count: selected.size,
    start: () => { setSelecting(true); setSelected(new Set()); },
    cancel: () => { setSelecting(false); setSelected(new Set()); },
    toggle: (id: string, on: boolean) => setSelected(s => {
      const n = new Set(s);
      if (on) n.add(id); else n.delete(id);
      return n;
    }),
    setAll: (ids: string[], on: boolean) => setSelected(on ? new Set(ids) : new Set()),
  };
}
export type Selection = ReturnType<typeof useSelection>;
